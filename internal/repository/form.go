package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/gsarmaonline/weform/internal/domain"
)

type FormRepository struct {
	db *pgxpool.Pool
}

func NewFormRepository(db *pgxpool.Pool) *FormRepository {
	return &FormRepository{db: db}
}

func (r *FormRepository) ListByWorkspace(ctx context.Context, workspaceID string) ([]*domain.Form, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, workspace_id, created_by, title, slug, status, description,
		       cached_response_count, cached_completion_rate, created_at, updated_at
		FROM forms
		WHERE workspace_id = $1 AND status != 'archived'
		ORDER BY updated_at DESC
	`, workspaceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var forms []*domain.Form
	for rows.Next() {
		f, err := scanForm(rows)
		if err != nil {
			return nil, err
		}
		forms = append(forms, f)
	}
	return forms, rows.Err()
}

func (r *FormRepository) GetByID(ctx context.Context, id, workspaceID string) (*domain.Form, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, workspace_id, created_by, title, slug, status, description,
		       cached_response_count, cached_completion_rate, created_at, updated_at
		FROM forms
		WHERE id = $1 AND workspace_id = $2
	`, id, workspaceID)
	return scanFormRow(row)
}

func (r *FormRepository) Create(ctx context.Context, workspaceID, createdBy, title, slug string) (*domain.Form, error) {
	row := r.db.QueryRow(ctx, `
		INSERT INTO forms (workspace_id, created_by, title, slug)
		VALUES ($1, $2, $3, $4)
		RETURNING id, workspace_id, created_by, title, slug, status, description,
		          cached_response_count, cached_completion_rate, created_at, updated_at
	`, workspaceID, createdBy, title, slug)
	return scanFormRow(row)
}

func (r *FormRepository) Update(ctx context.Context, id, workspaceID string, fields map[string]any) (*domain.Form, error) {
	if len(fields) == 0 {
		return r.GetByID(ctx, id, workspaceID)
	}

	setClauses := make([]string, 0, len(fields)+1)
	args := make([]any, 0, len(fields)+3)
	i := 1
	for col, val := range fields {
		setClauses = append(setClauses, fmt.Sprintf("%s = $%d", col, i))
		args = append(args, val)
		i++
	}
	setClauses = append(setClauses, fmt.Sprintf("updated_at = NOW()"))

	args = append(args, id, workspaceID)
	query := fmt.Sprintf(`
		UPDATE forms SET %s
		WHERE id = $%d AND workspace_id = $%d
		RETURNING id, workspace_id, created_by, title, slug, status, description,
		          cached_response_count, cached_completion_rate, created_at, updated_at
	`, strings.Join(setClauses, ", "), i, i+1)

	row := r.db.QueryRow(ctx, query, args...)
	return scanFormRow(row)
}

func (r *FormRepository) Delete(ctx context.Context, id, workspaceID string) error {
	_, err := r.db.Exec(ctx, `
		UPDATE forms SET status = 'archived', updated_at = NOW()
		WHERE id = $1 AND workspace_id = $2
	`, id, workspaceID)
	return err
}

func (r *FormRepository) UniqueSlug(ctx context.Context, workspaceID, base string) (string, error) {
	slug := base
	for i := 2; i <= 20; i++ {
		var exists bool
		err := r.db.QueryRow(ctx,
			`SELECT EXISTS(SELECT 1 FROM forms WHERE workspace_id = $1 AND slug = $2)`,
			workspaceID, slug,
		).Scan(&exists)
		if err != nil {
			return "", err
		}
		if !exists {
			return slug, nil
		}
		slug = fmt.Sprintf("%s-%d", base, i)
	}
	return "", fmt.Errorf("could not generate unique slug")
}

func scanForm(rows pgx.Rows) (*domain.Form, error) {
	f := &domain.Form{}
	return f, rows.Scan(
		&f.ID, &f.WorkspaceID, &f.CreatedBy, &f.Title, &f.Slug, &f.Status,
		&f.Description, &f.CachedResponseCount, &f.CachedCompletionRate,
		&f.CreatedAt, &f.UpdatedAt,
	)
}

func scanFormRow(row pgx.Row) (*domain.Form, error) {
	f := &domain.Form{}
	err := row.Scan(
		&f.ID, &f.WorkspaceID, &f.CreatedBy, &f.Title, &f.Slug, &f.Status,
		&f.Description, &f.CachedResponseCount, &f.CachedCompletionRate,
		&f.CreatedAt, &f.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return f, err
}
