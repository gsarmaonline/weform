package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gsarmaonline/weform/internal/api/middleware"
	"github.com/gsarmaonline/weform/internal/domain"
	"github.com/gsarmaonline/weform/internal/service"
	"github.com/gsarmaonline/weform/pkg/apierr"
)

type LogicHandler struct {
	svc *service.LogicService
}

func NewLogicHandler(svc *service.LogicService) *LogicHandler {
	return &LogicHandler{svc: svc}
}

func (h *LogicHandler) GetRules(c *gin.Context) {
	userID := c.Value(middleware.ContextKeyUserID).(string)
	rules, err := h.svc.GetRules(c.Request.Context(), userID, c.Param("workspaceID"), c.Param("formID"))
	if err != nil {
		apierr.Internal(c)
		return
	}
	c.JSON(http.StatusOK, gin.H{"rules": rules})
}

func (h *LogicHandler) CreateRule(c *gin.Context) {
	userID := c.Value(middleware.ContextKeyUserID).(string)
	var rule domain.LogicRule
	if err := c.ShouldBindJSON(&rule); err != nil {
		apierr.BadRequest(c, err.Error())
		return
	}
	rule.FormID = c.Param("formID")
	out, err := h.svc.CreateRule(c.Request.Context(), userID, c.Param("workspaceID"), &rule)
	if err != nil {
		apierr.Internal(c)
		return
	}
	c.JSON(http.StatusCreated, out)
}

func (h *LogicHandler) UpdateRule(c *gin.Context) {
	userID := c.Value(middleware.ContextKeyUserID).(string)
	var rule domain.LogicRule
	if err := c.ShouldBindJSON(&rule); err != nil {
		apierr.BadRequest(c, err.Error())
		return
	}
	rule.FormID = c.Param("formID")
	rule.ID = c.Param("ruleID")
	out, err := h.svc.UpdateRule(c.Request.Context(), userID, c.Param("workspaceID"), &rule)
	if err != nil {
		apierr.Internal(c)
		return
	}
	c.JSON(http.StatusOK, out)
}

func (h *LogicHandler) DeleteRule(c *gin.Context) {
	userID := c.Value(middleware.ContextKeyUserID).(string)
	if err := h.svc.DeleteRule(c.Request.Context(), userID, c.Param("workspaceID"), c.Param("formID"), c.Param("ruleID")); err != nil {
		apierr.Internal(c)
		return
	}
	c.Status(http.StatusNoContent)
}
