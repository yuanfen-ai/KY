# KY 项目 API 接口文档

## 文档信息

| 项目 | 内容 |
|------|------|
| 项目名称 | KY（设备管控与数据通信系统） |
| 文档版本 | v1.0 |
| 协议类型 | WebSocket + HTTP (RESTful) |
| Base URL | `ws://localhost:5000/ws` (WebSocket) |

---

## 一、WebSocket 消息协议

### 1.1 消息格式

所有WebSocket消息都采用JSON格式：

```typescript
interface WebSocketMessage {
  type: string;        // 消息类型
  deviceId?: string;   // 设备ID（部分消息需要）
  data?: any;          // 数据负载
  timestamp: number;   // 时间戳
}
```

### 1.2 连接与认证

#### 建立连接

**请求**：
```
GET ws://localhost:5000/ws?token=<JWT_TOKEN>
```

**参数**：
- `token`: JWT认证令牌

**响应**：
```json
{
  "type": "connected",
  "sessionId": "session_1234567890_abc",
  "timestamp": 1707568900000
}
```

---

## 二、客户端 → 服务器消息

### 2.1 心跳检测

**消息类型**：`ping`

**请求**：
```json
{
  "type": "ping",
  "timestamp": 1707568900000
}
```

**响应**：
```json
{
  "type": "pong",
  "timestamp": 1707568900000
}
```

---

### 2.2 订阅设备数据

**消息类型**：`subscribe`

**请求**：
```json
{
  "type": "subscribe",
  "deviceId": "DEV-001",
  "timestamp": 1707568900000
}
```

**成功响应**：
```json
{
  "type": "subscribed",
  "deviceId": "DEV-001",
  "timestamp": 1707568900000
}
```

**错误响应**：
```json
{
  "type": "error",
  "message": "Device not found",
  "timestamp": 1707568900000
}
```

---

### 2.3 取消订阅

**消息类型**：`unsubscribe`

**请求**：
```json
{
  "type": "unsubscribe",
  "deviceId": "DEV-001",
  "timestamp": 1707568900000
}
```

**响应**：
```json
{
  "type": "unsubscribed",
  "deviceId": "DEV-001",
  "timestamp": 1707568900000
}
```

---

### 2.4 发送设备指令

**消息类型**：`command`

**请求**：
```json
{
  "type": "command",
  "deviceId": "DEV-001",
  "data": {
    "command": "START",
    "params": {
      "speed": 100,
      "mode": "auto"
    }
  },
  "timestamp": 1707568900000
}
```

**成功响应**：
```json
{
  "type": "deviceResponse",
  "deviceId": "DEV-001",
  "status": "success",
  "result": {
    "ack": true,
    "message": "Command executed successfully"
  },
  "timestamp": 1707568900000
}
```

**失败响应**：
```json
{
  "type": "deviceResponse",
  "deviceId": "DEV-001",
  "status": "error",
  "message": "Device offline",
  "timestamp": 1707568900000
}
```

**支持的指令类型**：

| 指令 | 说明 | 参数 |
|------|------|------|
| START | 启动设备 | speed, mode |
| STOP | 停止设备 | - |
| RESET | 重置设备 | - |
| GET_STATUS | 获取状态 | - |
| SET_CONFIG | 设置配置 | config对象 |
| UPDATE_FIRMWARE | 更新固件 | version, url |

---

### 2.5 获取设备列表

**消息类型**：`getDeviceList`

**请求**：
```json
{
  "type": "getDeviceList",
  "timestamp": 1707568900000
}
```

**响应**：
```json
{
  "type": "deviceList",
  "devices": [
    {
      "id": 1,
      "device_id": "DEV-001",
      "device_name": "温度传感器-1",
      "device_type": "sensor",
      "status": "online",
      "tcp_host": "192.168.1.101",
      "tcp_port": 8080,
      "last_heartbeat": "2024-01-10T10:00:00Z"
    }
  ],
  "timestamp": 1707568900000
}
```

---

## 三、服务器 → 客户端消息

### 3.1 设备数据推送

**消息类型**：`deviceData`

**推送时机**：设备主动上报数据时，推送给所有订阅该设备的客户端

**消息格式**：
```json
{
  "type": "deviceData",
  "deviceId": "DEV-001",
  "data": {
    "temperature": 25.5,
    "humidity": 60,
    "timestamp": 1707568900000
  },
  "timestamp": 1707568900000
}
```

---

### 3.2 设备状态变更

**消息类型**：`deviceStatusChange`

**推送时机**：设备上线/离线/异常时

**消息格式**：
```json
{
  "type": "deviceStatusChange",
  "deviceId": "DEV-001",
  "oldStatus": "online",
  "newStatus": "offline",
  "timestamp": 1707568900000
}
```

---

### 3.3 告警通知

**消息类型**：`alert`

**推送时机**：设备产生告警时

**消息格式**：
```json
{
  "type": "alert",
  "deviceId": "DEV-001",
  "alert": {
    "id": 123,
    "type": "temperature_high",
    "level": "warning",
    "message": "Temperature exceeds threshold",
    "value": 45.5,
    "threshold": 40
  },
  "timestamp": 1707568900000
}
```

**告警级别**：
- `info`: 信息提示
- `warning`: 警告
- `error`: 错误
- `critical`: 严重

---

### 3.4 连接状态通知

**消息类型**：`connectionStatus`

**推送时机**：服务器主动通知连接状态变化

**消息格式**：
```json
{
  "type": "connectionStatus",
  "status": "reconnecting",
  "attempt": 2,
  "maxAttempts": 5,
  "message": "Attempting to reconnect...",
  "timestamp": 1707568900000
}
```

---

## 四、HTTP RESTful API

### 4.1 认证接口

#### 登录

**请求**：
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}
```

**响应**：
```json
{
  "code": 200,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "role": "admin"
    }
  }
}
```

---

### 4.2 设备管理接口

#### 获取设备列表

**请求**：
```
GET /api/devices?page=1&size=20&status=online
Authorization: Bearer <JWT_TOKEN>
```

**参数**：
- `page`: 页码（默认1）
- `size`: 每页数量（默认20）
- `status`: 设备状态过滤（可选）

**响应**：
```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "total": 50,
    "page": 1,
    "size": 20,
    "items": [
      {
        "id": 1,
        "device_id": "DEV-001",
        "device_name": "温度传感器-1",
        "device_type": "sensor",
        "status": "online",
        "tcp_host": "192.168.1.101",
        "tcp_port": 8080,
        "last_heartbeat": "2024-01-10T10:00:00Z",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

---

#### 获取设备详情

**请求**：
```
GET /api/devices/:id
Authorization: Bearer <JWT_TOKEN>
```

**响应**：
```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "id": 1,
    "device_id": "DEV-001",
    "device_name": "温度传感器-1",
    "device_type": "sensor",
    "status": "online",
    "tcp_host": "192.168.1.101",
    "tcp_port": 8080,
    "last_heartbeat": "2024-01-10T10:00:00Z",
    "metadata": {
      "location": "Factory A",
      "version": "1.0.0"
    },
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-10T10:00:00Z"
  }
}
```

---

#### 创建设备

**请求**：
```
POST /api/devices
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "device_id": "DEV-004",
  "device_name": "温度传感器-4",
  "device_type": "sensor",
  "tcp_host": "192.168.1.104",
  "tcp_port": 8080,
  "metadata": {
    "location": "Factory B"
  }
}
```

**响应**：
```json
{
  "code": 201,
  "message": "Device created successfully",
  "data": {
    "id": 4,
    "device_id": "DEV-004",
    "device_name": "温度传感器-4",
    "device_type": "sensor",
    "status": "offline",
    "created_at": "2024-01-10T10:00:00Z"
  }
}
```

---

#### 更新设备

**请求**：
```
PUT /api/devices/:id
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "device_name": "温度传感器-1（更新）",
  "metadata": {
    "location": "Factory A - Line 1"
  }
}
```

**响应**：
```json
{
  "code": 200,
  "message": "Device updated successfully",
  "data": {
    "id": 1,
    "device_id": "DEV-001",
    "device_name": "温度传感器-1（更新）",
    "updated_at": "2024-01-10T10:00:00Z"
  }
}
```

---

#### 删除设备

**请求**：
```
DELETE /api/devices/:id
Authorization: Bearer <JWT_TOKEN>
```

**响应**：
```json
{
  "code": 200,
  "message": "Device deleted successfully"
}
```

---

### 4.3 指令记录接口

#### 获取指令记录

**请求**：
```
GET /api/commands?deviceId=DEV-001&page=1&size=20
Authorization: Bearer <JWT_TOKEN>
```

**参数**：
- `deviceId`: 设备ID（可选）
- `page`: 页码（默认1）
- `size`: 每页数量（默认20）

**响应**：
```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "total": 100,
    "page": 1,
    "size": 20,
    "items": [
      {
        "id": 1,
        "session_id": "session_123",
        "device_id": "DEV-001",
        "command_type": "START",
        "command_payload": {
          "speed": 100,
          "mode": "auto"
        },
        "status": "success",
        "response": {
          "ack": true
        },
        "created_at": "2024-01-10T10:00:00Z"
      }
    ]
  }
}
```

---

### 4.4 数据查询接口

#### 获取设备数据

**请求**：
```
GET /api/devices/:deviceId/data?startTime=2024-01-01T00:00:00Z&endTime=2024-01-10T23:59:59Z&page=1&size=100
Authorization: Bearer <JWT_TOKEN>
```

**参数**：
- `deviceId`: 设备ID
- `startTime`: 开始时间
- `endTime`: 结束时间
- `page`: 页码
- `size`: 每页数量

**响应**：
```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "total": 1000,
    "page": 1,
    "size": 100,
    "items": [
      {
        "id": 1,
        "device_id": "DEV-001",
        "data_type": "sensor_data",
        "data_value": {
          "temperature": 25.5,
          "humidity": 60
        },
        "received_at": "2024-01-10T10:00:00Z"
      }
    ]
  }
}
```

---

### 4.5 告警接口

#### 获取告警列表

**请求**：
```
GET /api/alerts?deviceId=DEV-001&level=warning&resolved=false&page=1&size=20
Authorization: Bearer <JWT_TOKEN>
```

**参数**：
- `deviceId`: 设备ID（可选）
- `level`: 告警级别（可选）
- `resolved`: 是否已解决（可选）
- `page`: 页码
- `size`: 每页数量

**响应**：
```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "total": 10,
    "page": 1,
    "size": 20,
    "items": [
      {
        "id": 1,
        "device_id": "DEV-001",
        "alert_type": "temperature_high",
        "alert_level": "warning",
        "message": "Temperature exceeds threshold",
        "metadata": {
          "value": 45.5,
          "threshold": 40
        },
        "resolved": false,
        "created_at": "2024-01-10T10:00:00Z"
      }
    ]
  }
}
```

---

#### 标记告警已解决

**请求**：
```
PUT /api/alerts/:id/resolve
Authorization: Bearer <JWT_TOKEN>
```

**响应**：
```json
{
  "code": 200,
  "message": "Alert resolved successfully",
  "data": {
    "id": 1,
    "resolved": true,
    "resolved_at": "2024-01-10T10:30:00Z"
  }
}
```

---

### 4.6 系统状态接口

#### 获取系统状态

**请求**：
```
GET /api/system/status
Authorization: Bearer <JWT_TOKEN>
```

**响应**：
```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "websocket": {
      "connections": 150,
      "maxConnections": 5000,
      "status": "running"
    },
    "tcp": {
      "connectedDevices": 45,
      "totalDevices": 50,
      "status": "running"
    },
    "database": {
      "status": "connected",
      "connections": 15,
      "maxConnections": 100
    },
    "redis": {
      "status": "connected",
      "memory": "256MB"
    },
    "uptime": 86400,
    "timestamp": "2024-01-10T10:00:00Z"
  }
}
```

---

## 五、错误码规范

### 5.1 HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

### 5.2 业务错误码

| 错误码 | 说明 |
|--------|------|
| 1001 | 设备不存在 |
| 1002 | 设备离线 |
| 1003 | 指令格式错误 |
| 1004 | 指令执行失败 |
| 1005 | 设备连接失败 |
| 2001 | 认证失败 |
| 2002 | Token过期 |
| 3001 | 数据库错误 |
| 3002 | 缓存错误 |

**错误响应格式**：
```json
{
  "code": 1002,
  "message": "Device offline",
  "timestamp": 1707568900000
}
```

---

## 六、数据类型定义

### 6.1 设备状态枚举

```typescript
enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  ERROR = 'error'
}
```

### 6.2 指令状态枚举

```typescript
enum CommandStatus {
  PENDING = 'pending',
  SENT = 'sent',
  SUCCESS = 'success',
  FAILED = 'failed',
  TIMEOUT = 'timeout'
}
```

### 6.3 告警级别枚举

```typescript
enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}
```

---

## 七、WebSocket 事件流示例

### 7.1 典型会话流程

```
客户端                          服务器
  │                              │
  │───── 连接请求 ──────────────>│
  │<──── connected ──────────────│
  │                              │
  │───── subscribe(DEV-001) ────>│
  │<──── subscribed ─────────────│
  │                              │
  │───── command(START) ────────>│
  │──────> TCP设备 ─────────────>│
  │<───── TCP响应 ──────────────│
  │<──── deviceResponse ─────────│
  │                              │
  │<──── deviceData(推送) ───────│
  │                              │
  │───── ping ──────────────────>│
  │<──── pong ──────────────────│
  │                              │
  │───── unsubscribe(DEV-001) ──>│
  │<──── unsubscribed ───────────│
  │                              │
  │───── close ─────────────────>│
```

---

**文档版本**：v1.0  
**最后更新**：2024年
