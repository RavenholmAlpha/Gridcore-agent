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

	// 校验 Scheme
	if u.Scheme != "ws" && u.Scheme != "wss" {
		log.Printf("Warning: ServerURL scheme is '%s', expected 'ws' or 'wss'. Attempting to connect anyway...", u.Scheme)
	}

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

	// 设置读超时和 Ping 处理
	s.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	s.conn.SetPingHandler(func(appData string) error {
		// 收到 Ping，重置读超时
		s.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		// 手动回复 Pong
		err := s.conn.WriteControl(websocket.PongMessage, []byte(appData), time.Now().Add(10*time.Second))
		if err == websocket.ErrCloseSent {
			return nil
		}
		return err
	})

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
		if r := recover(); r != nil {
			log.Printf("Recovered from panic in readLoop: %v", r)
		}
	}()

	for {
		if s.conn == nil {
			return
		}
		// 这里的 ReadDeadline 主要由 PingHandler 维护，但为了保险，每次 Read 前也可以检查
		// 注意：ReadMessage 会阻塞直到有消息或出错
		_, message, err := s.conn.ReadMessage()
		if err != nil {
			select {
			case errChan <- err:
			default:
			}
			return
		}
		if len(message) > 0 {
			log.Printf("Received server message: %s", message)

			var msg struct {
				Type string `json:"type"`
			}
			if err := json.Unmarshal(message, &msg); err == nil {
				if msg.Type == "exit" {
					log.Fatalf("Received exit command from server. Exiting...")
				}
			}
		}
	}
}

func (s *Sender) writeLoop(errChan chan<- error) {
	log.Println("Starting writeLoop...")
	interval := s.cfg.Interval
	if interval < 1 {
		interval = 2
	}
	ticker := time.NewTicker(time.Duration(interval) * time.Second)
	defer ticker.Stop()

	defer func() {
		if r := recover(); r != nil {
			log.Printf("Recovered from panic in writeLoop: %v", r)
		}
		log.Println("Exiting writeLoop...")
	}()

	for {
		select {
		case <-ticker.C:
			if s.conn == nil {
				log.Println("writeLoop: connection is nil, returning")
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
				log.Printf("WriteMessage error: %v", err)
				select {
				case errChan <- err:
				default:
				}
				return
			}

			if s.cfg.Debug {
				jsonData, _ := json.MarshalIndent(data, "", "  ")
				log.Printf("[DEBUG] Sending Payload:\n%s\n", string(jsonData))
				log.Println("Report sent via WebSocket")
			}
		case <-s.done:
			return
		}
	}
}
