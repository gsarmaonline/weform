package config

import (
	"github.com/spf13/viper"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Auth     AuthConfig
}

type ServerConfig struct {
	Port string `mapstructure:"PORT"`
	Env  string `mapstructure:"ENV"`
}

type DatabaseConfig struct {
	URL string `mapstructure:"DATABASE_URL"`
}

type AuthConfig struct {
	JWTSecret          string `mapstructure:"JWT_SECRET"`
	JWTExpiryHours     int    `mapstructure:"JWT_EXPIRY_HOURS"`
	RefreshExpiryHours int    `mapstructure:"REFRESH_EXPIRY_HOURS"`
}

func Load() (*Config, error) {
	viper.SetConfigFile(".env")
	viper.SetConfigType("env")
	viper.AutomaticEnv()

	// Defaults
	viper.SetDefault("PORT", "8080")
	viper.SetDefault("ENV", "development")
	viper.SetDefault("JWT_EXPIRY_HOURS", 24)
	viper.SetDefault("REFRESH_EXPIRY_HOURS", 168)

	// Read .env if it exists; ignore error if not present
	_ = viper.ReadInConfig()

	cfg := &Config{}
	if err := viper.Unmarshal(cfg); err != nil {
		return nil, err
	}

	// Allow flat env vars to map into nested structs
	cfg.Server.Port = viper.GetString("PORT")
	cfg.Server.Env = viper.GetString("ENV")
	cfg.Database.URL = viper.GetString("DATABASE_URL")
	cfg.Auth.JWTSecret = viper.GetString("JWT_SECRET")
	cfg.Auth.JWTExpiryHours = viper.GetInt("JWT_EXPIRY_HOURS")
	cfg.Auth.RefreshExpiryHours = viper.GetInt("REFRESH_EXPIRY_HOURS")

	return cfg, nil
}
