# KY 项目快速启动指南

## 快速启动（推荐）

### 方式1: 使用启动脚本（最简单）

#### 选项A: 仅启动前端（演示模式，无需数据库）

```bash
# 启动前端服务
./start-frontend-only.sh start

# 查看服务状态
./start-frontend-only.sh status

# 查看日志
./start-frontend-only.sh logs

# 停止服务
./start-frontend-only.sh stop
```

**访问地址**: http://localhost:3000

**注意**:
- 此模式仅启动前端服务，适合演示和界面预览
- 后端WebSocket服务未启动，因此无法与设备通信
- 如需完整功能，请使用选项B启动完整服务

#### 选项B: 启动完整服务（需要MySQL数据库）

```bash
# 1. 启动所有服务（包括MySQL）
./start-simple.sh start

# 2. 查看服务状态
./start-simple.sh status

# 3. 查看日志
./start-simple.sh logs backend   # 查看后端日志
./start-simple.sh logs frontend  # 查看前端日志

# 4. 停止所有服务
./start-simple.sh stop
```

### 方式2: 使用Docker Compose

```bash
# 1. 启动数据库服务
docker-compose up -d

# 2. 初始化数据库
docker exec -i ky-mysql mysql -uroot -proot ky_project < database/schema.sql

# 3. 启动后端
cd proxy-server
pnpm install
pnpm dev

# 4. 启动前端（新终端）
cd frontend
pnpm install
pnpm dev
```

## 访问地址

- **前端**: http://localhost:3000
- **后端WebSocket**: ws://localhost:5000/ws
- **MySQL**: localhost:3306
- **Redis**: localhost:6379

## 数据库配置

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ky_project
DB_USER=ky_user
DB_PASSWORD=ky_password
```

## 常见问题

### 问题1: Python错误 "argument of type 'NoneType' is not iterable"

#### 根本原因分析

经过详细诊断，该错误实际上是后端启动失败的症状，而不是Python本身的问题。真正的根本原因是：

1. **MySQL数据库未启动**: 后端服务在启动时会尝试连接MySQL数据库，如果数据库不可用，`sequelize.authenticate()`会挂起或失败
2. **环境变量为空**: `.env`文件中存在空的环境变量（如`REDIS_PASSWORD=`），导致配置解析时出现None值
3. **错误被静默捕获**: 异步错误被try-catch捕获但没有正确输出，导致看起来像Python错误

#### 解决方案

**方案1: 安装MySQL数据库（推荐用于完整功能）**

```bash
# 如果有Docker，启动MySQL容器
docker run -d \
  --name ky-mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=ky_project \
  -e MYSQL_USER=ky_user \
  -e MYSQL_PASSWORD=ky_password \
  -p 3306:3306 \
  mysql:8.0

# 初始化数据库
docker exec -i ky-mysql mysql -uroot -proot ky_project < database/schema.sql

# 启动完整服务
./start-simple.sh start
```

**方案2: 仅启动前端（演示模式）**

```bash
# 启动前端服务（不需要数据库）
./start-frontend-only.sh start

# 访问前端界面
open http://localhost:3000
```

**方案3: 修复空环境变量**

```bash
# 修复REDIS_PASSWORD空值
sed -i 's/REDIS_PASSWORD=/REDIS_PASSWORD=redis_default_password/' proxy-server/.env

# 验证修复
python3 diagnose.py
```

#### 诊断命令

```bash
# 运行诊断脚本
python3 diagnose.py

# 查看诊断报告
cat QUICKSTART.md
cat docs/05-启动问题排查.md
```

### 问题2: 端口已被占用

```bash
# 检查端口占用
lsof -i :3000  # 前端
lsof -i :5000  # 后端
lsof -i :3306  # MySQL
lsof -i :6379  # Redis

# 杀掉占用端口的进程
kill -9 <PID>
```

### 问题3: 数据库连接失败

```bash
# 检查MySQL是否运行
docker ps | grep ky-mysql

# 测试连接
docker exec -it ky-mysql mysql -uroot -proot -e "SELECT 1"

# 重启MySQL
docker-compose restart mysql
```

## 开发模式

### 仅启动前端（不需要后端）

```bash
cd frontend
pnpm dev
```

### 仅启动后端（不需要前端）

```bash
# 1. 启动数据库
docker-compose up -d

# 2. 初始化数据库
docker exec -i ky-mysql mysql -uroot -proot ky_project < database/schema.sql

# 3. 启动后端
cd proxy-server
pnpm dev
```

## 生产部署

### 使用PM2部署后端

```bash
cd proxy-server

# 构建
pnpm build

# 使用PM2启动
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs ky-proxy
```

### 前端部署

```bash
cd frontend

# 构建
pnpm build

# 将 dist/ 目录部署到 Nginx
cp -r dist/* /var/www/ky-frontend/
```

## 验证安装

### 测试数据库连接

```bash
cd proxy-server
npx ts-node -e "
import { connectDatabase } from './src/config/database';
connectDatabase().then(() => console.log('数据库连接成功')).catch(console.error);
"
```

### 测试WebSocket连接

```bash
# 安装wscat
npm install -g wscat

# 连接WebSocket
wscat -c ws://localhost:5000/ws

# 发送测试消息
{"type":"ping","timestamp":1707568900000}
```

## 目录结构

```
ky-project/
├── docs/                    # 文档
│   ├── 01-系统架构设计.md
│   ├── 02-API接口文档.md
│   ├── 03-部署运维手册.md
│   ├── 04-项目实施总结.md
│   └── 05-启动问题排查.md
├── database/                # 数据库脚本
│   └── schema.sql
├── frontend/                # 前端项目
│   ├── src/
│   ├── dist/
│   └── package.json
├── proxy-server/            # 后端项目
│   ├── src/
│   ├── dist/
│   ├── logs/
│   └── package.json
├── logs/                    # 日志目录
├── docker-compose.yml       # Docker配置
├── start.sh                 # 启动脚本
└── README.md
```

## 技术支持

如遇到问题，请查看：
1. [启动问题排查文档](docs/05-启动问题排查.md)
2. [部署运维手册](docs/03-部署运维手册.md)
3. 项目日志文件: `logs/backend.log`, `logs/frontend.log`
