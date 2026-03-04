# 应用启动指南

## 快速开始

### 一键启动
```bash
./manage.sh start
```

### 检查状态
```bash
./manage.sh status
```

### 停止服务
```bash
./manage.sh stop
```

### 重启服务
```bash
./manage.sh restart
```

### 查看日志
```bash
./manage.sh logs
```

## 访问应用

- **应用地址**: http://localhost:5000
- **登录页面**: http://localhost:5000/login
- **主页面**: http://localhost:5000/main

## 服务架构

### 前端服务（端口 5000）
- **技术栈**: Vue 3 + Vite + TypeScript
- **静态服务器**: Node.js (server.mjs)
- **管理脚本**: manage.sh
- **日志文件**: /app/work/logs/bypass/dev.log

### 系统服务（端口 9000）
- **技术栈**: Python + FastAPI
- **框架**: uvicorn
- **状态**: 自动启动，无需手动管理

## 常用命令

### 前端构建
```bash
cd frontend
pnpm install    # 安装依赖
pnpm run build  # 构建项目
```

### 直接启动（不使用管理脚本）
```bash
cd frontend
./start-server.sh
```

### 停止服务
```bash
# 使用管理脚本
./manage.sh stop

# 或手动停止
pkill -f "node server.mjs"
```

### 查看日志
```bash
# 使用管理脚本
./manage.sh logs

# 或直接查看
tail -f /app/work/logs/bypass/dev.log
```

## 问题排查

### 1. 端口被占用
**症状**: 启动失败，提示端口 5000 已被占用

**解决方案**:
```bash
# 查找占用端口的进程
lsof -i:5000

# 停止进程
pkill -f "node server.mjs"

# 重新启动
./manage.sh start
```

### 2. 服务无法启动
**症状**: 启动脚本运行但服务未响应

**排查步骤**:
```bash
# 1. 检查进程
ps aux | grep "[n]ode server.mjs"

# 2. 检查端口
ss -tuln | grep 5000

# 3. 查看日志
cat /app/work/logs/bypass/dev.log

# 4. 测试HTTP
curl -I http://localhost:5000
```

### 3. 文件不存在
**症状**: 提示 dist/index.html 不存在

**解决方案**:
```bash
cd frontend
pnpm run build
./manage.sh start
```

### 4. 依赖问题
**症状**: 模块未找到或版本错误

**解决方案**:
```bash
cd frontend
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm run build
./manage.sh start
```

## 日志说明

### 日志文件位置
- **开发日志**: `/app/work/logs/bypass/dev.log`
- **应用日志**: `/app/work/logs/bypass/app.log`
- **控制台日志**: `/app/work/logs/bypass/console.log`

### 查看日志
```bash
# 实时查看（推荐）
tail -f /app/work/logs/bypass/dev.log

# 查看最近50行
tail -n 50 /app/work/logs/bypass/dev.log

# 查看错误日志
grep -i error /app/work/logs/bypass/dev.log
```

## 性能优化

### 启动优化
- 使用 `nohup` 后台运行，避免阻塞
- 设置适当的等待时间（5秒）
- 多重验证确保服务稳定

### 日志管理
```bash
# 清理日志
./manage.sh clean

# 或手动清理
> /app/work/logs/bypass/dev.log
```

## 监控与维护

### 定期检查
```bash
# 每天检查一次服务状态
./manage.sh status

# 检查磁盘使用
df -h

# 检查内存使用
free -h
```

### 自动重启
如果需要自动重启服务，可以使用 cron:
```bash
# 编辑 crontab
crontab -e

# 添加定时任务（每天凌晨3点重启）
0 3 * * * /workspace/projects/manage.sh restart
```

## 安全建议

1. **端口管理**: 确保仅开放必要的端口（5000, 9000）
2. **访问控制**: 生产环境建议使用反向代理（nginx）和 HTTPS
3. **日志安全**: 定期清理日志，避免敏感信息泄露
4. **进程监控**: 使用 systemd 或 supervisor 管理进程

## 开发模式

如果需要使用 Vite 的开发模式（热更新）：
```bash
cd frontend
pnpm run dev
```

**注意**: 开发模式默认使用 5173 端口，不是 5000 端口。

## 生产部署

### 构建生产版本
```bash
cd frontend
pnpm run build
```

### 启动生产服务
```bash
./manage.sh start
```

### 验证部署
```bash
./manage.sh status
curl -I http://localhost:5000
```

## 更新说明

### 更新代码后重新部署
```bash
# 1. 停止服务
./manage.sh stop

# 2. 拉取最新代码
git pull

# 3. 重新构建
cd frontend
pnpm run build

# 4. 启动服务
cd ..
./manage.sh start

# 5. 验证
./manage.sh status
```

## 联系支持

如遇到问题，请提供以下信息：
1. 错误信息
2. 相关日志（`/app/work/logs/bypass/*.log`）
3. 服务状态（`./manage.sh status`）
4. 操作步骤

---

**最后更新**: 2026-03-04
**版本**: 1.0.0
**状态**: ✅ 已验证可用
