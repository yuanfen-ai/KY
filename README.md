# KY 项目 - 设备管控与数据通信系统

基于 WebSocket + TCP 的高并发设备管控与数据通信系统。

## 项目概述

KY 项目是一个现代化的设备管控与数据通信系统，通过 Node.js 代理服务实现前端 Vue3 应用与多个外部设备之间的高效、稳定双向通信。

### 核心特性

- ✅ **高并发支持**：支持 3000-5000 并发连接
- ✅ **低延迟通信**：数据延迟 <1秒
- ✅ **自动重连机制**：WebSocket 和 TCP 双向自动重连
- ✅ **心跳检测**：实时监测连接状态
- ✅ **类型安全**：全栈 TypeScript 开发
- ✅ **现代化技术栈**：Vue3 + Node.js + MySQL

### 技术架构

```
前端(Vue3) ←─WebSocket─→ Node.js代理 ←─TCP─→ 外部设备
```

## 项目结构

```
.
├── docs/                    # 项目文档
│   ├── 01-系统架构设计.md
│   ├── 02-API接口文档.md
│   └── 03-部署运维手册.md
├── frontend/                # 前端项目
│   ├── src/
│   │   ├── components/      # 组件
│   │   ├── composables/     # 组合式函数
│   │   ├── stores/          # 状态管理
│   │   ├── utils/           # 工具函数
│   │   ├── views/           # 页面视图
│   │   └── types/           # 类型定义
│   └── package.json
├── proxy-server/            # 后端项目
│   ├── src/
│   │   ├── config/          # 配置文件
│   │   ├── models/          # 数据模型
│   │   ├── tcp/             # TCP模块
│   │   ├── utils/           # 工具函数
│   │   ├── websocket/       # WebSocket模块
│   │   └── index.ts         # 入口文件
│   ├── logs/                # 日志目录
│   └── package.json
└── database/                # 数据库脚本
    └── schema.sql
```

## 快速开始

### 环境要求

- Node.js 20.x LTS
- pnpm 8.x+
- MySQL 8.0+
- Redis 7.x+ (可选)

### 1. 数据库初始化

```bash
mysql -u root -p < database/schema.sql
```

### 2. 后端启动

```bash
cd proxy-server

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等信息

# 构建
pnpm build

# 启动开发服务
pnpm dev

# 或使用 PM2 启动
pm2 start ecosystem.config.js
```

### 3. 前端启动

```bash
cd frontend

# 安装依赖
pnpm install

# 启动开发服务
pnpm dev

# 构建生产版本
pnpm build
```

## 配置说明

### 后端环境变量 (.env)

```env
NODE_ENV=development

# WebSocket配置
WS_PORT=5000
WS_PATH=/ws
WS_MAX_CONNECTIONS=5000

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ky_project
DB_USER=ky_user
DB_PASSWORD=your_password

# 日志配置
LOG_LEVEL=info
LOG_FILE_PATH=./logs
```

### 前端环境变量 (.env)

```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000/ws
```

## 核心功能

### 1. 设备管理

- 设备列表查看
- 设备状态监控
- 设备实时数据查看
- 设备控制指令发送

### 2. WebSocket 通信

- 自动重连（指数退避策略）
- 心跳检测（30秒间隔）
- 消息队列（断线缓存）
- 事件驱动架构

### 3. TCP 连接池

- 连接复用
- 自动重连
- 心跳保活
- 连接状态监控

## 开发指南

### 添加新设备类型

1. 修改 `proxy-server/src/models/device.ts` 添加新字段
2. 运行数据库迁移更新表结构
3. 更新前端类型定义 `frontend/src/types/index.ts`

### 自定义消息类型

1. 后端添加消息处理器 `proxy-server/src/websocket/handler.ts`
2. 前端添加消息监听 `frontend/src/composables/useWebSocket.ts`

## 部署

详细部署说明请参考 [部署运维手册](./docs/03-部署运维手册.md)

### Docker 部署（推荐）

```bash
docker-compose up -d
```

### 手动部署

1. 按照 [部署运维手册](./docs/03-部署运维手册.md) 配置环境
2. 构建前后端项目
3. 使用 PM2 管理后端服务
4. 使用 Nginx 反向代理

## 监控与日志

### 查看后端日志

```bash
pm2 logs ky-proxy
```

### 查看日志文件

```bash
tail -f proxy-server/logs/combined.log
tail -f proxy-server/logs/error.log
```

## 故障排查

常见问题及解决方案请参考 [部署运维手册 - 故障排查](./docs/03-部署运维手册.md#十故障排查)

## API 文档

详细的 API 接口文档请参考 [API接口文档](./docs/02-API接口文档.md)

## 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

本项目采用 MIT 许可证。

## 联系方式

- 项目文档：./docs/
- 问题反馈：[GitHub Issues](https://github.com/your-org/ky-project/issues)

---

**版本**：v1.0  
**最后更新**：2024年
