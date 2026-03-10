package api

import (
	"github.com/gin-gonic/gin"
	"github.com/gsarmaonline/weform/internal/api/handlers"
	"github.com/gsarmaonline/weform/internal/api/middleware"
	"github.com/gsarmaonline/weform/internal/config"
	"github.com/gsarmaonline/weform/internal/repository"
	"github.com/gsarmaonline/weform/internal/service"
	"github.com/jackc/pgx/v5/pgxpool"
)

func NewRouter(cfg *config.Config, db *pgxpool.Pool) *gin.Engine {
	if cfg.Server.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(middleware.Logger())
	r.Use(gin.Recovery())

	// Repositories
	userRepo := repository.NewUserRepository(db)
	workspaceRepo := repository.NewWorkspaceRepository(db)
	formRepo := repository.NewFormRepository(db)

	// Services
	workspaceSvc := service.NewWorkspaceService(workspaceRepo)
	authSvc := service.NewAuthService(
		userRepo,
		workspaceSvc,
		cfg.Auth.JWTSecret,
		cfg.Auth.JWTExpiryHours,
		cfg.Auth.GoogleClientID,
	)
	formSvc := service.NewFormService(formRepo, workspaceRepo)

	// Handlers
	health := handlers.NewHealthHandler(db)
	auth := handlers.NewAuthHandler(authSvc)
	workspaces := handlers.NewWorkspaceHandler(workspaceSvc)
	forms := handlers.NewFormHandler(formSvc)

	// Public routes
	r.GET("/health", health.Check)

	v1 := r.Group("/api/v1")
	{
		// Auth (public)
		v1.POST("/auth/google", auth.GoogleAuth)

		// Authenticated routes
		authed := v1.Group("")
		authed.Use(middleware.Auth(cfg.Auth.JWTSecret))
		{
			// Workspaces
			authed.GET("/workspaces", workspaces.List)
			authed.POST("/workspaces", workspaces.Create)
			authed.GET("/workspaces/:workspaceID", workspaces.Get)

			// Forms
			authed.GET("/workspaces/:workspaceID/forms", forms.List)
			authed.POST("/workspaces/:workspaceID/forms", forms.Create)
			authed.GET("/workspaces/:workspaceID/forms/:formID", forms.Get)
			authed.PUT("/workspaces/:workspaceID/forms/:formID", forms.Update)
			authed.POST("/workspaces/:workspaceID/forms/:formID/publish", forms.Publish)
			authed.DELETE("/workspaces/:workspaceID/forms/:formID", forms.Delete)
		}

		// Public form (no auth)
		// v1.GET("/f/:formSlug", forms.GetPublic)
		// v1.POST("/f/:formSlug/responses", responses.Submit)
	}

	return r
}
