package api

import (
	"strings"

	"github.com/gin-contrib/cors"
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

	origins := strings.Split(cfg.Server.AllowedOrigins, ",")
	r.Use(cors.New(cors.Config{
		AllowOrigins:     origins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// Repositories
	userRepo := repository.NewUserRepository(db)
	workspaceRepo := repository.NewWorkspaceRepository(db)
	formRepo := repository.NewFormRepository(db)
	builderRepo := repository.NewBuilderRepository(db)
	responseRepo := repository.NewResponseRepository(db)
	analyticsRepo := repository.NewAnalyticsRepository(db)
	logicRepo := repository.NewLogicRepository(db)
	workflowRepo := repository.NewWorkflowRepository(db)

	// Services
	workspaceSvc := service.NewWorkspaceService(workspaceRepo)
	authSvc := service.NewAuthService(userRepo, workspaceSvc, cfg.Auth.JWTSecret, cfg.Auth.JWTExpiryHours, cfg.Auth.GoogleClientID, cfg.Auth.GoogleClientSecret, cfg.Auth.GoogleRedirectURL, cfg.Auth.FrontendURL)
	formSvc := service.NewFormService(formRepo, workspaceRepo)
	builderSvc := service.NewBuilderService(builderRepo, formRepo, workspaceRepo)
	workflowSvc := service.NewWorkflowService(workflowRepo, formRepo, workspaceRepo, cfg.SMTP)
	rendererSvc := service.NewRendererService(responseRepo, logicRepo, workflowSvc)
	logicSvc := service.NewLogicService(logicRepo, formRepo, workspaceRepo)

	testAuth := handlers.NewTestAuthHandler(authSvc)

	// Handlers
	health := handlers.NewHealthHandler(db)
	auth := handlers.NewAuthHandler(authSvc)
	workspaces := handlers.NewWorkspaceHandler(workspaceSvc)
	forms := handlers.NewFormHandler(formSvc)
	builder := handlers.NewBuilderHandler(builderSvc)
	renderer := handlers.NewRendererHandler(rendererSvc)
	analytics := handlers.NewAnalyticsHandler(analyticsRepo, workspaceSvc)
	logic := handlers.NewLogicHandler(logicSvc)
	workflow := handlers.NewWorkflowHandler(workflowSvc)

	// Public
	r.GET("/health", health.Check)

	v1 := r.Group("/api/v1")

	// Auth (public)
	v1.GET("/auth/google", auth.GoogleInit)
	v1.POST("/auth/test-login", testAuth.TestLogin) // only active when ENV=test

	// OAuth callback is at root level (not under /api/v1) for clean redirect URI
	r.GET("/auth/callback", auth.GoogleCallback)

	authed := v1.Group("")
	authed.Use(middleware.Auth(cfg.Auth.JWTSecret))

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

	// Builder — full form structure + pages/fields CRUD
	authed.GET("/workspaces/:workspaceID/forms/:formID/builder", builder.GetFormFull)
	authed.POST("/workspaces/:workspaceID/forms/:formID/pages", builder.AddPage)
	authed.PUT("/workspaces/:workspaceID/forms/:formID/pages/:pageID", builder.UpdatePage)
	authed.DELETE("/workspaces/:workspaceID/forms/:formID/pages/:pageID", builder.DeletePage)
	authed.POST("/workspaces/:workspaceID/forms/:formID/pages/:pageID/fields", builder.AddField)
	authed.POST("/workspaces/:workspaceID/forms/:formID/pages/:pageID/fields/reorder", builder.ReorderFields)
	authed.PUT("/workspaces/:workspaceID/forms/:formID/fields/:fieldID", builder.UpdateField)
	authed.DELETE("/workspaces/:workspaceID/forms/:formID/fields/:fieldID", builder.DeleteField)

	// Analytics
	authed.GET("/workspaces/:workspaceID/forms/:formID/analytics", analytics.GetStats)
	authed.GET("/workspaces/:workspaceID/forms/:formID/responses", analytics.ListResponses)
	authed.GET("/workspaces/:workspaceID/forms/:formID/responses/export", analytics.ExportCSV)

	// Logic rules
	authed.GET("/workspaces/:workspaceID/forms/:formID/logic", logic.GetRules)
	authed.POST("/workspaces/:workspaceID/forms/:formID/logic", logic.CreateRule)
	authed.PUT("/workspaces/:workspaceID/forms/:formID/logic/:ruleID", logic.UpdateRule)
	authed.DELETE("/workspaces/:workspaceID/forms/:formID/logic/:ruleID", logic.DeleteRule)

	// Workflows
	authed.GET("/workspaces/:workspaceID/forms/:formID/workflows", workflow.List)
	authed.POST("/workspaces/:workspaceID/forms/:formID/workflows", workflow.Create)
	authed.PUT("/workspaces/:workspaceID/forms/:formID/workflows/:workflowID", workflow.Update)
	authed.DELETE("/workspaces/:workspaceID/forms/:formID/workflows/:workflowID", workflow.Delete)
	authed.POST("/workspaces/:workspaceID/forms/:formID/workflows/:workflowID/actions", workflow.AddAction)
	authed.PUT("/workspaces/:workspaceID/forms/:formID/workflows/:workflowID/actions/:actionID", workflow.UpdateAction)
	authed.DELETE("/workspaces/:workspaceID/forms/:formID/workflows/:workflowID/actions/:actionID", workflow.DeleteAction)

	// Public form renderer (no auth)
	v1.GET("/f/:slug", renderer.GetPublicForm)
	v1.POST("/f/:slug/sessions", renderer.StartSession)
	v1.POST("/f/:slug/submit", renderer.SubmitResponse)

	return r
}
