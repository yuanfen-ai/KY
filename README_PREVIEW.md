# 预览窗口问题诊断指南

## 问题描述
预览窗口一直显示"预览准备中...."，无法正常加载应用。

## 诊断步骤

### 1. 访问诊断工具
打开浏览器访问：**http://localhost:5000/diagnostic.html**

这个诊断工具会自动测试：
- JavaScript执行
- localStorage功能
- ES6模块加载
- DOM操作
- Fetch API

### 2. 查看浏览器控制台
打开浏览器的开发者工具（F12），检查Console标签页是否有错误信息。

### 3. 检查网络请求
在开发者工具的Network标签页，检查所有资源是否成功加载。

## 可能的问题和解决方案

### 问题1: 登录状态缓存导致自动跳转
**症状**：应用启动后直接跳转到/main，但页面没有渲染
**原因**：localStorage中保存了登录状态
**解决方法**：
1. 访问 http://localhost:5000/diagnostic.html
2. 点击"清除登录状态"按钮
3. 刷新页面

### 问题2: JavaScript运行时错误
**症状**：浏览器控制台显示错误信息
**解决方法**：
1. 打开浏览器开发者工具
2. 查看Console标签页的错误信息
3. 根据错误信息修复代码

### 问题3: 资源加载失败
**症状**：Network标签页显示某些资源加载失败（404或500错误）
**解决方法**：
1. 检查服务器是否正常运行
2. 检查构建产物是否完整
3. 重新构建应用：`cd /workspace/projects/frontend && pnpm run build`

### 问题4: 预览窗口超时
**症状**：应用本身正常，但预览窗口一直显示"预览准备中"
**原因**：预览窗口可能在等待特定响应或超时设置过短
**解决方法**：
1. 直接在浏览器中访问 http://localhost:5000
2. 如果应用在浏览器中正常显示，说明应用本身没有问题
3. 问题可能出在预览窗口的平台配置

## 正常的初始化流程

根据调试日志，正常的初始化流程应该是：

1. **[Main]** 开始初始化Vue应用
2. **[Main]** 注册Pinia
3. **[Main]** 注册Element Plus
4. **[Main]** 注册路由
5. **[Main]** 挂载应用到#app
6. **[App]** 组件开始加载
7. **[App]** onMounted执行
8. **[Router]** 路由跳转检查
9. **[Login]** 或 **[MainPage]** 组件加载

## 当前应用状态

✅ Vue应用初始化正常
✅ 路由配置正常
✅ Main组件加载正常
✅ 所有资源加载成功

## 如何访问应用

1. **登录页面**: http://localhost:5000/login
   - 默认用户名: admin
   - 默认密码: 123456

2. **主页面**: http://localhost:5000/main

3. **诊断工具**: http://localhost:5000/diagnostic.html

## 服务管理

### 启动服务
```bash
cd /workspace/projects/frontend
./start-server.sh
```

### 停止服务
```bash
cd /workspace/projects/frontend
./stop-server.sh
```

### 查看日志
```bash
# 查看服务器日志
tail -n 50 /app/work/logs/bypass/dev.log

# 查看控制台日志
tail -n 50 /app/work/logs/bypass/console.log
```

## 重新构建

如果代码有修改，需要重新构建：

```bash
cd /workspace/projects/frontend
pnpm run build
```

然后重启服务：

```bash
cd /workspace/projects/frontend
./stop-server.sh
./start-server.sh
```

## 技术栈

- **前端**: Vue 3 + TypeScript + Element Plus
- **路由**: Vue Router (history模式)
- **状态管理**: Pinia
- **构建工具**: Vite 7.3.1
- **静态服务器**: Node.js (自定义实现)

## 联系支持

如果问题仍然存在，请提供：
1. 浏览器控制台的错误信息
2. 网络请求失败的资源列表
3. 诊断工具的测试结果
4. 具体的操作步骤和现象描述
