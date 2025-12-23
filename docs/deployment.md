# Gridcore 部署与构建文档

## 1. 编译环境准备

### 1.1 服务端 (Node.js)
*   安装 Node.js (LTS 版本，推荐 v18+)。
*   安装 pnpm 或 npm。

### 1.2 客户端 (Go)
*   安装 Go 1.20+。
*   (可选) 安装 Docker 用于容器化构建。

## 2. 服务端部署

### 2.1 构建前端
```bash
cd server/client
npm install
npm run build
```
构建产物将输出到 `dist` 目录。

### 2.2 部署后端
后端通过 Express 托管前端的静态文件 (`dist` 目录)。

1.  将前端 `dist` 目录复制到 `server/service/public` (需在 Express 中配置静态资源托管)。
2.  安装后端依赖：
    ```bash
    cd server/service
    npm install --production
    ```
3.  启动服务：
    ```bash
    # 使用 PM2 守护进程
    npm install -g pm2
    pm2 start src/app.js --name "gridcore-server"
    ```

## 3. 客户端 (Agent) 部署

### 3.1 编译二进制文件
在开发机上交叉编译：

```bash
# 编译 Linux 版本
cd agent
SET CGO_ENABLED=0
SET GOOS=linux
SET GOARCH=amd64
go build -o gridcore-agent-linux cmd/main.go
```

### 3.2 部署到目标服务器
1.  将 `gridcore-agent-linux` 上传到目标服务器 `/opt/gridcore/`。
2.  创建配置文件 `/opt/gridcore/config.yaml`。
3.  配置 Systemd 服务 (参考 Agent 开发文档) 并启动：
    ```bash
    systemctl enable gridcore-agent
    systemctl start gridcore-agent
    ```

## 4. Docker 部署 (All-in-One)

我们提供一个 Docker Compose 方案，快速启动服务端。

`docker-compose.yml`:
```yaml
version: '3'
services:
  gridcore-server:
    build: ./server
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    restart: always
```

*(注意：Agent 通常直接运行在宿主机上以采集物理机信息，不建议运行在 Docker 中，除非映射了 /proc 等系统目录)*
