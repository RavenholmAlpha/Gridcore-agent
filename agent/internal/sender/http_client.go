package sender

import (
	"encoding/json"
	"log"
	"time"

	"gridcore-agent/internal/collector"
	"gridcore-agent/internal/config"

	"github.com/go-resty/resty/v2"
)

// Sender 负责将收集到的数据发送到服务器
type Sender struct {
	client    *resty.Client        // HTTP 客户端
	cfg       *config.Config       // 配置信息
	collector *collector.Collector // 数据收集器
}

// New 创建一个新的发送器实例
func New(cfg *config.Config) *Sender {
	collector.InitCPU()
	time.Sleep(1 * time.Second) // 预热 CPU 统计，避免第一次报告为 0%

	client := resty.New()
	client.SetTimeout(5 * time.Second)

	return &Sender{
		client:    client,
		cfg:       cfg,
		collector: collector.New(),
	}
}

// Start 启动发送循环
func (s *Sender) Start() {
	// 确保间隔至少为 1 秒
	interval := s.cfg.Interval
	if interval < 1 {
		interval = 2
	}
	ticker := time.NewTicker(time.Duration(interval) * time.Second)
	defer ticker.Stop()

	// 立即运行一次
	go s.report()

	for range ticker.C {
		s.report()
	}
}

// report 收集数据并发送到服务器
func (s *Sender) report() {
	data, err := s.collector.Collect()
	if err != nil {
		log.Printf("Error collecting data: %v\n", err)
		return
	}

	data.UUID = s.cfg.UUID

	if s.cfg.Debug {
		jsonData, _ := json.MarshalIndent(data, "", "  ")
		log.Printf("[DEBUG] Sending Payload:\n%s\n", string(jsonData))
	}

	resp, err := s.client.R().
		SetHeader("Authorization", "Bearer "+s.cfg.Secret).
		SetHeader("Content-Type", "application/json").
		SetBody(data).
		Post(s.cfg.ServerURL)

	if err != nil {
		log.Printf("Error sending report: %v\n", err)
		return
	}

	if s.cfg.Debug {
		log.Printf("Report sent. Status: %s\n", resp.Status())
	}
}
