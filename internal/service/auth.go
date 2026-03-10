package service

import (
	"context"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"

	"github.com/gsarmaonline/weform/internal/domain"
	"github.com/gsarmaonline/weform/internal/repository"
)

type AuthService struct {
	users          *repository.UserRepository
	workspaces     *WorkspaceService
	jwtSecret      []byte
	jwtExpiryHours int
	oauthConfig    *oauth2.Config
	frontendURL    string
}

func NewAuthService(
	users *repository.UserRepository,
	workspaces *WorkspaceService,
	jwtSecret string,
	jwtExpiryHours int,
	googleClientID string,
	googleClientSecret string,
	googleRedirectURL string,
	frontendURL string,
) *AuthService {
	oauthCfg := &oauth2.Config{
		ClientID:     googleClientID,
		ClientSecret: googleClientSecret,
		RedirectURL:  googleRedirectURL,
		Scopes:       []string{"openid", "email", "profile"},
		Endpoint:     google.Endpoint,
	}
	return &AuthService{
		users:          users,
		workspaces:     workspaces,
		jwtSecret:      []byte(jwtSecret),
		jwtExpiryHours: jwtExpiryHours,
		oauthConfig:    oauthCfg,
		frontendURL:    frontendURL,
	}
}

// GoogleAuthURL returns the URL to redirect the user to for Google OAuth.
func (s *AuthService) GoogleAuthURL(state string) string {
	return s.oauthConfig.AuthCodeURL(state, oauth2.AccessTypeOnline)
}

// FrontendURL returns the configured frontend base URL.
func (s *AuthService) FrontendURL() string {
	return s.frontendURL
}

type GoogleAuthResult struct {
	Token string       `json:"token"`
	User  *domain.User `json:"user"`
}

// ExchangeCode exchanges an OAuth authorization code for a JWT.
func (s *AuthService) ExchangeCode(ctx context.Context, code string) (*GoogleAuthResult, error) {
	token, err := s.oauthConfig.Exchange(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("exchange code: %w", err)
	}

	idToken, ok := token.Extra("id_token").(string)
	if !ok || idToken == "" {
		return nil, fmt.Errorf("no id_token in response")
	}

	// Parse the id_token JWT claims (without verifying — we got it directly from Google)
	claims, err := parseIDTokenClaims(idToken)
	if err != nil {
		return nil, fmt.Errorf("parse id_token: %w", err)
	}

	email, _ := claims["email"].(string)
	emailVerified, _ := claims["email_verified"].(bool)
	name, _ := claims["name"].(string)
	picture, _ := claims["picture"].(string)

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

	displayName := email
	if fullName != nil && *fullName != "" {
		displayName = *fullName
	}
	if _, err := s.workspaces.EnsureDefault(ctx, user.ID, displayName); err != nil {
		return nil, fmt.Errorf("ensure default workspace: %w", err)
	}

	jwt, err := s.issueJWT(user.ID)
	if err != nil {
		return nil, fmt.Errorf("issue jwt: %w", err)
	}

	return &GoogleAuthResult{Token: jwt, User: user}, nil
}

// parseIDTokenClaims extracts claims from a JWT without verifying the signature.
// This is safe here because the token was obtained directly from Google's token endpoint.
func parseIDTokenClaims(idToken string) (map[string]interface{}, error) {
	p := jwt.NewParser()
	tok, _, err := p.ParseUnverified(idToken, jwt.MapClaims{})
	if err != nil {
		return nil, err
	}
	claims, ok := tok.Claims.(jwt.MapClaims)
	if !ok {
		return nil, fmt.Errorf("unexpected claims type")
	}
	return claims, nil
}

// IssueTokenForEmail upserts a user by email and returns a JWT. Only for test use.
func (s *AuthService) IssueTokenForEmail(ctx context.Context, email string) (string, error) {
	user, err := s.users.UpsertByEmail(ctx, email, nil, nil)
	if err != nil {
		return "", err
	}
	if _, err := s.workspaces.EnsureDefault(ctx, user.ID, email); err != nil {
		return "", err
	}
	return s.issueJWT(user.ID)
}

func (s *AuthService) issueJWT(userID string) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(time.Duration(s.jwtExpiryHours) * time.Hour).Unix(),
		"iat":     time.Now().Unix(),
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(s.jwtSecret)
}
