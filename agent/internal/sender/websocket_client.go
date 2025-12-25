package sender

import (
	"encoding/json"
	"log"
	"net/http"
	"net/url"
	"sync"
	"time"

	"gridcore-agent/internal/collector"
	"gridcore-agent/internal/config"

	"github.com/gorilla/websocket"
)

// Sender 负责通过 WebSocket 将收集到的数据发送到服务器
type Sender struct {
	conn      *websocket.Conn
	cfg       *config.Config
	collector *collector.Collector
	sendMu    sync.Mutex // 确保并发写入安全
	done      chan struct{}
}

// New 创建一个新的发送器实例
func New(cfg *config.Config) *Sender {
	collector.InitCPU()
	time.Sleep(1 * time.Second) // 预热 CPU 统计

	return &Sender{
		cfg:       cfg,
		collector: collector.New(),
		done:      make(chan struct{}),
	}
}

// Start 启动发送循环
func (s *Sender) Start() {
	for {
		// 1. 尝试连接
		if err := s.connect(); err != nil {
			log.Printf("Connection failed: %v. Retrying in 5 seconds...", err)
			time.Sleep(5 * time.Second)
			continue
		}

		log.Println("Connected to server via WebSocket")

		// 2. 启动读写循环
		// 错误通道，用于通知连接断开
		errChan := make(chan error, 1)

		// 读循环（处理服务端指令，如 ping 响应或控制指令）
		go s.readLoop(errChan)

		// 写循环（定时上报数据）
		go s.writeLoop(errChan)

		// 等待错误（连接断开）
		err := <-errChan
		log.Printf("Connection lost: %v", err)

		// 清理旧连接
		s.cleanup()

		// 等待一会再重连
		time.Sleep(2 * time.Second)
	}
}

func (s *Sender) connect() error {
	// 解析原始 URL
	u, err := url.Parse(s.cfg.ServerURL)
	if err != nil {
		return err
	}

	// 调整 Scheme
	switch u.Scheme {
	case "http":
		u.Scheme = "ws"
	case "https":
		u.Scheme = "wss"
	}

	// 调整 Path，假设 ServerURL 配置的是基础地址或旧的 report 地址
	// 我们统一将其指向 /api/agent/ws
	// 如果配置的是 http://localhost:3000/api/agent/report，我们取 Host，重组为 ws://localhost:3000/api/agent/ws
	u.Path = "/api/agent/ws"
	u.RawQuery = ""

	serverURL := u.String()

	headers := http.Header{}
	headers.Add("Authorization", "Bearer "+s.cfg.Secret)
	headers.Add("X-Agent-UUID", s.cfg.UUID)

	log.Printf("Connecting to %s", serverURL)
	c, _, err := websocket.DefaultDialer.Dial(serverURL, headers)
	if err != nil {
		return err
	}
	s.conn = c
	return nil
}

func (s *Sender) cleanup() {
	s.sendMu.Lock()
	defer s.sendMu.Unlock()
	if s.conn != nil {
		s.conn.Close()
		s.conn = nil
	}
}

func (s *Sender) readLoop(errChan chan<- error) {
	defer func() {
		// 避免向已关闭的 channel 发送
		recover()
	}()

	for {
		if s.conn == nil {
			return
		}
		// 设置读取超时，略大于心跳间隔
		s.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		_, message, err := s.conn.ReadMessage()
		if err != nil {
			select {
			case errChan <- err:
			default:
			}
			return
		}
		// 处理服务端消息（目前主要是日志打印，未来可扩展指令）
		if len(message) > 0 {
			log.Printf("Received server message: %s", message)
		}
	}
}

func (s *Sender) writeLoop(errChan chan<- error) {
	interval := s.cfg.Interval
	if interval < 1 {
		interval = 2
	}
	ticker := time.NewTicker(time.Duration(interval) * time.Second)
	defer ticker.Stop()

	defer func() {
		recover()
	}()

	for {
		select {
		case <-ticker.C:
			if s.conn == nil {
				return
			}

			data, err := s.collector.Collect()
			if err != nil {
				log.Printf("Collect error: %v", err)
				continue
			}
			data.UUID = s.cfg.UUID

			payload, _ := json.Marshal(data)

			s.sendMu.Lock()
			s.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			err = s.conn.WriteMessage(websocket.TextMessage, payload)
			s.sendMu.Unlock()

			if err != nil {
				select {
				case errChan <- err:
				default:
				}
				return
			}

			if s.cfg.Debug {
				log.Println("Report sent via WebSocket")
			}
		case <-s.done:
			return
		}
	}
}
