# Gridcore 服务端后端开发文档

## 1. 架构概述

服务端基于 **Node.js** 构建，采用 **Express** (或 Koa) 作为 Web 框架，使用 **SQLite** 作为持久化存储。
服务端主要职责是：
1.  **API Server**: 响应前端的查询请求，接收 Agent 的数据上报。
2.  **WebSocket Server** (可选): 向前端实时推送服务器状态变更。
3.  **Data Manager**: 管理 SQLite 数据库，执行定期清理任务。

## 2. 技术栈

*   **Runtime**: Node.js (v18+)
*   **Web Framework**: Express.js
*   **Database**: SQLite3
*   **ORM/Query Builder**: Sequelize 或 Knex.js (推荐 Sequelize 以简化模型定义)
*   **Validation**: Joi 或 Zod (用于验证 API 输入)
*   **Logging**: Winston 或 Morgan

## 3. 数据库设计 (SQLite)

数据库文件位置: `server/service/data/gridcore.db`

### 3.1 表结构详细定义

#### `servers` (服务器表)
| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PK, AutoIncrement | 内部 ID |
| `uuid` | STRING | Unique, Not Null | Agent 唯一标识 (Machine ID) |
| `name` | STRING | Allow Null | 自定义显示名称 |
| `os_info` | STRING | | 操作系统详情 (如 "Ubuntu 22.04 LTS") |
| `client_ip` | STRING | | 上报来源 IP |
| `cpu_cores` | INTEGER | | CPU 核心数 |
| `ram_total` | BIGINT | | 内存总量 (Bytes) |
| `status` | INTEGER | Default 0 | 0: Offline, 1: Online |
| `last_seen` | DATE | | 最后心跳时间 |
| `secret` | STRING | | 通信密钥 (用于鉴权) |

#### `metrics` (指标历史表)
*建议每分钟仅记录一条聚合数据，或直接存储所有上报点但定期清理。*

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PK, AutoIncrement | 记录 ID |
| `server_id` | INTEGER | FK -> servers.id | 关联服务器 |
| `cpu_usage` | FLOAT | | CPU 使用率 (0-100) |
| `ram_usage` | FLOAT | | 内存使用率 (0-100) |
| `disk_usage` | FLOAT | | 主磁盘使用率 (0-100) |
| `net_in_rate` | BIGINT | | 入网速率 (Bytes/s) |
| `net_out_rate` | BIGINT | | 出网速率 (Bytes/s) |
| `created_at` | DATE | Default Now | 记录创建时间 |

## 4. 模块设计

### 4.1 Service Layer
业务逻辑层，解耦 Controller 和 Model。
*   `ServerService`: 处理服务器注册、状态更新、列表查询。
*   `MetricService`: 处理指标写入、历史数据查询、过期数据清理。

### 4.2 鉴权中间件 (Auth Middleware)
*   **Agent 鉴权**: 检查 HTTP Header 中的 `Authorization` 字段是否匹配服务器的 `secret`。
*   **Admin 鉴权** (可选): 如果面板需要登录，验证用户 Token。

### 4.3 定时任务 (Cron Jobs)
使用 `node-schedule` 或 `setInterval`。
1.  **离线检测**: 每 10 秒扫描一次 `servers` 表，将 `last_seen` 超过 30 秒的服务器 `status` 置为 0 (Offline)。
2.  **数据清理**: 每天凌晨清理 7 天前的 `metrics` 数据，保持数据库轻量。

## 5. 目录结构
```
server/service/
├── src/
│   ├── config/         # 配置文件 (DB路径, 端口, 密钥)
│   ├── controllers/    # 请求处理器
│   ├── middlewares/    # 中间件 (Auth, ErrorHandler)
│   ├── models/         # Sequelize 模型定义
│   ├── routes/         # 路由定义
│   ├── services/       # 业务逻辑
│   ├── utils/          # 工具函数 (Logger)
│   └── app.js          # 入口文件
├── data/               # 存放 SQLite db 文件
├── package.json
└── .env
```

## 6. 异常处理
*   统一错误响应格式：`{ "code": 500, "message": "Internal Server Error" }`
*   捕获数据库连接错误，避免服务崩溃。
