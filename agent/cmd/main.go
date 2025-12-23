package main

import (
	"flag"
	"log"
	"os"
	"os/signal"
	"syscall"

	"gridcore-agent/internal/config"
	"gridcore-agent/internal/sender"
)

func main() {
	configPath := flag.String("config", "config.yaml", "Path to configuration file")
	flag.Parse()

	cfg, err := config.Load(*configPath)
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	log.Printf("Starting Gridcore Agent...\n")
	log.Printf("Server: %s\n", cfg.ServerURL)
	log.Printf("Interval: %d seconds\n", cfg.Interval)

	s := sender.New(cfg)

	// Run sender in a goroutine so we can handle signals
	go s.Start()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down agent...")
}
