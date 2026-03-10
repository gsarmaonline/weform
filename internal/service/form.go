package service

import (
	"context"
	"fmt"

	"github.com/gsarmaonline/weform/internal/domain"
	"github.com/gsarmaonline/weform/internal/repository"
)

type FormService struct {
	forms      *repository.FormRepository
	workspaces *repository.WorkspaceRepository
}

func NewFormService(forms *repository.FormRepository, workspaces *repository.WorkspaceRepository) *FormService {
	return &FormService{forms: forms, workspaces: workspaces}
}

func (s *FormService) List(ctx context.Context, workspaceID, userID string) ([]*domain.Form, error) {
	if err := s.checkAccess(ctx, workspaceID, userID); err != nil {
		return nil, err
	}
	return s.forms.ListByWorkspace(ctx, workspaceID)
}

func (s *FormService) Get(ctx context.Context, workspaceID, formID, userID string) (*domain.Form, error) {
	if err := s.checkAccess(ctx, workspaceID, userID); err != nil {
		return nil, err
	}
	return s.forms.GetByID(ctx, formID, workspaceID)
}

func (s *FormService) Create(ctx context.Context, workspaceID, userID, title string) (*domain.Form, error) {
	if err := s.checkAccess(ctx, workspaceID, userID); err != nil {
		return nil, err
	}

	base := repository.SlugFromName(title)
	if base == "" {
		base = "untitled-form"
	}
	slug, err := s.forms.UniqueSlug(ctx, workspaceID, base)
	if err != nil {
		return nil, err
	}

	return s.forms.Create(ctx, workspaceID, userID, title, slug)
}

func (s *FormService) Update(ctx context.Context, workspaceID, formID, userID string, fields map[string]any) (*domain.Form, error) {
	if err := s.checkAccess(ctx, workspaceID, userID); err != nil {
		return nil, err
	}
	return s.forms.Update(ctx, formID, workspaceID, fields)
}

func (s *FormService) Publish(ctx context.Context, workspaceID, formID, userID string) (*domain.Form, error) {
	if err := s.checkAccess(ctx, workspaceID, userID); err != nil {
		return nil, err
	}
	return s.forms.Update(ctx, formID, workspaceID, map[string]any{"status": "published"})
}

func (s *FormService) Delete(ctx context.Context, workspaceID, formID, userID string) error {
	if err := s.checkAccess(ctx, workspaceID, userID); err != nil {
		return err
	}
	return s.forms.Delete(ctx, formID, workspaceID)
}

func (s *FormService) checkAccess(ctx context.Context, workspaceID, userID string) error {
	member, err := s.workspaces.GetMember(ctx, workspaceID, userID)
	if err != nil {
		return err
	}
	if member == nil {
		return fmt.Errorf("access denied")
	}
	return nil
}
