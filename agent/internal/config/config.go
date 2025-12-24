package config

import (
	"os"

	"gopkg.in/yaml.v3"
)

// Config 定义了代理的配置结构
type Config struct {
	ServerURL string `yaml:"server_url"` // 服务器地址
	Secret    string `yaml:"secret"`     // 通信密钥
	Interval  int    `yaml:"interval"`   // 上报间隔（秒）
	Debug     bool   `yaml:"debug"`      // 是否开启调试模式
	UUID      string `yaml:"uuid"`       // 代理唯一标识
}

// Load 从指定路径加载配置文件
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

// Save 将配置保存到指定路径
func (c *Config) Save(path string) error {
	data, err := yaml.Marshal(c)
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0644)
}
