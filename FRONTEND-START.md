# 手持察打一体设备 - 快速启动指南

## 问题说明

### 错误信息
```
execute command error: can only join an iterable
```

### 错误原因
这个错误是由 `coze CLI` 工具（版本 0.0.1-alpha.ef8b63）引起的：

1. `coze dev` 命令在启动时会尝试读取 `templates.json` 文件
2. 由于项目中没有这个文件，导致 `templatesConfig.templates` 为 `undefined`
3. coze CLI 中的代码尝试对 `undefined` 调用 `.map()` 和 `.join()`，导致错误

### 解决方案
使用提供的 `start-frontend.sh` 脚本，绕过 coze CLI，直接使用原生命令启动服务。

## 使用方法

### 1. 安装依赖
```bash
./start-frontend.sh install
```

### 2. 构建项目
```bash
./start-frontend.sh build
```

### 3. 启动服务
```bash
./start-frontend.sh start
```

### 4. 查看状态
```bash
./start-frontend.sh status
```

### 5. 查看日志
```bash
./start-frontend.sh logs
```

### 6. 停止服务
```bash
./start-frontend.sh stop
```

### 7. 重启服务
```bash
./start-frontend.sh restart
```

## 一键启动（推荐）

```bash
# 安装依赖 + 构建项目 + 启动服务
./start-frontend.sh start
```

## 访问地址

- **前端服务**：http://localhost:5000
- **登录账号**：admin
- **登录密码**：123456

## 日志文件

- **前端日志**：`/tmp/frontend.log`

## 系统要求

- Node.js: 20.x 或更高版本
- pnpm: 最新版本

## 技术栈

- **前端框架**：Vue 3
- **UI 组件库**：Element Plus
- **构建工具**：Vite
- **静态服务器**：Node.js 自定义服务器

## 常见问题

### Q: 为什么不使用 `coze dev` 启动？
A: coze CLI 在当前版本存在 bug，会导致 "can only join an iterable" 错误。使用提供的脚本可以绕过这个问题。

### Q: 服务启动后如何访问？
A: 在浏览器中打开 http://localhost:5000 即可访问。

### Q: 如何查看服务日志？
A: 运行 `./start-frontend.sh logs` 命令，或者直接查看 `/tmp/frontend.log` 文件。

### Q: 如何停止服务？
A: 运行 `./start-frontend.sh stop` 命令。

### Q: 服务端口被占用怎么办？
A: 修改 `frontend/server.mjs` 文件中的 `PORT` 常量，或者停止占用 5000 端口的其他服务。

## 更新日志

### v1.0.0 (2024-03-04)
- 初始版本
- 解决 coze CLI 的 "can only join an iterable" 错误
- 提供一键启动脚本
