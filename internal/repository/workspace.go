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

type WorkspaceRepository struct {
	db *pgxpool.Pool
}

func NewWorkspaceRepository(db *pgxpool.Pool) *WorkspaceRepository {
	return &WorkspaceRepository{db: db}
}

func (r *WorkspaceRepository) ListByUser(ctx context.Context, userID string) ([]*domain.Workspace, error) {
	rows, err := r.db.Query(ctx, `
		SELECT w.id, w.name, w.slug, w.plan, w.avatar_url, w.created_at
		FROM workspaces w
		JOIN workspace_members wm ON wm.workspace_id = w.id
		WHERE wm.user_id = $1
		ORDER BY w.created_at ASC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var workspaces []*domain.Workspace
	for rows.Next() {
		w := &domain.Workspace{}
		if err := rows.Scan(&w.ID, &w.Name, &w.Slug, &w.Plan, &w.AvatarURL, &w.CreatedAt); err != nil {
			return nil, err
		}
		workspaces = append(workspaces, w)
	}
	return workspaces, rows.Err()
}

func (r *WorkspaceRepository) GetByID(ctx context.Context, id string) (*domain.Workspace, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, name, slug, plan, avatar_url, created_at
		FROM workspaces WHERE id = $1
	`, id)
	return scanWorkspace(row)
}

func (r *WorkspaceRepository) GetMember(ctx context.Context, workspaceID, userID string) (*domain.WorkspaceMember, error) {
	row := r.db.QueryRow(ctx, `
		SELECT workspace_id, user_id, role, joined_at
		FROM workspace_members
		WHERE workspace_id = $1 AND user_id = $2
	`, workspaceID, userID)

	m := &domain.WorkspaceMember{}
	err := row.Scan(&m.WorkspaceID, &m.UserID, &m.Role, &m.JoinedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return m, nil
}

func (r *WorkspaceRepository) Create(ctx context.Context, name, slug, ownerID string) (*domain.Workspace, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	w := &domain.Workspace{}
	err = tx.QueryRow(ctx, `
		INSERT INTO workspaces (name, slug)
		VALUES ($1, $2)
		RETURNING id, name, slug, plan, avatar_url, created_at
	`, name, slug).Scan(&w.ID, &w.Name, &w.Slug, &w.Plan, &w.AvatarURL, &w.CreatedAt)
	if err != nil {
		return nil, err
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO workspace_members (workspace_id, user_id, role)
		VALUES ($1, $2, 'owner')
	`, w.ID, ownerID)
	if err != nil {
		return nil, err
	}

	return w, tx.Commit(ctx)
}

// UniqueSlug returns slug or slug-2, slug-3, etc. if there's a collision.
func (r *WorkspaceRepository) UniqueSlug(ctx context.Context, base string) (string, error) {
	slug := base
	for i := 2; i <= 20; i++ {
		var exists bool
		err := r.db.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM workspaces WHERE slug = $1)`, slug).Scan(&exists)
		if err != nil {
			return "", err
		}
		if !exists {
			return slug, nil
		}
		slug = fmt.Sprintf("%s-%d", base, i)
	}
	return "", fmt.Errorf("could not generate unique slug for %q", base)
}

func SlugFromName(name string) string {
	s := strings.ToLower(name)
	s = strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			return r
		}
		return '-'
	}, s)
	// Collapse repeated dashes
	for strings.Contains(s, "--") {
		s = strings.ReplaceAll(s, "--", "-")
	}
	return strings.Trim(s, "-")
}

func scanWorkspace(row pgx.Row) (*domain.Workspace, error) {
	w := &domain.Workspace{}
	err := row.Scan(&w.ID, &w.Name, &w.Slug, &w.Plan, &w.AvatarURL, &w.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return w, nil
}
