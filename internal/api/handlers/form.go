package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gsarmaonline/weform/internal/api/middleware"
	"github.com/gsarmaonline/weform/internal/service"
	"github.com/gsarmaonline/weform/pkg/apierr"
)

type FormHandler struct {
	forms *service.FormService
}

func NewFormHandler(forms *service.FormService) *FormHandler {
	return &FormHandler{forms: forms}
}

func (h *FormHandler) List(c *gin.Context) {
	userID := c.GetString(middleware.ContextKeyUserID)
	workspaceID := c.Param("workspaceID")

	forms, err := h.forms.List(c.Request.Context(), workspaceID, userID)
	if err != nil {
		apierr.Internal(c)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": forms})
}

func (h *FormHandler) Get(c *gin.Context) {
	userID := c.GetString(middleware.ContextKeyUserID)
	workspaceID := c.Param("workspaceID")
	formID := c.Param("formID")

	form, err := h.forms.Get(c.Request.Context(), workspaceID, formID, userID)
	if err != nil {
		apierr.Internal(c)
		return
	}
	if form == nil {
		apierr.NotFound(c, "form")
		return
	}
	c.JSON(http.StatusOK, form)
}

func (h *FormHandler) Create(c *gin.Context) {
	userID := c.GetString(middleware.ContextKeyUserID)
	workspaceID := c.Param("workspaceID")

	var body struct {
		Title string `json:"title" binding:"required,min=1,max=255"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		apierr.BadRequest(c, "title is required")
		return
	}

	form, err := h.forms.Create(c.Request.Context(), workspaceID, userID, body.Title)
	if err != nil {
		if err.Error() == "access denied" {
			apierr.Forbidden(c)
			return
		}
		apierr.Internal(c)
		return
	}
	c.JSON(http.StatusCreated, form)
}

func (h *FormHandler) Update(c *gin.Context) {
	userID := c.GetString(middleware.ContextKeyUserID)
	workspaceID := c.Param("workspaceID")
	formID := c.Param("formID")

	var body struct {
		Title       *string `json:"title"`
		Description *string `json:"description"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		apierr.BadRequest(c, "invalid request body")
		return
	}

	fields := map[string]any{}
	if body.Title != nil {
		fields["title"] = *body.Title
	}
	if body.Description != nil {
		fields["description"] = *body.Description
	}

	form, err := h.forms.Update(c.Request.Context(), workspaceID, formID, userID, fields)
	if err != nil {
		apierr.Internal(c)
		return
	}
	if form == nil {
		apierr.NotFound(c, "form")
		return
	}
	c.JSON(http.StatusOK, form)
}

func (h *FormHandler) Publish(c *gin.Context) {
	userID := c.GetString(middleware.ContextKeyUserID)
	workspaceID := c.Param("workspaceID")
	formID := c.Param("formID")

	form, err := h.forms.Publish(c.Request.Context(), workspaceID, formID, userID)
	if err != nil {
		apierr.Internal(c)
		return
	}
	if form == nil {
		apierr.NotFound(c, "form")
		return
	}
	c.JSON(http.StatusOK, form)
}

func (h *FormHandler) Delete(c *gin.Context) {
	userID := c.GetString(middleware.ContextKeyUserID)
	workspaceID := c.Param("workspaceID")
	formID := c.Param("formID")

	if err := h.forms.Delete(c.Request.Context(), workspaceID, formID, userID); err != nil {
		apierr.Internal(c)
		return
	}
	c.Status(http.StatusNoContent)
}
