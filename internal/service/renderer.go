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

type RendererService struct {
	responses *repository.ResponseRepository
	logic     *repository.LogicRepository
	workflows *WorkflowService
}

func NewRendererService(responses *repository.ResponseRepository, logic *repository.LogicRepository, workflows *WorkflowService) *RendererService {
	return &RendererService{responses: responses, logic: logic, workflows: workflows}
}

func (s *RendererService) GetPublicForm(ctx context.Context, slug string) (*domain.PublicForm, error) {
	form, err := s.responses.GetFormBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}

	rules, err := s.logic.GetByFormID(ctx, form.ID)
	if err != nil {
		return nil, err
	}
	form.LogicRules = rules

	return form, nil
}

type StartSessionResult struct {
	SessionToken string `json:"sessionToken"`
	ResponseID   string `json:"responseId"`
}

func (s *RendererService) StartSession(ctx context.Context, formID string, ip, userAgent, referrer *string) (*StartSessionResult, error) {
	token, err := generateToken()
	if err != nil {
		return nil, err
	}

	res, err := s.responses.CreateResponse(ctx, formID, token, ip, userAgent, referrer)
	if err != nil {
		return nil, err
	}

	return &StartSessionResult{SessionToken: res.SessionToken, ResponseID: res.ID}, nil
}

type SubmitAnswerInput struct {
	FieldID   string           `json:"fieldId"`
	FieldRef  string           `json:"fieldRef"`
	FieldType domain.FieldType `json:"fieldType"`
	Value     json.RawMessage  `json:"value"`
}

func (s *RendererService) Submit(ctx context.Context, sessionToken string, inputs []SubmitAnswerInput) (*domain.FormResponse, error) {
	if len(inputs) == 0 {
		return nil, fmt.Errorf("no answers provided")
	}

	row := s.responses.DB().QueryRow(ctx,
		`SELECT id, form_id FROM form_responses WHERE session_token = $1`, sessionToken)
	var responseID, formID string
	if err := row.Scan(&responseID, &formID); err != nil {
		return nil, fmt.Errorf("session not found")
	}

	answers := make([]domain.ResponseAnswer, len(inputs))
	for i, inp := range inputs {
		answers[i] = domain.ResponseAnswer{
			ResponseID: responseID,
			FieldID:    inp.FieldID,
			FieldRef:   inp.FieldRef,
			FieldType:  inp.FieldType,
			Value:      inp.Value,
		}
	}
	if err := s.responses.SaveAnswers(ctx, responseID, answers); err != nil {
		return nil, err
	}

	result, err := s.responses.SubmitResponse(ctx, sessionToken)
	if err != nil {
		return nil, err
	}

	// Fire workflows asynchronously
	go s.workflows.Execute(formID, answers)

	return result, nil
}

func generateToken() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
