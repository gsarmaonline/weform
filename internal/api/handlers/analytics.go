package handlers

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/gsarmaonline/weform/internal/api/middleware"
	"github.com/gsarmaonline/weform/internal/repository"
	"github.com/gsarmaonline/weform/internal/service"
	"github.com/gsarmaonline/weform/pkg/apierr"
)

type AnalyticsHandler struct {
	analytics  *repository.AnalyticsRepository
	workspaces *service.WorkspaceService
}

func NewAnalyticsHandler(analytics *repository.AnalyticsRepository, workspaces *service.WorkspaceService) *AnalyticsHandler {
	return &AnalyticsHandler{analytics: analytics, workspaces: workspaces}
}

func (h *AnalyticsHandler) GetStats(c *gin.Context) {
	userID := c.GetString(middleware.ContextKeyUserID)
	workspaceID := c.Param("workspaceID")
	formID := c.Param("formID")

	if err := h.checkAccess(c, workspaceID, userID); err != nil {
		return
	}

	stats, err := h.analytics.GetFormStats(c.Request.Context(), formID)
	if err != nil {
		apierr.Internal(c)
		return
	}

	fieldStats, err := h.analytics.GetFieldStats(c.Request.Context(), formID)
	if err != nil {
		apierr.Internal(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"overview": stats,
		"fields":   fieldStats,
	})
}

func (h *AnalyticsHandler) ListResponses(c *gin.Context) {
	userID := c.GetString(middleware.ContextKeyUserID)
	workspaceID := c.Param("workspaceID")
	formID := c.Param("formID")

	if err := h.checkAccess(c, workspaceID, userID); err != nil {
		return
	}

	limit := 50
	offset := 0
	if l := c.Query("limit"); l != "" {
		if v, err := strconv.Atoi(l); err == nil && v > 0 && v <= 200 {
			limit = v
		}
	}
	if o := c.Query("offset"); o != "" {
		if v, err := strconv.Atoi(o); err == nil && v >= 0 {
			offset = v
		}
	}

	responses, total, err := h.analytics.ListResponses(c.Request.Context(), formID, limit, offset)
	if err != nil {
		apierr.Internal(c)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":   responses,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

func (h *AnalyticsHandler) ExportCSV(c *gin.Context) {
	userID := c.GetString(middleware.ContextKeyUserID)
	workspaceID := c.Param("workspaceID")
	formID := c.Param("formID")

	if err := h.checkAccess(c, workspaceID, userID); err != nil {
		return
	}

	responses, _, err := h.analytics.ListResponses(c.Request.Context(), formID, 10000, 0)
	if err != nil {
		apierr.Internal(c)
		return
	}

	c.Header("Content-Type", "text/csv")
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="responses-%s.csv"`, formID))

	w := csv.NewWriter(c.Writer)
	_ = w.Write([]string{"Response ID", "Email", "Submitted At", "Time (s)", "Field Ref", "Field Type", "Value"})

	for _, r := range responses {
		if len(r.Answers) == 0 {
			_ = w.Write([]string{r.ID, strPtr(r.RespondentEmail), strPtr(r.SubmittedAt), intPtr(r.TimeToCompleteSeconds), "", "", ""})
			continue
		}
		for _, a := range r.Answers {
			val := ""
			var v interface{}
			if err := json.Unmarshal(a.Value, &v); err == nil {
				val = fmt.Sprintf("%v", v)
			}
			_ = w.Write([]string{r.ID, strPtr(r.RespondentEmail), strPtr(r.SubmittedAt), intPtr(r.TimeToCompleteSeconds), a.FieldRef, string(a.FieldType), val})
		}
	}
	w.Flush()
}

func (h *AnalyticsHandler) checkAccess(c *gin.Context, workspaceID, userID string) error {
	ws, err := h.workspaces.GetForUser(c.Request.Context(), workspaceID, userID)
	if err != nil || ws == nil {
		apierr.Forbidden(c)
		return fmt.Errorf("forbidden")
	}
	return nil
}

func strPtr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func intPtr(i *int) string {
	if i == nil {
		return ""
	}
	return strconv.Itoa(*i)
}
