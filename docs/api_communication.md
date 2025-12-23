# Gridcore 通信协议与 API 文档

## 1. 通信概述

*   **通信方向**: 单向主动上报 (Agent -> Server)。
*   **协议**: HTTP/1.1 (未来可升级为 WebSocket 或 gRPC)。
*   **数据格式**: JSON。
*   **安全机制**: 基于 Shared Secret 的 Bearer Token 认证。

## 2. 鉴权机制 (Authentication)

所有 Agent 发往 Server 的请求必须包含 HTTP Header:
`Authorization: Bearer <Your-Secret-Token>`

*   `Secret` 在服务端和客户端配置文件中预设一致。
*   若 Token 不匹配，服务端返回 `401 Unauthorized`。

## 3. 接口定义

### 3.1 上报监控数据 (Report Metrics)

**Endpoint**: `POST /api/agent/report`

**Description**: Agent 周期性调用此接口上报当前系统状态。服务端根据 `uuid` 识别是哪台服务器，更新其在线状态和指标。

**Request Body (JSON)**:

```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",  // 必填，机器唯一ID
  "name": "Web-Server-01",                        // 选填，主机名
  "os": "Ubuntu 22.04.1 LTS",                     // 操作系统描述
  "uptime": 3600,                                 // 运行时间(秒)
  "cpu": 12.5,                                    // CPU使用率 (%)
  "ram": 45.2,                                    // 内存使用率 (%)
  "disk": 60.1,                                   // 根磁盘使用率 (%)
  "net_in": 10240,                                // 入网流量速率 (Bytes/s)
  "net_out": 20480,                               // 出网流量速率 (Bytes/s)
  "load_1": 0.5,                                  // (可选) 1分钟负载
  "load_5": 0.4,                                  // (可选) 5分钟负载
  "load_15": 0.3                                  // (可选) 15分钟负载
}
```

**Response**:

*   **200 OK**:
    ```json
    {
      "code": 200,
      "message": "success"
    }
    ```
*   **401 Unauthorized**: 密钥错误。
*   **400 Bad Request**: 数据格式错误。

### 3.2 前端 API (Frontend to Backend)

#### 获取服务器列表
**Endpoint**: `GET /api/servers`
**Response**:
```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "name": "Web-01",
      "status": 1, // 1: Online, 0: Offline
      "cpu_usage": 12.5,
      "ram_usage": 45.2,
      "last_seen": "2023-10-27T10:00:00Z"
    },
    // ...
  ]
}
```

#### 获取详细历史数据
**Endpoint**: `GET /api/servers/:id/metrics`
**Query Params**: `?range=1h` (1h, 24h, 7d)
**Response**:
```json
{
  "code": 200,
  "data": [
    { "time": "10:00", "cpu": 10, "ram": 40 },
    { "time": "10:01", "cpu": 12, "ram": 41 },
    // ...
  ]
}
```
