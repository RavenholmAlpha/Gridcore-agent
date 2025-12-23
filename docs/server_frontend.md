# Gridcore 服务端前端开发与设计文档

## 1. 设计理念 (Design Philosophy)

**核心风格**：极简主义 (Minimalism)、高级感、工业风。
**配色方案**：黑白灰银 (Black, White, Grey, Silver)。旨在提供清晰、无干扰的数据监控体验。

### 1.1 色彩规范 (Color Palette)

| 用途 | 颜色名称 | Hex 代码 | 说明 |
| :--- | :--- | :--- | :--- |
| **背景** | Deep Void (深空黑) | `#0a0a0a` | 全局背景色，极致深沉 |
| **卡片/容器** | Onyx (玛瑙黑) | `#141414` | 组件背景，略浅于全局背景 |
| **主文本** | Titanium White (钛白) | `#EDEDED` | 主要标题、数值 |
| **次文本** | Silver Mist (银灰) | `#A1A1AA` | 标签、辅助说明 |
| **边框/分割** | Steel (钢灰) | `#27272a` | 极细边框，界定区域 |
| **强调/状态** | Pure White (纯白) | `#FFFFFF` | 选中状态、高亮 |
| **强调/状态** | Neon Green (荧光绿) | `#10B981` | 状态正常 (Online)，低饱和度处理 |
| **强调/状态** | Crimson (深红) | `#EF4444` | 状态异常 (Offline/Alert) |

### 1.2 字体排印 (Typography)

*   **Font Family**: `Inter`, `Roboto`, `San Francisco`, `-apple-system`, `sans-serif`.
*   **字重**:
    *   Heading: 600 (Semi-bold)
    *   Body: 400 (Regular)
    *   Data/Code: `JetBrains Mono` or `Fira Code` (Monospaced)

## 2. 技术栈 (Tech Stack)

*   **框架**: React 18+
*   **构建工具**: Vite
*   **状态管理**: Zustand (轻量级) 或 React Context
*   **样式方案**: Tailwind CSS (便于实现原子化设计)
*   **UI 组件库**: Ant Design (通过 ConfigProvider 定制暗黑主题) 或 Radix UI (无头组件，完全自定义样式)
*   **图表库**: Recharts (易于定制 SVG，适合暗黑风格)
*   **数据请求**: SWR 或 TanStack Query (React Query)

## 3. 页面结构与组件

### 3.1 概览仪表盘 (Dashboard)
*   **Header**: 极简顶部栏，仅包含 Logo ("Gridcore") 和简单的状态汇总（在线/总数）。
*   **Grid Layout**: 响应式网格布局，展示所有服务器卡片。

### 3.2 服务器卡片 (Server Card)
设计为一块精致的“金属铭牌”。
*   **Header**: 服务器名称、操作系统图标 (SVG 银灰色)、在线状态点 (呼吸灯效果)。
*   **Body**: 核心指标环形图或进度条。
    *   CPU: 细线进度条
    *   RAM: 细线进度条
    *   Disk: 文本百分比
*   **Footer**: 实时上下行网速 (使用等宽字体显示)。

### 3.3 详情页 (Server Detail)
点击卡片进入详情抽屉 (Drawer) 或新页面。
*   **历史趋势图**: 使用 Recharts 绘制的面积图 (AreaChart)，渐变填充（银灰到透明）。
*   **进程列表** (可选): 表格展示资源占用最高的进程。

## 4. 交互设计
*   **动画**: 使用 Framer Motion 实现平滑的卡片加载、数值跳动。
*   **加载状态**: 骨架屏 (Skeleton) 使用深灰色脉冲效果。
*   **响应式**: 适配 Mobile 端，单列卡片流。

## 5. 目录结构
```
client/
├── src/
│   ├── assets/         # 静态资源 (SVG Icons)
│   ├── components/     # 公共组件
│   │   ├── ui/         # 基础 UI (Button, Card, Badge) - 封装 Tailwind 样式
│   │   ├── charts/     # 图表组件封装
│   │   └── Layout.tsx  # 全局布局
│   ├── hooks/          # 自定义 Hooks (useServerData, useWebSocket)
│   ├── pages/          # 页面视图
│   │   ├── Dashboard/
│   │   └── Detail/
│   ├── services/       # API 请求封装
│   ├── styles/         # 全局样式
│   ├── types/          # TypeScript 类型定义
│   ├── utils/          # 工具函数
│   ├── App.tsx
│   └── main.tsx
├── tailwind.config.js
└── vite.config.ts
```
