package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gsarmaonline/weform/internal/service"
	"github.com/gsarmaonline/weform/pkg/apierr"
)

type RendererHandler struct {
	renderer *service.RendererService
}

func NewRendererHandler(renderer *service.RendererService) *RendererHandler {
	return &RendererHandler{renderer: renderer}
}

// GetPublicForm returns a published form for the renderer (no auth).
func (h *RendererHandler) GetPublicForm(c *gin.Context) {
	slug := c.Param("slug")

	form, err := h.renderer.GetPublicForm(c.Request.Context(), slug)
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

// StartSession creates a response session for a form.
func (h *RendererHandler) StartSession(c *gin.Context) {
	slug := c.Param("slug")

	// Resolve form ID from slug
	form, err := h.renderer.GetPublicForm(c.Request.Context(), slug)
	if err != nil || form == nil {
		apierr.NotFound(c, "form")
		return
	}

	ip := c.ClientIP()
	ua := c.Request.UserAgent()
	ref := c.Request.Referer()

	result, err := h.renderer.StartSession(c.Request.Context(), form.ID, &ip, &ua, &ref)
	if err != nil {
		apierr.Internal(c)
		return
	}
	c.JSON(http.StatusCreated, result)
}

// SubmitResponse saves all answers and marks the response submitted.
func (h *RendererHandler) SubmitResponse(c *gin.Context) {
	var body struct {
		SessionToken string                       `json:"sessionToken" binding:"required"`
		Answers      []service.SubmitAnswerInput  `json:"answers" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		apierr.BadRequest(c, "sessionToken and answers are required")
		return
	}

	resp, err := h.renderer.Submit(c.Request.Context(), body.SessionToken, body.Answers)
	if err != nil {
		apierr.Respond(c, http.StatusUnprocessableEntity, "SUBMIT_FAILED", err.Error())
		return
	}
	if resp == nil {
		apierr.NotFound(c, "session")
		return
	}
	c.JSON(http.StatusOK, resp)
}
