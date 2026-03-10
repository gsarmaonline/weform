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
}

func NewRendererService(responses *repository.ResponseRepository) *RendererService {
	return &RendererService{responses: responses}
}

func (s *RendererService) GetPublicForm(ctx context.Context, slug string) (*domain.PublicForm, error) {
	return s.responses.GetFormBySlug(ctx, slug)
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
	FieldID   string          `json:"fieldId"`
	FieldRef  string          `json:"fieldRef"`
	FieldType domain.FieldType `json:"fieldType"`
	Value     json.RawMessage `json:"value"`
}

func (s *RendererService) Submit(ctx context.Context, sessionToken string, inputs []SubmitAnswerInput) (*domain.FormResponse, error) {
	if len(inputs) == 0 {
		return nil, fmt.Errorf("no answers provided")
	}

	// First save answers, then mark submitted
	// We need the responseID — get it via token
	// For simplicity, do a quick lookup in SaveAnswers flow:
	// We'll fetch the response by token inside the transaction in a simplified way.
	// Since we need response_id, we do a two-step approach.

	// Step 1: look up response
	row := s.responses.DB().QueryRow(ctx,
		`SELECT id FROM form_responses WHERE session_token = $1`, sessionToken)
	var responseID string
	if err := row.Scan(&responseID); err != nil {
		return nil, fmt.Errorf("session not found")
	}

	// Step 2: save answers
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

	// Step 3: mark submitted
	return s.responses.SubmitResponse(ctx, sessionToken)
}

func generateToken() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
