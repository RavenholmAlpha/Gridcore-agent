package config

import (
	"os"

	"github.com/google/uuid"
	"gopkg.in/yaml.v3"
)

type Config struct {
	ServerURL string `yaml:"server_url"`
	Secret    string `yaml:"secret"`
	Interval  int    `yaml:"interval"`
	Debug     bool   `yaml:"debug"`
	UUID      string `yaml:"uuid"`
}

func Load(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}

	if cfg.UUID == "" {
		cfg.UUID = uuid.New().String()
		// Write back to file
		newData, err := yaml.Marshal(&cfg)
		if err != nil {
			return nil, err
		}
		if err := os.WriteFile(path, newData, 0644); err != nil {
			return nil, err
		}
	}

	return &cfg, nil
}
