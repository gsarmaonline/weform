package domain

import "time"

type User struct {
	ID            string     `json:"id"`
	Email         string     `json:"email"`
	EmailVerified bool       `json:"emailVerified"`
	FullName      *string    `json:"fullName"`
	AvatarURL     *string    `json:"avatarUrl"`
	CreatedAt     time.Time  `json:"createdAt"`
	LastLoginAt   *time.Time `json:"lastLoginAt"`
}
