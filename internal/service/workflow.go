package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/smtp"
	"strings"
	"time"

	"github.com/gsarmaonline/weform/internal/config"
	"github.com/gsarmaonline/weform/internal/domain"
	"github.com/gsarmaonline/weform/internal/repository"
)

type WorkflowService struct {
	workflows  *repository.WorkflowRepository
	forms      *repository.FormRepository
	workspaces *repository.WorkspaceRepository
	smtp       config.SMTPConfig
}

func NewWorkflowService(workflows *repository.WorkflowRepository, forms *repository.FormRepository, workspaces *repository.WorkspaceRepository, smtp config.SMTPConfig) *WorkflowService {
	return &WorkflowService{workflows: workflows, forms: forms, workspaces: workspaces, smtp: smtp}
}

func (s *WorkflowService) checkAccess(ctx context.Context, userID, workspaceID, formID string) error {
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

func (s *WorkflowService) List(ctx context.Context, userID, workspaceID, formID string) ([]*domain.Workflow, error) {
	if err := s.checkAccess(ctx, userID, workspaceID, formID); err != nil {
		return nil, err
	}
	return s.workflows.ListByFormID(ctx, formID)
}

func (s *WorkflowService) Create(ctx context.Context, userID, workspaceID string, wf *domain.Workflow) (*domain.Workflow, error) {
	if err := s.checkAccess(ctx, userID, workspaceID, wf.FormID); err != nil {
		return nil, err
	}
	return s.workflows.Create(ctx, wf)
}

func (s *WorkflowService) Update(ctx context.Context, userID, workspaceID, formID string, wf *domain.Workflow) (*domain.Workflow, error) {
	if err := s.checkAccess(ctx, userID, workspaceID, formID); err != nil {
		return nil, err
	}
	return s.workflows.Update(ctx, wf)
}

func (s *WorkflowService) Delete(ctx context.Context, userID, workspaceID, formID, workflowID string) error {
	if err := s.checkAccess(ctx, userID, workspaceID, formID); err != nil {
		return err
	}
	return s.workflows.Delete(ctx, workflowID)
}

func (s *WorkflowService) AddAction(ctx context.Context, userID, workspaceID, formID string, a *domain.WorkflowAction) (*domain.WorkflowAction, error) {
	if err := s.checkAccess(ctx, userID, workspaceID, formID); err != nil {
		return nil, err
	}
	return s.workflows.AddAction(ctx, a)
}

func (s *WorkflowService) UpdateAction(ctx context.Context, userID, workspaceID, formID string, a *domain.WorkflowAction) (*domain.WorkflowAction, error) {
	if err := s.checkAccess(ctx, userID, workspaceID, formID); err != nil {
		return nil, err
	}
	return s.workflows.UpdateAction(ctx, a)
}

func (s *WorkflowService) DeleteAction(ctx context.Context, userID, workspaceID, formID, actionID string) error {
	if err := s.checkAccess(ctx, userID, workspaceID, formID); err != nil {
		return err
	}
	return s.workflows.DeleteAction(ctx, actionID)
}

// Execute runs all enabled on_submission workflows for a form. Called after response is submitted.
func (s *WorkflowService) Execute(formID string, answers []domain.ResponseAnswer) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	workflows, err := s.workflows.GetEnabledByFormID(ctx, formID, domain.TriggerOnSubmission)
	if err != nil {
		return
	}

	for _, wf := range workflows {
		for _, action := range wf.Actions {
			switch action.Type {
			case domain.ActionWebhook:
				s.fireWebhook(action, answers)
			case domain.ActionEmailNotification:
				s.sendEmailNotification(action, answers)
			}
		}
	}
}

type webhookConfig struct {
	URL     string            `json:"url"`
	Method  string            `json:"method"`
	Headers map[string]string `json:"headers"`
}

func (s *WorkflowService) fireWebhook(action *domain.WorkflowAction, answers []domain.ResponseAnswer) {
	var cfg webhookConfig
	if err := json.Unmarshal(action.Config, &cfg); err != nil || cfg.URL == "" {
		return
	}
	method := cfg.Method
	if method == "" {
		method = "POST"
	}

	payload := map[string]interface{}{"answers": answers, "timestamp": time.Now().UTC()}
	body, _ := json.Marshal(payload)

	req, err := http.NewRequest(method, cfg.URL, bytes.NewReader(body))
	if err != nil {
		return
	}
	req.Header.Set("Content-Type", "application/json")
	for k, v := range cfg.Headers {
		req.Header.Set(k, v)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return
	}
	resp.Body.Close()
}

type emailNotificationConfig struct {
	To                  []string `json:"to"`
	Subject             string   `json:"subject"`
	IncludeResponseData bool     `json:"includeResponseData"`
}

func (s *WorkflowService) sendEmailNotification(action *domain.WorkflowAction, answers []domain.ResponseAnswer) {
	if s.smtp.Host == "" {
		return
	}
	var cfg emailNotificationConfig
	if err := json.Unmarshal(action.Config, &cfg); err != nil || len(cfg.To) == 0 {
		return
	}

	subject := cfg.Subject
	if subject == "" {
		subject = "New form response"
	}

	var body strings.Builder
	body.WriteString("You have received a new form response.\r\n\r\n")
	if cfg.IncludeResponseData {
		for _, a := range answers {
			body.WriteString(fmt.Sprintf("%s: %s\r\n", a.FieldRef, string(a.Value)))
		}
	}

	msg := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\n\r\n%s",
		s.smtp.From,
		strings.Join(cfg.To, ", "),
		subject,
		body.String(),
	)

	addr := fmt.Sprintf("%s:%d", s.smtp.Host, s.smtp.Port)
	var auth smtp.Auth
	if s.smtp.Username != "" {
		auth = smtp.PlainAuth("", s.smtp.Username, s.smtp.Password, s.smtp.Host)
	}
	_ = smtp.SendMail(addr, auth, s.smtp.From, cfg.To, []byte(msg))
}
