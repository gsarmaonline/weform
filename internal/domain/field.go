package domain

import (
	"encoding/json"
	"time"
)

type FieldType string

const (
	FieldTypeShortText     FieldType = "short_text"
	FieldTypeLongText      FieldType = "long_text"
	FieldTypeMultiChoice   FieldType = "multiple_choice"
	FieldTypeMultiSelect   FieldType = "multi_select"
	FieldTypeDropdown      FieldType = "dropdown"
	FieldTypeYesNo         FieldType = "yes_no"
	FieldTypeRating        FieldType = "rating"
	FieldTypeOpinionScale  FieldType = "opinion_scale"
	FieldTypeNumber        FieldType = "number"
	FieldTypeEmail         FieldType = "email"
	FieldTypePhone         FieldType = "phone"
	FieldTypeURL           FieldType = "url"
	FieldTypeDate          FieldType = "date"
	FieldTypeFileUpload    FieldType = "file_upload"
	FieldTypePictureChoice FieldType = "picture_choice"
	FieldTypeStatement     FieldType = "statement"
	FieldTypeHidden        FieldType = "hidden"
)

type FormPage struct {
	ID          string       `json:"id"`
	FormID      string       `json:"formId"`
	Title       *string      `json:"title"`
	Description *string      `json:"description"`
	Position    int          `json:"position"`
	Fields      []*FormField `json:"fields"`
	CreatedAt   time.Time    `json:"createdAt"`
	UpdatedAt   time.Time    `json:"updatedAt"`
}

type FormField struct {
	ID             string          `json:"id"`
	FormID         string          `json:"formId"`
	PageID         string          `json:"pageId"`
	Ref            string          `json:"ref"`
	Type           FieldType       `json:"type"`
	Title          string          `json:"title"`
	Description    *string         `json:"description"`
	Position       int             `json:"position"`
	IsRequired     bool            `json:"isRequired"`
	Config         json.RawMessage `json:"config"`
	Validation     json.RawMessage `json:"validation"`
	VisibilityRule json.RawMessage `json:"visibilityRule"`
	DeletedAt      *time.Time      `json:"deletedAt,omitempty"`
	CreatedAt      time.Time       `json:"createdAt"`
	UpdatedAt      time.Time       `json:"updatedAt"`
}
