package repository

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/gsarmaonline/weform/internal/domain"
)

type ResponseRepository struct {
	db *pgxpool.Pool
}

func NewResponseRepository(db *pgxpool.Pool) *ResponseRepository {
	return &ResponseRepository{db: db}
}

func (r *ResponseRepository) DB() *pgxpool.Pool { return r.db }

// GetFormBySlug returns a published form with pages and fields for the public renderer.
func (r *ResponseRepository) GetFormBySlug(ctx context.Context, slug string) (*domain.PublicForm, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, title, slug, status, welcome_screen, thank_you_screen
		FROM forms
		WHERE slug = $1 AND status = 'published'
	`, slug)

	f := &domain.PublicForm{}
	var welcomeRaw, thankYouRaw []byte
	err := row.Scan(&f.ID, &f.Title, &f.Slug, &f.Status, &welcomeRaw, &thankYouRaw)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	if welcomeRaw != nil {
		var w interface{}
		if err := json.Unmarshal(welcomeRaw, &w); err == nil {
			f.WelcomeScreen = w
		}
	}
	if thankYouRaw != nil {
		var t interface{}
		if err := json.Unmarshal(thankYouRaw, &t); err == nil {
			f.ThankYouScreen = t
		}
	}

	// Load pages
	pageRows, err := r.db.Query(ctx, `
		SELECT id, form_id, title, description, position, created_at, updated_at
		FROM form_pages WHERE form_id = $1 ORDER BY position ASC
	`, f.ID)
	if err != nil {
		return nil, err
	}
	defer pageRows.Close()

	pageMap := map[string]*domain.FormPage{}
	for pageRows.Next() {
		p := &domain.FormPage{Fields: []*domain.FormField{}}
		if err := pageRows.Scan(&p.ID, &p.FormID, &p.Title, &p.Description, &p.Position, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		f.Pages = append(f.Pages, p)
		pageMap[p.ID] = p
	}
	if err := pageRows.Err(); err != nil {
		return nil, err
	}

	// Load fields (excluding hidden from public payload)
	fieldRows, err := r.db.Query(ctx, `
		SELECT id, form_id, page_id, ref, type, title, description, position,
		       is_required, config, validation, visibility_rule, deleted_at, created_at, updated_at
		FROM form_fields
		WHERE form_id = $1 AND deleted_at IS NULL AND type != 'hidden'
		ORDER BY position ASC
	`, f.ID)
	if err != nil {
		return nil, err
	}
	defer fieldRows.Close()

	for fieldRows.Next() {
		field, err := scanField(fieldRows)
		if err != nil {
			return nil, err
		}
		if p, ok := pageMap[field.PageID]; ok {
			p.Fields = append(p.Fields, field)
		}
	}
	return f, fieldRows.Err()
}

// CreateResponse starts a new response session.
func (r *ResponseRepository) CreateResponse(ctx context.Context, formID, sessionToken string, ip, userAgent, referrer *string) (*domain.FormResponse, error) {
	res := &domain.FormResponse{}
	err := r.db.QueryRow(ctx, `
		INSERT INTO form_responses (form_id, session_token, ip_address, user_agent, referrer)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, form_id, session_token, status, started_at
	`, formID, sessionToken, ip, userAgent, referrer).Scan(
		&res.ID, &res.FormID, &res.SessionToken, &res.Status, &res.StartedAt,
	)
	return res, err
}

// SaveAnswers upserts a batch of answers for a response.
func (r *ResponseRepository) SaveAnswers(ctx context.Context, responseID string, answers []domain.ResponseAnswer) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	for _, a := range answers {
		_, err := tx.Exec(ctx, `
			INSERT INTO response_answers (response_id, field_id, field_ref, field_type, value)
			VALUES ($1, $2, $3, $4, $5)
			ON CONFLICT (response_id, field_id) DO UPDATE SET value = EXCLUDED.value
		`, responseID, a.FieldID, a.FieldRef, a.FieldType, a.Value)
		if err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

// SubmitResponse marks a response as submitted.
func (r *ResponseRepository) SubmitResponse(ctx context.Context, sessionToken string) (*domain.FormResponse, error) {
	res := &domain.FormResponse{}
	err := r.db.QueryRow(ctx, `
		UPDATE form_responses
		SET status = 'submitted',
		    submitted_at = NOW(),
		    time_to_complete_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::int
		WHERE session_token = $1 AND status = 'in_progress'
		RETURNING id, form_id, session_token, status, started_at, submitted_at, time_to_complete_seconds
	`, sessionToken).Scan(
		&res.ID, &res.FormID, &res.SessionToken, &res.Status,
		&res.StartedAt, &res.SubmittedAt, &res.TimeToCompleteSeconds,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return res, err
}
