package handlers

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/gsarmaonline/weform/internal/service"
)

// TestAuthHandler provides a login shortcut for automated tests.
// Only active when ENV=test — never enabled in production.
type TestAuthHandler struct {
	auth *service.AuthService
}

func NewTestAuthHandler(auth *service.AuthService) *TestAuthHandler {
	return &TestAuthHandler{auth: auth}
}

func (h *TestAuthHandler) TestLogin(c *gin.Context) {
	if os.Getenv("ENV") != "test" {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	var body struct {
		Email string `json:"email" binding:"required,email"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	token, err := h.auth.IssueTokenForEmail(c.Request.Context(), body.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token})
}
