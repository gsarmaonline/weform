package service

import (
	"context"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	googleidtoken "google.golang.org/api/idtoken"

	"github.com/gsarmaonline/weform/internal/domain"
	"github.com/gsarmaonline/weform/internal/repository"
)

type AuthService struct {
	users          *repository.UserRepository
	jwtSecret      []byte
	jwtExpiryHours int
	googleClientID string
}

func NewAuthService(
	users *repository.UserRepository,
	jwtSecret string,
	jwtExpiryHours int,
	googleClientID string,
) *AuthService {
	return &AuthService{
		users:          users,
		jwtSecret:      []byte(jwtSecret),
		jwtExpiryHours: jwtExpiryHours,
		googleClientID: googleClientID,
	}
}

type GoogleAuthResult struct {
	Token string      `json:"token"`
	User  *domain.User `json:"user"`
}

// ExchangeGoogleToken verifies a Google ID token, upserts the user, and returns a signed JWT.
func (s *AuthService) ExchangeGoogleToken(ctx context.Context, idToken string) (*GoogleAuthResult, error) {
	payload, err := googleidtoken.Validate(ctx, idToken, s.googleClientID)
	if err != nil {
		return nil, fmt.Errorf("invalid google id token: %w", err)
	}

	email, _ := payload.Claims["email"].(string)
	emailVerified, _ := payload.Claims["email_verified"].(bool)
	name, _ := payload.Claims["name"].(string)
	picture, _ := payload.Claims["picture"].(string)

	if email == "" || !emailVerified {
		return nil, fmt.Errorf("google account email not verified")
	}

	var fullName, avatarURL *string
	if name != "" {
		fullName = &name
	}
	if picture != "" {
		avatarURL = &picture
	}

	user, err := s.users.UpsertByEmail(ctx, email, fullName, avatarURL)
	if err != nil {
		return nil, fmt.Errorf("upsert user: %w", err)
	}

	token, err := s.issueJWT(user.ID)
	if err != nil {
		return nil, fmt.Errorf("issue jwt: %w", err)
	}

	return &GoogleAuthResult{Token: token, User: user}, nil
}

func (s *AuthService) issueJWT(userID string) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(time.Duration(s.jwtExpiryHours) * time.Hour).Unix(),
		"iat":     time.Now().Unix(),
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(s.jwtSecret)
}
