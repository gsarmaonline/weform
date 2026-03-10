package domain

import (
	"encoding/json"
	"time"
)

type ResponseStatus string

const (
	ResponseStatusInProgress ResponseStatus = "in_progress"
	ResponseStatusSubmitted  ResponseStatus = "submitted"
	ResponseStatusPartial    ResponseStatus = "partial"
)

type FormResponse struct {
	ID                      string         `json:"id"`
	FormID                  string         `json:"formId"`
	SessionToken            string         `json:"sessionToken"`
	Status                  ResponseStatus `json:"status"`
	RespondentEmail         *string        `json:"respondentEmail"`
	IPAddress               *string        `json:"-"`
	UserAgent               *string        `json:"-"`
	Referrer                *string        `json:"-"`
	HiddenFields            json.RawMessage `json:"hiddenFields,omitempty"`
	StartedAt               time.Time      `json:"startedAt"`
	SubmittedAt             *time.Time     `json:"submittedAt"`
	TimeToCompleteSeconds   *int           `json:"timeToCompleteSeconds"`
}

type ResponseAnswer struct {
	ID         string          `json:"id"`
	ResponseID string          `json:"responseId"`
	FieldID    string          `json:"fieldId"`
	FieldRef   string          `json:"fieldRef"`
	FieldType  FieldType       `json:"fieldType"`
	Value      json.RawMessage `json:"value"`
}

// PublicForm is the shape returned to the renderer — no sensitive data.
type PublicForm struct {
	ID            string      `json:"id"`
	Title         string      `json:"title"`
	Slug          string      `json:"slug"`
	Status        FormStatus  `json:"status"`
	WelcomeScreen interface{} `json:"welcomeScreen"`
	ThankYouScreen interface{} `json:"thankYouScreen"`
	Theme         interface{} `json:"theme"`
	Pages         []*FormPage `json:"pages"`
}
