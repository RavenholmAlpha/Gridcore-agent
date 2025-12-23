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
封装 `gopsutil` 调用，提供统一的数据结构。

*   **CPU**: 采集使用率百分比 (`cpu.Percent`)。
*   **Memory**: 采集已用内存、总内存、使用率 (`mem.VirtualMemory`)。
*   **Disk**: 采集根分区 (`/`) 或指定分区的使用率 (`disk.Usage`)。
*   **Network**: 采集指定网卡或所有网卡的流量统计 (`net.IOCounters`)。
    *   *注意*: 流量速率需要计算两次采集之间的差值除以时间间隔。

### 3.2 上报模块 (Sender)
负责将采集到的数据序列化为 JSON 并发送给服务端。

*   **周期性上报**: 使用 `time.NewTicker` 实现定时任务（默认 2 秒）。
*   **断网重连**: 如果上报失败，记录错误日志，但**不应**退出程序，等待下一次 Ticker 继续尝试。
*   **鉴权**: 在 HTTP Header 中添加 `Authorization: Bearer <Secret>`。

### 3.3 配置管理 (Config)
Agent 启动时读取 `config.yaml` 或命令行参数。

**示例配置文件**:
```yaml
server_url: "http://monitor.example.com/api/agent/report"
secret: "my-secure-secret-token"
interval: 2  # 上报间隔(秒)
debug: false
```

## 4. 目录结构
```
agent/
├── cmd/
│   └── main.go         # 程序入口
├── internal/
│   ├── collector/      # 采集逻辑包
│   │   ├── cpu.go
│   │   ├── mem.go
│   │   └── disk.go
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
