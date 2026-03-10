package repository

import (
	"context"

	"github.com/gsarmaonline/weform/internal/domain"
	"github.com/jackc/pgx/v5/pgxpool"
)

type LogicRepository struct {
	db *pgxpool.Pool
}

func NewLogicRepository(db *pgxpool.Pool) *LogicRepository {
	return &LogicRepository{db: db}
}

func (r *LogicRepository) GetByFormID(ctx context.Context, formID string) ([]*domain.LogicRule, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, form_id, source_page_id, position, operator,
		       destination_type, destination_page_id, destination_url, created_at, updated_at
		FROM form_logic_rules
		WHERE form_id = $1
		ORDER BY source_page_id, position
	`, formID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var rules []*domain.LogicRule
	ruleMap := map[string]*domain.LogicRule{}
	for rows.Next() {
		rule := &domain.LogicRule{Conditions: []*domain.LogicCondition{}}
		if err := rows.Scan(
			&rule.ID, &rule.FormID, &rule.SourcePageID, &rule.Position, &rule.Operator,
			&rule.DestinationType, &rule.DestinationPageID, &rule.DestinationURL,
			&rule.CreatedAt, &rule.UpdatedAt,
		); err != nil {
			return nil, err
		}
		rules = append(rules, rule)
		ruleMap[rule.ID] = rule
	}

	if len(rules) == 0 {
		return rules, nil
	}

	ruleIDs := make([]string, len(rules))
	for i, rule := range rules {
		ruleIDs[i] = rule.ID
	}

	condRows, err := r.db.Query(ctx, `
		SELECT id, rule_id, field_id, operator, value
		FROM form_logic_conditions
		WHERE rule_id = ANY($1)
		ORDER BY id
	`, ruleIDs)
	if err != nil {
		return nil, err
	}
	defer condRows.Close()

	for condRows.Next() {
		c := &domain.LogicCondition{}
		if err := condRows.Scan(&c.ID, &c.RuleID, &c.FieldID, &c.Operator, &c.Value); err != nil {
			return nil, err
		}
		if rule, ok := ruleMap[c.RuleID]; ok {
			rule.Conditions = append(rule.Conditions, c)
		}
	}

	return rules, nil
}

func (r *LogicRepository) CreateRule(ctx context.Context, rule *domain.LogicRule) (*domain.LogicRule, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	out := &domain.LogicRule{Conditions: []*domain.LogicCondition{}}
	err = tx.QueryRow(ctx, `
		INSERT INTO form_logic_rules (form_id, source_page_id, position, operator, destination_type, destination_page_id, destination_url)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, form_id, source_page_id, position, operator, destination_type, destination_page_id, destination_url, created_at, updated_at
	`, rule.FormID, rule.SourcePageID, rule.Position, rule.Operator,
		rule.DestinationType, rule.DestinationPageID, rule.DestinationURL,
	).Scan(
		&out.ID, &out.FormID, &out.SourcePageID, &out.Position, &out.Operator,
		&out.DestinationType, &out.DestinationPageID, &out.DestinationURL,
		&out.CreatedAt, &out.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	for _, c := range rule.Conditions {
		cond := &domain.LogicCondition{}
		err := tx.QueryRow(ctx, `
			INSERT INTO form_logic_conditions (rule_id, field_id, operator, value)
			VALUES ($1, $2, $3, $4)
			RETURNING id, rule_id, field_id, operator, value
		`, out.ID, c.FieldID, c.Operator, c.Value).
			Scan(&cond.ID, &cond.RuleID, &cond.FieldID, &cond.Operator, &cond.Value)
		if err != nil {
			return nil, err
		}
		out.Conditions = append(out.Conditions, cond)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return out, nil
}

func (r *LogicRepository) UpdateRule(ctx context.Context, rule *domain.LogicRule) (*domain.LogicRule, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	out := &domain.LogicRule{Conditions: []*domain.LogicCondition{}}
	err = tx.QueryRow(ctx, `
		UPDATE form_logic_rules SET
			position = $1, operator = $2, destination_type = $3,
			destination_page_id = $4, destination_url = $5, updated_at = NOW()
		WHERE id = $6
		RETURNING id, form_id, source_page_id, position, operator, destination_type, destination_page_id, destination_url, created_at, updated_at
	`, rule.Position, rule.Operator, rule.DestinationType,
		rule.DestinationPageID, rule.DestinationURL, rule.ID,
	).Scan(
		&out.ID, &out.FormID, &out.SourcePageID, &out.Position, &out.Operator,
		&out.DestinationType, &out.DestinationPageID, &out.DestinationURL,
		&out.CreatedAt, &out.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	if _, err := tx.Exec(ctx, `DELETE FROM form_logic_conditions WHERE rule_id = $1`, out.ID); err != nil {
		return nil, err
	}

	for _, c := range rule.Conditions {
		cond := &domain.LogicCondition{}
		err := tx.QueryRow(ctx, `
			INSERT INTO form_logic_conditions (rule_id, field_id, operator, value)
			VALUES ($1, $2, $3, $4)
			RETURNING id, rule_id, field_id, operator, value
		`, out.ID, c.FieldID, c.Operator, c.Value).
			Scan(&cond.ID, &cond.RuleID, &cond.FieldID, &cond.Operator, &cond.Value)
		if err != nil {
			return nil, err
		}
		out.Conditions = append(out.Conditions, cond)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return out, nil
}

func (r *LogicRepository) DeleteRule(ctx context.Context, ruleID string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM form_logic_rules WHERE id = $1`, ruleID)
	return err
}
