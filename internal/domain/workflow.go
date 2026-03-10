package domain

import (
	"encoding/json"
	"time"
)

type WorkflowTrigger string

const (
	TriggerOnSubmission WorkflowTrigger = "on_submission"
	TriggerOnCompletion WorkflowTrigger = "on_completion"
)

type WorkflowActionType string

const (
	ActionEmailNotification  WorkflowActionType = "email_notification"
	ActionEmailAutoresponder WorkflowActionType = "email_autoresponder"
	ActionWebhook            WorkflowActionType = "webhook"
)

type Workflow struct {
	ID        string           `json:"id"`
	FormID    string           `json:"formId"`
	Name      string           `json:"name"`
	IsEnabled bool             `json:"isEnabled"`
	Trigger   WorkflowTrigger  `json:"trigger"`
	Actions   []*WorkflowAction `json:"actions,omitempty"`
	CreatedAt time.Time        `json:"createdAt"`
	UpdatedAt time.Time        `json:"updatedAt"`
}

type WorkflowAction struct {
	ID         string             `json:"id"`
	WorkflowID string             `json:"workflowId"`
	Type       WorkflowActionType `json:"type"`
	Position   int                `json:"position"`
	IsEnabled  bool               `json:"isEnabled"`
	Config     json.RawMessage    `json:"config"`
}
