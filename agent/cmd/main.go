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

// main 是程序的入口点
func main() {
	// 定义命令行参数
	configPath := flag.String("config", "config.yaml", "Path to configuration file")
	uuidFlag := flag.String("uuid", "", "Set or override UUID")
	flag.Parse()

	// 加载配置文件
	cfg, err := config.Load(*configPath)
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// 如果通过命令行参数提供了 UUID，则更新配置并保存
	if *uuidFlag != "" {
		cfg.UUID = *uuidFlag
		if err := cfg.Save(*configPath); err != nil {
			log.Printf("Warning: Failed to save UUID to config file: %v", err)
		}
	}

	// 检查 UUID 是否存在，如果不存在则报错退出
	if cfg.UUID == "" {
		log.Fatal("Error: UUID is required. Please provide it via config.yaml or --uuid flag.")
	}

	log.Printf("Starting Gridcore Agent...\n")
	log.Printf("Server: %s\n", cfg.ServerURL)
	log.Printf("Interval: %d seconds\n", cfg.Interval)

	// 初始化发送器
	s := sender.New(cfg)

	// 在 goroutine 中运行发送器，以便我们可以处理信号
	go s.Start()

	// 等待中断信号以优雅关闭
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down agent...")
}
