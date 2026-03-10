package service

import (
	"context"
	"fmt"

	"github.com/gsarmaonline/weform/internal/domain"
	"github.com/gsarmaonline/weform/internal/repository"
)

type WorkspaceService struct {
	workspaces *repository.WorkspaceRepository
}

func NewWorkspaceService(workspaces *repository.WorkspaceRepository) *WorkspaceService {
	return &WorkspaceService{workspaces: workspaces}
}

func (s *WorkspaceService) ListForUser(ctx context.Context, userID string) ([]*domain.Workspace, error) {
	return s.workspaces.ListByUser(ctx, userID)
}

func (s *WorkspaceService) Create(ctx context.Context, name, ownerID string) (*domain.Workspace, error) {
	base := repository.SlugFromName(name)
	if base == "" {
		return nil, fmt.Errorf("invalid workspace name")
	}
	slug, err := s.workspaces.UniqueSlug(ctx, base)
	if err != nil {
		return nil, err
	}
	return s.workspaces.Create(ctx, name, slug, ownerID)
}

// GetForUser returns the workspace only if the user is a member.
func (s *WorkspaceService) GetForUser(ctx context.Context, workspaceID, userID string) (*domain.Workspace, error) {
	member, err := s.workspaces.GetMember(ctx, workspaceID, userID)
	if err != nil {
		return nil, err
	}
	if member == nil {
		return nil, nil
	}
	return s.workspaces.GetByID(ctx, workspaceID)
}

// EnsureDefault creates a default workspace for new users if they have none.
func (s *WorkspaceService) EnsureDefault(ctx context.Context, userID, userName string) (*domain.Workspace, error) {
	existing, err := s.workspaces.ListByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	if len(existing) > 0 {
		return existing[0], nil
	}
	name := userName + "'s workspace"
	return s.Create(ctx, name, userID)
}
