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
*   **Load**: 采集系统负载 (1/5/15分钟)，Windows 下可能不可用。

### 3.2 上报模块 (Sender)
负责将采集到的数据序列化为 JSON 并发送给服务端。

*   **周期性上报**: 使用 `time.NewTicker` 实现定时任务（默认 2 秒）。
*   **断网重连**: 如果上报失败，记录错误日志，但**不应**退出程序，等待下一次 Ticker 继续尝试。
*   **鉴权**: 在 HTTP Header 中添加 `Authorization: Bearer <Secret>`。
*   **日志**: 使用 `log` 标准库打印带时间戳的日志，Debug 模式下打印发送的 JSON 内容。

### 3.3 配置管理 (Config)
Agent 启动时读取 `config.yaml` 或命令行参数。如果 `uuid` 为空，会自动生成并回写到配置文件。

**示例配置文件**:
```yaml
server_url: "http://monitor.example.com/api/agent/report"
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
│   │   └── http_client.go
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
