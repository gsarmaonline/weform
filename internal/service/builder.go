package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"

	"github.com/gsarmaonline/weform/internal/domain"
	"github.com/gsarmaonline/weform/internal/repository"
)

type BuilderService struct {
	builder    *repository.BuilderRepository
	forms      *repository.FormRepository
	workspaces *repository.WorkspaceRepository
}

func NewBuilderService(
	builder *repository.BuilderRepository,
	forms *repository.FormRepository,
	workspaces *repository.WorkspaceRepository,
) *BuilderService {
	return &BuilderService{builder: builder, forms: forms, workspaces: workspaces}
}

// GetForm returns the full form structure including pages and fields.
func (s *BuilderService) GetForm(ctx context.Context, workspaceID, formID, userID string) (*domain.Form, []*domain.FormPage, error) {
	if err := s.checkAccess(ctx, workspaceID, userID); err != nil {
		return nil, nil, err
	}

	form, err := s.forms.GetByID(ctx, formID, workspaceID)
	if err != nil || form == nil {
		return nil, nil, err
	}

	pages, err := s.builder.ListPages(ctx, formID)
	if err != nil {
		return nil, nil, err
	}

	fields, err := s.builder.ListFields(ctx, formID)
	if err != nil {
		return nil, nil, err
	}

	// Group fields into pages
	pageMap := make(map[string]*domain.FormPage, len(pages))
	for _, p := range pages {
		pageMap[p.ID] = p
	}
	for _, f := range fields {
		if p, ok := pageMap[f.PageID]; ok {
			p.Fields = append(p.Fields, f)
		}
	}

	return form, pages, nil
}

// AddPage appends a new page to the form.
func (s *BuilderService) AddPage(ctx context.Context, workspaceID, formID, userID string) (*domain.FormPage, error) {
	if err := s.checkAccess(ctx, workspaceID, userID); err != nil {
		return nil, err
	}

	pages, err := s.builder.ListPages(ctx, formID)
	if err != nil {
		return nil, err
	}
	return s.builder.CreatePage(ctx, formID, len(pages))
}

// UpdatePage updates page title/description.
func (s *BuilderService) UpdatePage(ctx context.Context, workspaceID, formID, pageID, userID string, title, description *string) (*domain.FormPage, error) {
	if err := s.checkAccess(ctx, workspaceID, userID); err != nil {
		return nil, err
	}
	return s.builder.UpdatePage(ctx, pageID, formID, title, description)
}

// DeletePage removes a page (and its fields, via DB cascade).
func (s *BuilderService) DeletePage(ctx context.Context, workspaceID, formID, pageID, userID string) error {
	if err := s.checkAccess(ctx, workspaceID, userID); err != nil {
		return err
	}
	return s.builder.DeletePage(ctx, pageID, formID)
}

// AddField adds a new field to a page.
func (s *BuilderService) AddField(ctx context.Context, workspaceID, formID, pageID, userID string, fieldType domain.FieldType, title string, position int) (*domain.FormField, error) {
	if err := s.checkAccess(ctx, workspaceID, userID); err != nil {
		return nil, err
	}

	ref := fmt.Sprintf("field_%s", shortID())
	f := &domain.FormField{
		FormID:   formID,
		PageID:   pageID,
		Ref:      ref,
		Type:     fieldType,
		Title:    title,
		Position: position,
		Config:   json.RawMessage("{}"),
	}
	return s.builder.CreateField(ctx, f)
}

// UpdateField updates field properties.
func (s *BuilderService) UpdateField(ctx context.Context, workspaceID, formID, fieldID, userID string, updates map[string]any) (*domain.FormField, error) {
	if err := s.checkAccess(ctx, workspaceID, userID); err != nil {
		return nil, err
	}
	return s.builder.UpdateField(ctx, fieldID, formID, updates)
}

// DeleteField soft-deletes a field.
func (s *BuilderService) DeleteField(ctx context.Context, workspaceID, formID, fieldID, userID string) error {
	if err := s.checkAccess(ctx, workspaceID, userID); err != nil {
		return err
	}
	return s.builder.DeleteField(ctx, fieldID, formID)
}

// ReorderFields reorders fields within a page.
func (s *BuilderService) ReorderFields(ctx context.Context, workspaceID, formID, pageID, userID string, fieldIDs []string) error {
	if err := s.checkAccess(ctx, workspaceID, userID); err != nil {
		return err
	}
	return s.builder.ReorderFields(ctx, pageID, fieldIDs)
}

func (s *BuilderService) checkAccess(ctx context.Context, workspaceID, userID string) error {
	member, err := s.workspaces.GetMember(ctx, workspaceID, userID)
	if err != nil {
		return err
	}
	if member == nil {
		return fmt.Errorf("access denied")
	}
	return nil
}

func shortID() string {
	b := make([]byte, 4)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
