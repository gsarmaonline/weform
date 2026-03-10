package repository

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/gsarmaonline/weform/internal/domain"
)

// BuilderRepository handles pages and fields — the core form structure.
type BuilderRepository struct {
	db *pgxpool.Pool
}

func NewBuilderRepository(db *pgxpool.Pool) *BuilderRepository {
	return &BuilderRepository{db: db}
}

// ---- Pages ----------------------------------------------------------------

func (r *BuilderRepository) ListPages(ctx context.Context, formID string) ([]*domain.FormPage, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, form_id, title, description, position, created_at, updated_at
		FROM form_pages
		WHERE form_id = $1
		ORDER BY position ASC
	`, formID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var pages []*domain.FormPage
	for rows.Next() {
		p := &domain.FormPage{}
		if err := rows.Scan(&p.ID, &p.FormID, &p.Title, &p.Description, &p.Position, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		p.Fields = []*domain.FormField{}
		pages = append(pages, p)
	}
	return pages, rows.Err()
}

func (r *BuilderRepository) CreatePage(ctx context.Context, formID string, position int) (*domain.FormPage, error) {
	p := &domain.FormPage{Fields: []*domain.FormField{}}
	err := r.db.QueryRow(ctx, `
		INSERT INTO form_pages (form_id, position)
		VALUES ($1, $2)
		RETURNING id, form_id, title, description, position, created_at, updated_at
	`, formID, position).Scan(
		&p.ID, &p.FormID, &p.Title, &p.Description, &p.Position, &p.CreatedAt, &p.UpdatedAt,
	)
	return p, err
}

func (r *BuilderRepository) UpdatePage(ctx context.Context, pageID, formID string, title, description *string) (*domain.FormPage, error) {
	p := &domain.FormPage{}
	err := r.db.QueryRow(ctx, `
		UPDATE form_pages
		SET title = COALESCE($1, title),
		    description = COALESCE($2, description),
		    updated_at = NOW()
		WHERE id = $3 AND form_id = $4
		RETURNING id, form_id, title, description, position, created_at, updated_at
	`, title, description, pageID, formID).Scan(
		&p.ID, &p.FormID, &p.Title, &p.Description, &p.Position, &p.CreatedAt, &p.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	p.Fields = []*domain.FormField{}
	return p, err
}

func (r *BuilderRepository) DeletePage(ctx context.Context, pageID, formID string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM form_pages WHERE id = $1 AND form_id = $2`, pageID, formID)
	return err
}

// ---- Fields ---------------------------------------------------------------

func (r *BuilderRepository) ListFields(ctx context.Context, formID string) ([]*domain.FormField, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, form_id, page_id, ref, type, title, description, position,
		       is_required, config, validation, visibility_rule, deleted_at, created_at, updated_at
		FROM form_fields
		WHERE form_id = $1 AND deleted_at IS NULL
		ORDER BY position ASC
	`, formID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var fields []*domain.FormField
	for rows.Next() {
		f, err := scanField(rows)
		if err != nil {
			return nil, err
		}
		fields = append(fields, f)
	}
	return fields, rows.Err()
}

func (r *BuilderRepository) CreateField(ctx context.Context, f *domain.FormField) (*domain.FormField, error) {
	config := f.Config
	if config == nil {
		config = json.RawMessage("{}")
	}

	row := r.db.QueryRow(ctx, `
		INSERT INTO form_fields (form_id, page_id, ref, type, title, description, position, is_required, config)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, form_id, page_id, ref, type, title, description, position,
		          is_required, config, validation, visibility_rule, deleted_at, created_at, updated_at
	`, f.FormID, f.PageID, f.Ref, f.Type, f.Title, f.Description, f.Position, f.IsRequired, config)
	return scanFieldRow(row)
}

func (r *BuilderRepository) UpdateField(ctx context.Context, fieldID, formID string, updates map[string]any) (*domain.FormField, error) {
	if len(updates) == 0 {
		return r.getField(ctx, fieldID, formID)
	}

	setClauses := make([]string, 0, len(updates)+1)
	args := make([]any, 0, len(updates)+3)
	i := 1
	for col, val := range updates {
		setClauses = append(setClauses, fmt.Sprintf("%s = $%d", col, i))
		args = append(args, val)
		i++
	}
	setClauses = append(setClauses, "updated_at = NOW()")
	args = append(args, fieldID, formID)

	query := fmt.Sprintf(`
		UPDATE form_fields SET %s
		WHERE id = $%d AND form_id = $%d AND deleted_at IS NULL
		RETURNING id, form_id, page_id, ref, type, title, description, position,
		          is_required, config, validation, visibility_rule, deleted_at, created_at, updated_at
	`, joinClauses(setClauses), i, i+1)

	return scanFieldRow(r.db.QueryRow(ctx, query, args...))
}

func (r *BuilderRepository) DeleteField(ctx context.Context, fieldID, formID string) error {
	_, err := r.db.Exec(ctx, `
		UPDATE form_fields SET deleted_at = NOW()
		WHERE id = $1 AND form_id = $2
	`, fieldID, formID)
	return err
}

func (r *BuilderRepository) ReorderFields(ctx context.Context, pageID string, fieldIDs []string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	for i, id := range fieldIDs {
		if _, err := tx.Exec(ctx,
			`UPDATE form_fields SET position = $1, updated_at = NOW() WHERE id = $2 AND page_id = $3`,
			i, id, pageID,
		); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

func (r *BuilderRepository) getField(ctx context.Context, fieldID, formID string) (*domain.FormField, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, form_id, page_id, ref, type, title, description, position,
		       is_required, config, validation, visibility_rule, deleted_at, created_at, updated_at
		FROM form_fields WHERE id = $1 AND form_id = $2 AND deleted_at IS NULL
	`, fieldID, formID)
	return scanFieldRow(row)
}

func scanField(rows pgx.Rows) (*domain.FormField, error) {
	f := &domain.FormField{}
	return f, rows.Scan(
		&f.ID, &f.FormID, &f.PageID, &f.Ref, &f.Type, &f.Title, &f.Description,
		&f.Position, &f.IsRequired, &f.Config, &f.Validation, &f.VisibilityRule,
		&f.DeletedAt, &f.CreatedAt, &f.UpdatedAt,
	)
}

func scanFieldRow(row pgx.Row) (*domain.FormField, error) {
	f := &domain.FormField{}
	err := row.Scan(
		&f.ID, &f.FormID, &f.PageID, &f.Ref, &f.Type, &f.Title, &f.Description,
		&f.Position, &f.IsRequired, &f.Config, &f.Validation, &f.VisibilityRule,
		&f.DeletedAt, &f.CreatedAt, &f.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return f, err
}

func joinClauses(clauses []string) string {
	result := ""
	for i, c := range clauses {
		if i > 0 {
			result += ", "
		}
		result += c
	}
	return result
}
