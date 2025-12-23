package config

import (
	"os"

	"gopkg.in/yaml.v3"
)

type Config struct {
	ServerURL string `yaml:"server_url"`
	Secret    string `yaml:"secret"`
	Interval  int    `yaml:"interval"`
	Debug     bool   `yaml:"debug"`
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

	return &cfg, nil
}
