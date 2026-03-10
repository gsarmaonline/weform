package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gsarmaonline/weform/internal/service"
	"github.com/gsarmaonline/weform/pkg/apierr"
)

type AuthHandler struct {
	auth *service.AuthService
}

func NewAuthHandler(auth *service.AuthService) *AuthHandler {
	return &AuthHandler{auth: auth}
}

type googleAuthRequest struct {
	IDToken string `json:"idToken" binding:"required"`
}

func (h *AuthHandler) GoogleAuth(c *gin.Context) {
	var req googleAuthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apierr.BadRequest(c, "idToken is required")
		return
	}

	result, err := h.auth.ExchangeGoogleToken(c.Request.Context(), req.IDToken)
	if err != nil {
		apierr.Respond(c, http.StatusUnauthorized, "INVALID_TOKEN", err.Error())
		return
	}

	c.JSON(http.StatusOK, result)
}
