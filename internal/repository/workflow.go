package repository

import (
	"context"

	"github.com/gsarmaonline/weform/internal/domain"
	"github.com/jackc/pgx/v5/pgxpool"
)

type WorkflowRepository struct {
	db *pgxpool.Pool
}

func NewWorkflowRepository(db *pgxpool.Pool) *WorkflowRepository {
	return &WorkflowRepository{db: db}
}

func (r *WorkflowRepository) ListByFormID(ctx context.Context, formID string) ([]*domain.Workflow, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, form_id, name, is_enabled, trigger, created_at, updated_at
		FROM form_workflows WHERE form_id = $1 ORDER BY created_at
	`, formID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var workflows []*domain.Workflow
	wfMap := map[string]*domain.Workflow{}
	for rows.Next() {
		wf := &domain.Workflow{Actions: []*domain.WorkflowAction{}}
		if err := rows.Scan(&wf.ID, &wf.FormID, &wf.Name, &wf.IsEnabled, &wf.Trigger,
			&wf.CreatedAt, &wf.UpdatedAt); err != nil {
			return nil, err
		}
		workflows = append(workflows, wf)
		wfMap[wf.ID] = wf
	}

	if len(workflows) == 0 {
		return workflows, nil
	}

	wfIDs := make([]string, len(workflows))
	for i, wf := range workflows {
		wfIDs[i] = wf.ID
	}

	aRows, err := r.db.Query(ctx, `
		SELECT id, workflow_id, type, position, is_enabled, config
		FROM workflow_actions
		WHERE workflow_id = ANY($1)
		ORDER BY position
	`, wfIDs)
	if err != nil {
		return nil, err
	}
	defer aRows.Close()

	for aRows.Next() {
		a := &domain.WorkflowAction{}
		if err := aRows.Scan(&a.ID, &a.WorkflowID, &a.Type, &a.Position, &a.IsEnabled, &a.Config); err != nil {
			return nil, err
		}
		if wf, ok := wfMap[a.WorkflowID]; ok {
			wf.Actions = append(wf.Actions, a)
		}
	}

	return workflows, nil
}

func (r *WorkflowRepository) Create(ctx context.Context, wf *domain.Workflow) (*domain.Workflow, error) {
	out := &domain.Workflow{Actions: []*domain.WorkflowAction{}}
	err := r.db.QueryRow(ctx, `
		INSERT INTO form_workflows (form_id, name, is_enabled, trigger)
		VALUES ($1, $2, $3, $4)
		RETURNING id, form_id, name, is_enabled, trigger, created_at, updated_at
	`, wf.FormID, wf.Name, wf.IsEnabled, wf.Trigger).
		Scan(&out.ID, &out.FormID, &out.Name, &out.IsEnabled, &out.Trigger, &out.CreatedAt, &out.UpdatedAt)
	return out, err
}

func (r *WorkflowRepository) Update(ctx context.Context, wf *domain.Workflow) (*domain.Workflow, error) {
	out := &domain.Workflow{}
	err := r.db.QueryRow(ctx, `
		UPDATE form_workflows SET name = $1, is_enabled = $2, updated_at = NOW()
		WHERE id = $3
		RETURNING id, form_id, name, is_enabled, trigger, created_at, updated_at
	`, wf.Name, wf.IsEnabled, wf.ID).
		Scan(&out.ID, &out.FormID, &out.Name, &out.IsEnabled, &out.Trigger, &out.CreatedAt, &out.UpdatedAt)
	return out, err
}

func (r *WorkflowRepository) Delete(ctx context.Context, workflowID string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM form_workflows WHERE id = $1`, workflowID)
	return err
}

func (r *WorkflowRepository) AddAction(ctx context.Context, a *domain.WorkflowAction) (*domain.WorkflowAction, error) {
	out := &domain.WorkflowAction{}
	err := r.db.QueryRow(ctx, `
		INSERT INTO workflow_actions (workflow_id, type, position, is_enabled, config)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, workflow_id, type, position, is_enabled, config
	`, a.WorkflowID, a.Type, a.Position, a.IsEnabled, a.Config).
		Scan(&out.ID, &out.WorkflowID, &out.Type, &out.Position, &out.IsEnabled, &out.Config)
	return out, err
}

func (r *WorkflowRepository) UpdateAction(ctx context.Context, a *domain.WorkflowAction) (*domain.WorkflowAction, error) {
	out := &domain.WorkflowAction{}
	err := r.db.QueryRow(ctx, `
		UPDATE workflow_actions SET type = $1, position = $2, is_enabled = $3, config = $4, updated_at = NOW()
		WHERE id = $5
		RETURNING id, workflow_id, type, position, is_enabled, config
	`, a.Type, a.Position, a.IsEnabled, a.Config, a.ID).
		Scan(&out.ID, &out.WorkflowID, &out.Type, &out.Position, &out.IsEnabled, &out.Config)
	return out, err
}

func (r *WorkflowRepository) DeleteAction(ctx context.Context, actionID string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM workflow_actions WHERE id = $1`, actionID)
	return err
}

func (r *WorkflowRepository) GetEnabledByFormID(ctx context.Context, formID string, trigger domain.WorkflowTrigger) ([]*domain.Workflow, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, form_id, name, is_enabled, trigger, created_at, updated_at
		FROM form_workflows
		WHERE form_id = $1 AND trigger = $2 AND is_enabled = TRUE
		ORDER BY created_at
	`, formID, trigger)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var workflows []*domain.Workflow
	wfMap := map[string]*domain.Workflow{}
	for rows.Next() {
		wf := &domain.Workflow{Actions: []*domain.WorkflowAction{}}
		if err := rows.Scan(&wf.ID, &wf.FormID, &wf.Name, &wf.IsEnabled, &wf.Trigger,
			&wf.CreatedAt, &wf.UpdatedAt); err != nil {
			return nil, err
		}
		workflows = append(workflows, wf)
		wfMap[wf.ID] = wf
	}

	if len(workflows) == 0 {
		return workflows, nil
	}

	wfIDs := make([]string, len(workflows))
	for i, wf := range workflows {
		wfIDs[i] = wf.ID
	}

	aRows, err := r.db.Query(ctx, `
		SELECT id, workflow_id, type, position, is_enabled, config
		FROM workflow_actions
		WHERE workflow_id = ANY($1) AND is_enabled = TRUE
		ORDER BY position
	`, wfIDs)
	if err != nil {
		return nil, err
	}
	defer aRows.Close()

	for aRows.Next() {
		a := &domain.WorkflowAction{}
		if err := aRows.Scan(&a.ID, &a.WorkflowID, &a.Type, &a.Position, &a.IsEnabled, &a.Config); err != nil {
			return nil, err
		}
		if wf, ok := wfMap[a.WorkflowID]; ok {
			wf.Actions = append(wf.Actions, a)
		}
	}

	return workflows, nil
}
