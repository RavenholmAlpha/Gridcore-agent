package sender

import (
	"encoding/json"
	"fmt"
	"time"

	"gridcore-agent/internal/collector"
	"gridcore-agent/internal/config"

	"github.com/go-resty/resty/v2"
)

type Sender struct {
	client *resty.Client
	cfg    *config.Config
}

func New(cfg *config.Config) *Sender {
	client := resty.New()
	client.SetTimeout(5 * time.Second)
	return &Sender{
		client: client,
		cfg:    cfg,
	}
}

func (s *Sender) Start() {
	// Ensure interval is at least 1 second
	interval := s.cfg.Interval
	if interval < 1 {
		interval = 2
	}
	ticker := time.NewTicker(time.Duration(interval) * time.Second)
	defer ticker.Stop()

	// Run immediately once
	go s.report()

	for range ticker.C {
		s.report()
	}
}

func (s *Sender) report() {
	data, err := collector.Collect()
	if err != nil {
		fmt.Printf("Error collecting data: %v\n", err)
		return
	}

	data.UUID = s.cfg.UUID

	if s.cfg.Debug {
		jsonData, _ := json.MarshalIndent(data, "", "  ")
		fmt.Printf("[DEBUG] Sending Payload:\n%s\n", string(jsonData))
	}

	resp, err := s.client.R().
		SetHeader("Authorization", "Bearer "+s.cfg.Secret).
		SetHeader("Content-Type", "application/json").
		SetBody(data).
		Post(s.cfg.ServerURL)

	if err != nil {
		fmt.Printf("Error sending report: %v\n", err)
		return
	}

	if s.cfg.Debug {
		fmt.Printf("Report sent. Status: %s\n", resp.Status())
	}
}
