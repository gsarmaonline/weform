package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gsarmaonline/weform/internal/api/middleware"
	"github.com/gsarmaonline/weform/internal/domain"
	"github.com/gsarmaonline/weform/internal/service"
	"github.com/gsarmaonline/weform/pkg/apierr"
)

type WorkflowHandler struct {
	svc *service.WorkflowService
}

func NewWorkflowHandler(svc *service.WorkflowService) *WorkflowHandler {
	return &WorkflowHandler{svc: svc}
}

func (h *WorkflowHandler) List(c *gin.Context) {
	userID := c.Value(middleware.ContextKeyUserID).(string)
	workflows, err := h.svc.List(c.Request.Context(), userID, c.Param("workspaceID"), c.Param("formID"))
	if err != nil {
		apierr.Internal(c)
		return
	}
	c.JSON(http.StatusOK, gin.H{"workflows": workflows})
}

func (h *WorkflowHandler) Create(c *gin.Context) {
	userID := c.Value(middleware.ContextKeyUserID).(string)
	var wf domain.Workflow
	if err := c.ShouldBindJSON(&wf); err != nil {
		apierr.BadRequest(c, err.Error())
		return
	}
	wf.FormID = c.Param("formID")
	out, err := h.svc.Create(c.Request.Context(), userID, c.Param("workspaceID"), &wf)
	if err != nil {
		apierr.Internal(c)
		return
	}
	c.JSON(http.StatusCreated, out)
}

func (h *WorkflowHandler) Update(c *gin.Context) {
	userID := c.Value(middleware.ContextKeyUserID).(string)
	var wf domain.Workflow
	if err := c.ShouldBindJSON(&wf); err != nil {
		apierr.BadRequest(c, err.Error())
		return
	}
	wf.ID = c.Param("workflowID")
	out, err := h.svc.Update(c.Request.Context(), userID, c.Param("workspaceID"), c.Param("formID"), &wf)
	if err != nil {
		apierr.Internal(c)
		return
	}
	c.JSON(http.StatusOK, out)
}

func (h *WorkflowHandler) Delete(c *gin.Context) {
	userID := c.Value(middleware.ContextKeyUserID).(string)
	if err := h.svc.Delete(c.Request.Context(), userID, c.Param("workspaceID"), c.Param("formID"), c.Param("workflowID")); err != nil {
		apierr.Internal(c)
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *WorkflowHandler) AddAction(c *gin.Context) {
	userID := c.Value(middleware.ContextKeyUserID).(string)
	var a domain.WorkflowAction
	if err := c.ShouldBindJSON(&a); err != nil {
		apierr.BadRequest(c, err.Error())
		return
	}
	a.WorkflowID = c.Param("workflowID")
	out, err := h.svc.AddAction(c.Request.Context(), userID, c.Param("workspaceID"), c.Param("formID"), &a)
	if err != nil {
		apierr.Internal(c)
		return
	}
	c.JSON(http.StatusCreated, out)
}

func (h *WorkflowHandler) UpdateAction(c *gin.Context) {
	userID := c.Value(middleware.ContextKeyUserID).(string)
	var a domain.WorkflowAction
	if err := c.ShouldBindJSON(&a); err != nil {
		apierr.BadRequest(c, err.Error())
		return
	}
	a.ID = c.Param("actionID")
	a.WorkflowID = c.Param("workflowID")
	out, err := h.svc.UpdateAction(c.Request.Context(), userID, c.Param("workspaceID"), c.Param("formID"), &a)
	if err != nil {
		apierr.Internal(c)
		return
	}
	c.JSON(http.StatusOK, out)
}

func (h *WorkflowHandler) DeleteAction(c *gin.Context) {
	userID := c.Value(middleware.ContextKeyUserID).(string)
	if err := h.svc.DeleteAction(c.Request.Context(), userID, c.Param("workspaceID"), c.Param("formID"), c.Param("actionID")); err != nil {
		apierr.Internal(c)
		return
	}
	c.Status(http.StatusNoContent)
}
