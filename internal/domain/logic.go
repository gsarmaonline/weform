package domain

import "time"

type LogicOperator string

const (
	LogicOperatorAll LogicOperator = "all"
	LogicOperatorAny LogicOperator = "any"
)

type DestinationType string

const (
	DestinationTypePage       DestinationType = "page"
	DestinationTypeThankYou   DestinationType = "thank_you"
	DestinationTypeURL        DestinationType = "url"
	DestinationTypeDisqualify DestinationType = "disqualify"
)

type ConditionOperator string

const (
	ConditionIs         ConditionOperator = "is"
	ConditionIsNot      ConditionOperator = "is_not"
	ConditionContains   ConditionOperator = "contains"
	ConditionNotContains ConditionOperator = "not_contains"
	ConditionGt         ConditionOperator = "gt"
	ConditionGte        ConditionOperator = "gte"
	ConditionLt         ConditionOperator = "lt"
	ConditionLte        ConditionOperator = "lte"
	ConditionIsEmpty    ConditionOperator = "is_empty"
	ConditionIsNotEmpty ConditionOperator = "is_not_empty"
)

type LogicCondition struct {
	ID       string            `json:"id"`
	RuleID   string            `json:"ruleId"`
	FieldID  string            `json:"fieldId"`
	Operator ConditionOperator `json:"operator"`
	Value    *string           `json:"value,omitempty"`
}

type LogicRule struct {
	ID                string            `json:"id"`
	FormID            string            `json:"formId"`
	SourcePageID      string            `json:"sourcePageId"`
	Position          int               `json:"position"`
	Operator          LogicOperator     `json:"operator"`
	DestinationType   DestinationType   `json:"destinationType"`
	DestinationPageID *string           `json:"destinationPageId,omitempty"`
	DestinationURL    *string           `json:"destinationUrl,omitempty"`
	Conditions        []*LogicCondition `json:"conditions"`
	CreatedAt         time.Time         `json:"createdAt"`
	UpdatedAt         time.Time         `json:"updatedAt"`
}
