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
	uuidFlag := flag.String("uuid", "", "Set or override UUID")
	flag.Parse()

	cfg, err := config.Load(*configPath)
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// If UUID is provided via flag, update config and save it
	if *uuidFlag != "" {
		cfg.UUID = *uuidFlag
		if err := cfg.Save(*configPath); err != nil {
			log.Printf("Warning: Failed to save UUID to config file: %v", err)
		}
	}

	if cfg.UUID == "" {
		log.Fatal("Error: UUID is required. Please provide it via config.yaml or --uuid flag.")
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
