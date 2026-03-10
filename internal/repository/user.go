package repository

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/gsarmaonline/weform/internal/domain"
)

type UserRepository struct {
	db *pgxpool.Pool
}

func NewUserRepository(db *pgxpool.Pool) *UserRepository {
	return &UserRepository{db: db}
}

// UpsertByEmail creates the user if they don't exist, or returns the existing one.
// Called on every Google sign-in.
func (r *UserRepository) UpsertByEmail(ctx context.Context, email string, fullName, avatarURL *string) (*domain.User, error) {
	row := r.db.QueryRow(ctx, `
		INSERT INTO users (email, email_verified, full_name, avatar_url)
		VALUES ($1, true, $2, $3)
		ON CONFLICT (email) DO UPDATE
		  SET full_name   = COALESCE(EXCLUDED.full_name, users.full_name),
		      avatar_url  = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
		      last_login_at = NOW()
		RETURNING id, email, email_verified, full_name, avatar_url, created_at, last_login_at
	`, email, fullName, avatarURL)

	return scanUser(row)
}

func (r *UserRepository) GetByID(ctx context.Context, id string) (*domain.User, error) {
	row := r.db.QueryRow(ctx, `
		SELECT id, email, email_verified, full_name, avatar_url, created_at, last_login_at
		FROM users
		WHERE id = $1 AND is_deleted = false
	`, id)
	return scanUser(row)
}

func scanUser(row pgx.Row) (*domain.User, error) {
	u := &domain.User{}
	err := row.Scan(
		&u.ID, &u.Email, &u.EmailVerified,
		&u.FullName, &u.AvatarURL,
		&u.CreatedAt, &u.LastLoginAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return u, nil
}
