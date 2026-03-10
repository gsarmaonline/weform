package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gsarmaonline/weform/internal/api/middleware"
	"github.com/gsarmaonline/weform/internal/domain"
	"github.com/gsarmaonline/weform/internal/service"
	"github.com/gsarmaonline/weform/pkg/apierr"
)

type BuilderHandler struct {
	builder *service.BuilderService
}

func NewBuilderHandler(builder *service.BuilderService) *BuilderHandler {
	return &BuilderHandler{builder: builder}
}

// GetFormFull returns a form with all pages and fields.
func (h *BuilderHandler) GetFormFull(c *gin.Context) {
	userID := c.GetString(middleware.ContextKeyUserID)
	workspaceID := c.Param("workspaceID")
	formID := c.Param("formID")

	form, pages, err := h.builder.GetForm(c.Request.Context(), workspaceID, formID, userID)
	if err != nil {
		apierr.Internal(c)
		return
	}
	if form == nil {
		apierr.NotFound(c, "form")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"form":  form,
		"pages": pages,
	})
}

// AddPage adds a new page to a form.
func (h *BuilderHandler) AddPage(c *gin.Context) {
	userID := c.GetString(middleware.ContextKeyUserID)
	workspaceID := c.Param("workspaceID")
	formID := c.Param("formID")

	page, err := h.builder.AddPage(c.Request.Context(), workspaceID, formID, userID)
	if err != nil {
		apierr.Internal(c)
		return
	}
	c.JSON(http.StatusCreated, page)
}

// UpdatePage updates page metadata.
func (h *BuilderHandler) UpdatePage(c *gin.Context) {
	userID := c.GetString(middleware.ContextKeyUserID)
	workspaceID := c.Param("workspaceID")
	formID := c.Param("formID")
	pageID := c.Param("pageID")

	var body struct {
		Title       *string `json:"title"`
		Description *string `json:"description"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		apierr.BadRequest(c, "invalid body")
		return
	}

	page, err := h.builder.UpdatePage(c.Request.Context(), workspaceID, formID, pageID, userID, body.Title, body.Description)
	if err != nil {
		apierr.Internal(c)
		return
	}
	if page == nil {
		apierr.NotFound(c, "page")
		return
	}
	c.JSON(http.StatusOK, page)
}

// DeletePage removes a page.
func (h *BuilderHandler) DeletePage(c *gin.Context) {
	userID := c.GetString(middleware.ContextKeyUserID)
	workspaceID := c.Param("workspaceID")
	formID := c.Param("formID")
	pageID := c.Param("pageID")

	if err := h.builder.DeletePage(c.Request.Context(), workspaceID, formID, pageID, userID); err != nil {
		apierr.Internal(c)
		return
	}
	c.Status(http.StatusNoContent)
}

// AddField adds a new field to a page.
func (h *BuilderHandler) AddField(c *gin.Context) {
	userID := c.GetString(middleware.ContextKeyUserID)
	workspaceID := c.Param("workspaceID")
	formID := c.Param("formID")
	pageID := c.Param("pageID")

	var body struct {
		Type     domain.FieldType `json:"type" binding:"required"`
		Title    string           `json:"title"`
		Position int              `json:"position"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		apierr.BadRequest(c, "type is required")
		return
	}

	field, err := h.builder.AddField(c.Request.Context(), workspaceID, formID, pageID, userID, body.Type, body.Title, body.Position)
	if err != nil {
		apierr.Internal(c)
		return
	}
	c.JSON(http.StatusCreated, field)
}

// UpdateField updates a field's properties.
func (h *BuilderHandler) UpdateField(c *gin.Context) {
	userID := c.GetString(middleware.ContextKeyUserID)
	workspaceID := c.Param("workspaceID")
	formID := c.Param("formID")
	fieldID := c.Param("fieldID")

	var raw map[string]json.RawMessage
	if err := c.ShouldBindJSON(&raw); err != nil {
		apierr.BadRequest(c, "invalid body")
		return
	}

	// Map JSON keys to DB column names
	allowed := map[string]string{
		"title":          "title",
		"description":    "description",
		"isRequired":     "is_required",
		"config":         "config",
		"validation":     "validation",
		"visibilityRule": "visibility_rule",
	}
	updates := make(map[string]any)
	for jsonKey, col := range allowed {
		if val, ok := raw[jsonKey]; ok {
			var v any
			if err := json.Unmarshal(val, &v); err == nil {
				updates[col] = v
			}
		}
	}

	field, err := h.builder.UpdateField(c.Request.Context(), workspaceID, formID, fieldID, userID, updates)
	if err != nil {
		apierr.Internal(c)
		return
	}
	if field == nil {
		apierr.NotFound(c, "field")
		return
	}
	c.JSON(http.StatusOK, field)
}

// DeleteField soft-deletes a field.
func (h *BuilderHandler) DeleteField(c *gin.Context) {
	userID := c.GetString(middleware.ContextKeyUserID)
	workspaceID := c.Param("workspaceID")
	formID := c.Param("formID")
	fieldID := c.Param("fieldID")

	if err := h.builder.DeleteField(c.Request.Context(), workspaceID, formID, fieldID, userID); err != nil {
		apierr.Internal(c)
		return
	}
	c.Status(http.StatusNoContent)
}

// ReorderFields updates field positions within a page.
func (h *BuilderHandler) ReorderFields(c *gin.Context) {
	userID := c.GetString(middleware.ContextKeyUserID)
	workspaceID := c.Param("workspaceID")
	formID := c.Param("formID")
	pageID := c.Param("pageID")

	var body struct {
		FieldIDs []string `json:"fieldIds" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		apierr.BadRequest(c, "fieldIds required")
		return
	}

	if err := h.builder.ReorderFields(c.Request.Context(), workspaceID, formID, pageID, userID, body.FieldIDs); err != nil {
		apierr.Internal(c)
		return
	}
	c.Status(http.StatusNoContent)
}
