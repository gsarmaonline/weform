package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gsarmaonline/weform/internal/api/middleware"
	"github.com/gsarmaonline/weform/internal/service"
	"github.com/gsarmaonline/weform/pkg/apierr"
)

type WorkspaceHandler struct {
	workspaces *service.WorkspaceService
}

func NewWorkspaceHandler(workspaces *service.WorkspaceService) *WorkspaceHandler {
	return &WorkspaceHandler{workspaces: workspaces}
}

func (h *WorkspaceHandler) List(c *gin.Context) {
	userID := c.GetString(middleware.ContextKeyUserID)
	workspaces, err := h.workspaces.ListForUser(c.Request.Context(), userID)
	if err != nil {
		apierr.Internal(c)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": workspaces})
}

func (h *WorkspaceHandler) Create(c *gin.Context) {
	userID := c.GetString(middleware.ContextKeyUserID)

	var body struct {
		Name string `json:"name" binding:"required,min=1,max=100"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		apierr.BadRequest(c, "name is required")
		return
	}

	ws, err := h.workspaces.Create(c.Request.Context(), body.Name, userID)
	if err != nil {
		apierr.Internal(c)
		return
	}
	c.JSON(http.StatusCreated, ws)
}

func (h *WorkspaceHandler) Get(c *gin.Context) {
	userID := c.GetString(middleware.ContextKeyUserID)
	workspaceID := c.Param("workspaceID")

	ws, err := h.workspaces.GetForUser(c.Request.Context(), workspaceID, userID)
	if err != nil {
		apierr.Internal(c)
		return
	}
	if ws == nil {
		apierr.NotFound(c, "workspace")
		return
	}
	c.JSON(http.StatusOK, ws)
}
