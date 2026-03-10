package apierr

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Error struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func Respond(c *gin.Context, status int, code, message string) {
	c.AbortWithStatusJSON(status, gin.H{"error": Error{Code: code, Message: message}})
}

func BadRequest(c *gin.Context, message string) {
	Respond(c, http.StatusBadRequest, "BAD_REQUEST", message)
}

func Unauthorized(c *gin.Context) {
	Respond(c, http.StatusUnauthorized, "UNAUTHORIZED", "authentication required")
}

func Forbidden(c *gin.Context) {
	Respond(c, http.StatusForbidden, "FORBIDDEN", "access denied")
}

func NotFound(c *gin.Context, resource string) {
	Respond(c, http.StatusNotFound, "NOT_FOUND", resource+" not found")
}

func Internal(c *gin.Context) {
	Respond(c, http.StatusInternalServerError, "INTERNAL_ERROR", "an unexpected error occurred")
}

func Conflict(c *gin.Context, message string) {
	Respond(c, http.StatusConflict, "CONFLICT", message)
}
