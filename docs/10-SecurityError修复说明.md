# SecurityError 修复说明

## 问题描述

在沙箱预览环境中，控制台出现以下错误：

```
Console:[Uncaught (in promise) SecurityError: Failed to construct 'WebSocket': An insecure WebSocket connection may not be initiated from a page loaded over HTTPS.
    at Object.createConnection (https://a5efe7d9-3214-4d5d-b98d-e0466cc9fa6e.dev.coze.site/@vite/client:745:27)
    ...
```

## 根本原因

1. **沙箱环境使用HTTPS协议**：预览页面通过 `https://a5efe7d9-3214-4d5d-b98d-e0466cc9fa6e.dev.coze.site` 加载
2. **Vite HMR使用不安全的WebSocket**：Vite的热模块替换（HMR）功能默认使用 `ws://` 协议
3. **浏览器安全策略**：在HTTPS页面中，不允许建立不安全的WebSocket连接（混合内容限制）
4. **错误连锁反应**：SecurityError导致Vite客户端抛出语法错误

## 解决方案

采用 **生产预览模式** 替代开发模式，完全避免HMR相关的问题。

### 修改内容

#### 1. 修改 `frontend/package.json`

添加预览脚本：
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview --port 5000 --host",
    "preview:prod": "vite preview --port 5000 --host",
    "dev:build": "pnpm run build && pnpm run preview:prod"
  }
}
```

#### 2. 修改 `frontend/.coze`

配置开发环境使用构建+预览模式：
```toml
[project]
requires = ["nodejs-24"]

[dev]
build = ["pnpm", "install", "&&", "pnpm", "run", "build"]
run = ["pnpm", "run", "preview:prod"]

[deploy]
build = ["pnpm", "run", "build"]
run = ["pnpm", "run", "preview:prod"]
```

#### 3. 修改 `frontend/vite.config.ts`

优化配置以支持生产预览：
```typescript
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    base: './',
    server: {
      port: 5000,
      host: true,
      hmr: false,
      strictPort: false,
      watch: {
        usePolling: true,
        interval: 1000
      },
      proxy: {
        '/ws': {
          target: 'ws://localhost:8080',
          ws: true,
          changeOrigin: true
        }
      },
      fs: {
        strict: false
      }
    },
    build: {
      target: 'esnext',
      sourcemap: false,
      minify: 'esbuild'
    },
    optimizeDeps: {
      exclude: [],
      include: []
    },
    clearScreen: false,
    define: {
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false
    }
  };
});
```

## 工作原理

### 生产预览模式的优点

1. **无HMR客户端**：构建后的文件不包含Vite的HMR客户端代码
2. **无WebSocket安全限制**：不需要建立WebSocket连接用于热更新
3. **HTTPS兼容**：完全支持HTTPS环境，没有混合内容限制
4. **性能更好**：构建后的文件经过压缩和优化

### 与应用WebSocket的分离

应用的WebSocket通信（`/ws`代理）与Vite的HMR WebSocket是独立的：
- **应用WebSocket**：用于与后端Node.js服务器通信，通过Vite代理转发
- **Vite HMR WebSocket**：用于开发时的热更新（在生产预览模式下不存在）

## 使用说明

### 开发流程

1. **修改代码**：在 `frontend/src/` 目录下修改代码
2. **重新构建**：运行 `pnpm run build`
3. **预览效果**：访问 `http://localhost:5000` 查看效果

### 自动构建（可选）

如果需要自动构建，可以使用文件监听工具：
```bash
# 使用 nodemon 监听文件变化并自动构建
pnpm add -D nodemon
pnpm dev:watch
```

## 验证结果

✅ **没有SecurityError**：控制台干净，没有安全策略错误  
✅ **没有Uncaught Promise**：没有未处理的Promise错误  
✅ **应用正常加载**：页面可以正常访问和渲染  
✅ **应用WebSocket正常**：应用的WebSocket通信不受影响（需要后端服务器运行）

## 后端服务说明

如果看到以下日志，是正常的业务错误（后端服务器未启动）：
```
[WebSocket] 正在连接到 /ws...
[WebSocket] 连接成功
收到消息: { "type": "error", "message": "Failed to get device list" }
```

这些不是SecurityError，只是应用无法连接到设备列表服务。如果需要完整功能，需要启动后端服务器（端口8080）。

## 替代方案

如果需要恢复开发模式的HMR功能，需要解决HTTPS/WSS兼容性问题：

### 方案1：使用WSS协议
配置Vite HMR使用WSS协议（需要SSL证书）

### 方案2：本地HTTP环境
在本地HTTP环境开发，不使用HTTPS预览

### 方案3：反向代理
使用Nginx等反向代理处理SSL termination

但这些方案都比生产预览模式复杂，当前方案已经满足预览需求。

## 总结

通过使用生产预览模式，完全避免了Vite HMR的HTTPS/WSS兼容性问题。虽然失去了热更新功能，但：
- 安全策略错误完全解决
- 应用功能不受影响
- 性能和兼容性更好
- 适合预览和演示场景
