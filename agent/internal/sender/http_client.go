package sender

import (
	"encoding/json"
	"log"
	"time"

	"gridcore-agent/internal/collector"
	"gridcore-agent/internal/config"

	"github.com/go-resty/resty/v2"
)

type Sender struct {
	client    *resty.Client
	cfg       *config.Config
	collector *collector.Collector
}

func New(cfg *config.Config) *Sender {
	collector.InitCPU()
	time.Sleep(1 * time.Second) // Warm up CPU stats to avoid 0% on first report

	client := resty.New()
	client.SetTimeout(5 * time.Second)

	return &Sender{
		client:    client,
		cfg:       cfg,
		collector: collector.New(),
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
