package service

import (
	"context"
	"fmt"

	"github.com/gsarmaonline/weform/internal/domain"
	"github.com/gsarmaonline/weform/internal/repository"
)

type LogicService struct {
	logic     *repository.LogicRepository
	forms     *repository.FormRepository
	workspaces *repository.WorkspaceRepository
}

func NewLogicService(logic *repository.LogicRepository, forms *repository.FormRepository, workspaces *repository.WorkspaceRepository) *LogicService {
	return &LogicService{logic: logic, forms: forms, workspaces: workspaces}
}

func (s *LogicService) checkAccess(ctx context.Context, userID, workspaceID, formID string) error {
	member, err := s.workspaces.GetMember(ctx, workspaceID, userID)
	if err != nil || member == nil {
		return fmt.Errorf("forbidden")
	}
	form, err := s.forms.GetByID(ctx, formID, workspaceID)
	if err != nil || form == nil {
		return fmt.Errorf("not found")
	}
	return nil
}

func (s *LogicService) GetRules(ctx context.Context, userID, workspaceID, formID string) ([]*domain.LogicRule, error) {
	if err := s.checkAccess(ctx, userID, workspaceID, formID); err != nil {
		return nil, err
	}
	return s.logic.GetByFormID(ctx, formID)
}

func (s *LogicService) CreateRule(ctx context.Context, userID, workspaceID string, rule *domain.LogicRule) (*domain.LogicRule, error) {
	if err := s.checkAccess(ctx, userID, workspaceID, rule.FormID); err != nil {
		return nil, err
	}
	return s.logic.CreateRule(ctx, rule)
}

func (s *LogicService) UpdateRule(ctx context.Context, userID, workspaceID string, rule *domain.LogicRule) (*domain.LogicRule, error) {
	if err := s.checkAccess(ctx, userID, workspaceID, rule.FormID); err != nil {
		return nil, err
	}
	return s.logic.UpdateRule(ctx, rule)
}

func (s *LogicService) DeleteRule(ctx context.Context, userID, workspaceID, formID, ruleID string) error {
	if err := s.checkAccess(ctx, userID, workspaceID, formID); err != nil {
		return err
	}
	return s.logic.DeleteRule(ctx, ruleID)
}
