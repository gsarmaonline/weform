package domain

import "time"

type FormStatus string

const (
	FormStatusDraft     FormStatus = "draft"
	FormStatusPublished FormStatus = "published"
	FormStatusClosed    FormStatus = "closed"
	FormStatusArchived  FormStatus = "archived"
)

type Form struct {
	ID                   string     `json:"id"`
	WorkspaceID          string     `json:"workspaceId"`
	CreatedBy            string     `json:"createdBy"`
	Title                string     `json:"title"`
	Slug                 string     `json:"slug"`
	Status               FormStatus `json:"status"`
	Description          *string    `json:"description"`
	CachedResponseCount  int        `json:"cachedResponseCount"`
	CachedCompletionRate *float64   `json:"cachedCompletionRate"`
	CreatedAt            time.Time  `json:"createdAt"`
	UpdatedAt            time.Time  `json:"updatedAt"`
}
