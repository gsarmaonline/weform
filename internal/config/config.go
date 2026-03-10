package config

import (
	"github.com/spf13/viper"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Auth     AuthConfig
	SMTP     SMTPConfig
}

type ServerConfig struct {
	Port            string `mapstructure:"PORT"`
	Env             string `mapstructure:"ENV"`
	AllowedOrigins  string `mapstructure:"ALLOWED_ORIGINS"`
}

type DatabaseConfig struct {
	URL string `mapstructure:"DATABASE_URL"`
}

type SMTPConfig struct {
	Host     string `mapstructure:"SMTP_HOST"`
	Port     int    `mapstructure:"SMTP_PORT"`
	Username string `mapstructure:"SMTP_USERNAME"`
	Password string `mapstructure:"SMTP_PASSWORD"`
	From     string `mapstructure:"SMTP_FROM"`
}

type AuthConfig struct {
	JWTSecret          string `mapstructure:"JWT_SECRET"`
	JWTExpiryHours     int    `mapstructure:"JWT_EXPIRY_HOURS"`
	RefreshExpiryHours int    `mapstructure:"REFRESH_EXPIRY_HOURS"`
	GoogleClientID     string `mapstructure:"GOOGLE_CLIENT_ID"`
}

func Load() (*Config, error) {
	viper.SetConfigType("env")
	viper.AutomaticEnv()

	// Defaults
	viper.SetDefault("PORT", "8080")
	viper.SetDefault("ENV", "development")
	viper.SetDefault("ALLOWED_ORIGINS", "http://localhost:3000")
	viper.SetDefault("JWT_EXPIRY_HOURS", 24)
	viper.SetDefault("REFRESH_EXPIRY_HOURS", 168)

	// Read .env if present; ignore missing file
	viper.SetConfigFile(".env")
	_ = viper.ReadInConfig()

	cfg := &Config{}
	if err := viper.Unmarshal(cfg); err != nil {
		return nil, err
	}

	// Allow flat env vars to map into nested structs
	cfg.Server.Port = viper.GetString("PORT")
	cfg.Server.Env = viper.GetString("ENV")
	cfg.Server.AllowedOrigins = viper.GetString("ALLOWED_ORIGINS")
	cfg.Database.URL = viper.GetString("DATABASE_URL")
	cfg.Auth.JWTSecret = viper.GetString("JWT_SECRET")
	cfg.Auth.JWTExpiryHours = viper.GetInt("JWT_EXPIRY_HOURS")
	cfg.Auth.RefreshExpiryHours = viper.GetInt("REFRESH_EXPIRY_HOURS")
	cfg.Auth.GoogleClientID = viper.GetString("GOOGLE_CLIENT_ID")
	cfg.SMTP.Host = viper.GetString("SMTP_HOST")
	cfg.SMTP.Port = viper.GetInt("SMTP_PORT")
	cfg.SMTP.Username = viper.GetString("SMTP_USERNAME")
	cfg.SMTP.Password = viper.GetString("SMTP_PASSWORD")
	cfg.SMTP.From = viper.GetString("SMTP_FROM")

	return cfg, nil
}
