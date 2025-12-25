# Gridcore 探针端 (Agent) 开发文档

## 1. 项目概述

**Gridcore Agent** 是一个使用 **Go** 语言编写的轻量级服务器监控探针。
它的核心目标是：**低资源占用、无依赖部署、精准采集、稳定上报**。

## 2. 技术栈

*   **语言**: Go (Golang) 1.20+
*   **核心库**:
    *   `github.com/shirou/gopsutil/v3`: 跨平台系统信息采集 (CPU, Mem, Disk, Net)。
    *   `github.com/go-resty/resty/v2` (可选): 简化的 HTTP Client，或使用原生 `net/http`。
    *   `gopkg.in/yaml.v3`: 配置文件解析。

## 3. 功能实现细节

### 3.1 采集模块 (Collector)
封装 `gopsutil` 调用，提供扁平化的数据结构，并计算网络速率。

*   **Host**: 主机名、操作系统、内核版本、运行时间 (`uptime`)。
*   **CPU**: 采集使用率百分比 (`cpu.Percent`)，启动时进行预热防止 0 值。
*   **Memory**: 采集内存使用率 (`mem.VirtualMemory`)。
*   **Disk**: 采集根分区 (`/`) 或指定分区的使用率 (`disk.Usage`)。
*   **Network**: 采集实时网络速率 (Bytes/s)，通过计算两次采集的差值实现。
*   **Public IP**: 采集公网 IP (通过 `api.ipify.org`)，首次获取后缓存，避免频繁请求。
*   **Load**: 采集系统负载 (1/5/15分钟)，Windows 下可能不可用。

### 3.2 上报模块 (Sender)
负责将采集到的数据序列化为 JSON 并通过 WebSocket 发送给服务端。

*   **通信协议**: WebSocket (`ws://` 或 `wss://`)。
*   **连接地址**: `/api/agent/ws`。
*   **鉴权**: 在 WebSocket 握手阶段（Handshake）的 HTTP Header 中添加：
    *   `Authorization: Bearer <Secret>`
    *   `X-Agent-UUID: <UUID>`
*   **心跳与重连**: 
    *   客户端自动处理断线重连（默认等待 5 秒重试）。
    *   响应服务端的 Ping 帧，保持连接活跃。
*   **数据上报**: 建立连接后，启动定时器（默认 2 秒），周期性向服务端发送 JSON 数据。

### 3.3 配置管理 (Config)
Agent 启动时读取 `config.yaml` 或命令行参数。
*   **UUID**: 必须提供 UUID，否则无法启动。
*   **命令行参数**: 支持 `--uuid` 参数，用于指定或覆盖配置文件中的 UUID，并会持久化保存到配置文件中。

**启动命令示例**:
```bash
./gridcore-agent --uuid "your-server-provided-uuid"
```

**示例配置文件**:
```yaml
server_url: "http://monitor.example.com" # 自动转换为 ws://monitor.example.com/api/agent/ws
secret: "my-secure-secret-token"
interval: 2  # 上报间隔(秒)
debug: false
uuid: "550e8400-e29b-41d4-a716-446655440000" # 自动生成
```

**上报数据格式 (JSON)**:
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Web-Server-01",
  "os": "Ubuntu 22.04.1 LTS",
  "uptime": 3600,
  "cpu": 12.5,
  "ram": 45.2,
  "disk": 60.1,
  "net_in": 10240,
  "net_out": 20480,
  "public_ip": "1.2.3.4",
  "load_1": 0.5,
  "load_5": 0.4,
  "load_15": 0.3
}
```

## 4. 目录结构
```
agent/
├── cmd/
│   └── main.go         # 程序入口
├── internal/
│   ├── collector/      # 采集逻辑包
│   │   ├── collector.go # 核心采集逻辑与状态管理
│   │   ├── cpu.go
│   │   ├── mem.go
│   │   ├── disk.go
│   │   ├── net.go
│   │   ├── host.go     # 主机信息采集
│   │   └── load.go     # 负载采集
│   ├── sender/         # 发送逻辑包
│   │   └── websocket_client.go # WebSocket 客户端实现
│   └── config/         # 配置加载
├── go.mod
├── go.sum
└── config.yaml.example
```

## 5. 编译与构建

由于 Go 的跨平台特性，可以轻松编译出适用于不同操作系统的二进制文件。

**常用编译命令**:
```bash
# Windows
set CGO_ENABLED=0
set GOOS=windows
set GOARCH=amd64
go build -o gridcore-agent-win.exe cmd/main.go

# Linux
set CGO_ENABLED=0
set GOOS=linux
set GOARCH=amd64
go build -o gridcore-agent-linux cmd/main.go
```

## 6. 守护进程 (Systemd)

在 Linux 上建议使用 Systemd 管理 Agent。

`gridcore-agent.service`:
```ini
[Unit]
Description=Gridcore Monitor Agent
After=network.target

[Service]
Type=simple
User=root
ExecStart=/opt/gridcore/gridcore-agent-linux
WorkingDirectory=/opt/gridcore
Restart=always

[Install]
WantedBy=multi-user.target
```
