package api

import (
	"github.com/gin-gonic/gin"
	"github.com/gsarmaonline/weform/internal/api/handlers"
	"github.com/gsarmaonline/weform/internal/api/middleware"
	"github.com/gsarmaonline/weform/internal/config"
	"github.com/jackc/pgx/v5/pgxpool"
)

func NewRouter(cfg *config.Config, db *pgxpool.Pool) *gin.Engine {
	if cfg.Server.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(middleware.Logger())
	r.Use(gin.Recovery())

	// Handlers
	health := handlers.NewHealthHandler(db)

	// Public routes
	r.GET("/health", health.Check)

	v1 := r.Group("/api/v1")
	{
		// Auth (public)
		// auth := handlers.NewAuthHandler(...)
		// v1.POST("/auth/register", auth.Register)
		// v1.POST("/auth/login", auth.Login)
		// v1.POST("/auth/refresh", auth.Refresh)

		// Authenticated routes
		authed := v1.Group("")
		authed.Use(middleware.Auth(cfg.Auth.JWTSecret))
		{
			// Workspaces
			// workspaces := handlers.NewWorkspaceHandler(...)
			// authed.GET("/workspaces", workspaces.List)
			// authed.POST("/workspaces", workspaces.Create)
			// authed.GET("/workspaces/:workspaceID", workspaces.Get)

			// Forms
			// forms := handlers.NewFormHandler(...)
			// authed.GET("/workspaces/:workspaceID/forms", forms.List)
			// authed.POST("/workspaces/:workspaceID/forms", forms.Create)
			// authed.GET("/workspaces/:workspaceID/forms/:formID", forms.Get)
			// authed.PUT("/workspaces/:workspaceID/forms/:formID", forms.Update)
			// authed.DELETE("/workspaces/:workspaceID/forms/:formID", forms.Delete)

			// Responses
			// authed.GET("/workspaces/:workspaceID/forms/:formID/responses", responses.List)
		}

		// Public form submission (no auth required)
		// v1.POST("/f/:formSlug/responses", responses.Submit)
		// v1.GET("/f/:formSlug", forms.GetPublic)
	}

	return r
}
