package domain

import "time"

type Workspace struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Slug      string    `json:"slug"`
	Plan      string    `json:"plan"`
	AvatarURL *string   `json:"avatarUrl"`
	CreatedAt time.Time `json:"createdAt"`
}

type WorkspaceMember struct {
	WorkspaceID string    `json:"workspaceId"`
	UserID      string    `json:"userId"`
	Role        string    `json:"role"`
	JoinedAt    time.Time `json:"joinedAt"`
}
