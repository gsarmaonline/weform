package handlers

import (
	"crypto/rand"
	"encoding/base64"
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

// GoogleInit redirects the user to Google's OAuth consent screen.
func (h *AuthHandler) GoogleInit(c *gin.Context) {
	b := make([]byte, 16)
	rand.Read(b)
	state := base64.URLEncoding.EncodeToString(b)

	// Store state in a short-lived cookie for CSRF protection
	c.SetCookie("oauth_state", state, 300, "/", "", false, true)
	c.Redirect(http.StatusTemporaryRedirect, h.auth.GoogleAuthURL(state))
}

// GoogleCallback handles the OAuth callback from Google.
func (h *AuthHandler) GoogleCallback(c *gin.Context) {
	// Validate state
	stateCookie, err := c.Cookie("oauth_state")
	if err != nil || stateCookie != c.Query("state") {
		apierr.BadRequest(c, "invalid oauth state")
		return
	}
	c.SetCookie("oauth_state", "", -1, "/", "", false, true)

	code := c.Query("code")
	if code == "" {
		apierr.BadRequest(c, "missing code")
		return
	}

	result, err := h.auth.ExchangeCode(c.Request.Context(), code)
	if err != nil {
		apierr.Respond(c, http.StatusUnauthorized, "AUTH_FAILED", err.Error())
		return
	}

	// Redirect frontend to /auth/callback?token=<jwt>
	redirectURL := h.auth.FrontendURL() + "/auth/callback?token=" + result.Token
	c.Redirect(http.StatusTemporaryRedirect, redirectURL)
}
