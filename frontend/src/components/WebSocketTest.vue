<template>
  <div class="websocket-test">
    <h2>WebSocket 通信测试</h2>

    <!-- 连接状态 -->
    <div class="status-panel">
      <div class="status-item">
        <span class="label">连接状态:</span>
        <span :class="['value', { connected: isConnected }]">
          {{ isConnected ? '已连接' : '未连接' }}
        </span>
      </div>
      <div class="status-item">
        <span class="label">服务端:</span>
        <span class="value">{{ serverUrl }}</span>
      </div>
    </div>

    <!-- 连接控制 -->
    <div class="control-panel">
      <button @click="connect" :disabled="isConnected" class="btn btn-primary">
        连接
      </button>
      <button @click="disconnect" :disabled="!isConnected" class="btn btn-danger">
        断开
      </button>
      <button @click="clearLog" class="btn btn-secondary">
        清空日志
      </button>
    </div>

    <!-- 测试功能区 -->
    <div class="test-panel">
      <h3>消息测试</h3>
      <div class="test-buttons">
        <button @click="sendUAVTargetReport" :disabled="!isConnected" class="btn btn-sm">
          发送目标上报请求
        </button>
        <button @click="sendControlCommand" :disabled="!isConnected" class="btn btn-sm">
          发送控制命令
        </button>
        <button @click="sendTaskAssign" :disabled="!isConnected" class="btn btn-sm">
          发送任务分配
        </button>
        <button @click="sendAlarmInfo" :disabled="!isConnected" class="btn btn-sm">
          请求告警信息
        </button>
        <button @click="sendHeartbeat" :disabled="!isConnected" class="btn btn-sm">
          发送心跳
        </button>
      </div>

      <h3>测试工具</h3>
      <div class="test-tools">
        <div class="input-group">
          <input
            v-model="customMessage"
            type="text"
            placeholder="自定义消息 JSON"
            class="input"
          />
          <button @click="sendCustomMessage" :disabled="!isConnected" class="btn btn-sm">
            发送
          </button>
        </div>
        <div class="input-group">
          <button @click="startAutoTest" :disabled="!isConnected" class="btn btn-sm">
            {{ autoTestRunning ? '停止自动测试' : '开始自动测试' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 消息日志 -->
    <div class="log-panel">
      <h3>消息日志 ({{ logMessages.length }})</h3>
      <div class="log-container" ref="logContainer">
        <div
          v-for="(log, index) in logMessages"
          :key="index"
          :class="['log-item', log.type]"
        >
          <span class="log-time">{{ log.time }}</span>
          <span class="log-direction">[{{ log.direction }}]</span>
          <span class="log-type">{{ log.messageType }}</span>
          <pre class="log-data">{{ formatJson(log.data) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { messageHandler, MessageType, sendMessage, sendRequest } from '@/utils/MessageHandler';
import { useWebSocketManager } from '@/composables/useWebSocketManager';

// WebSocket 管理器
const { init, destroy, isConnected, connectionState } = useWebSocketManager();

// 服务器地址
const serverUrl = ref('ws://localhost:8080');

// 日志
const logMessages = ref<Array<{
  time: string;
  direction: '发送' | '接收';
  messageType: string;
  data: any;
  type: string;
}>>([]);
const logContainer = ref<HTMLElement | null>(null);

// 自定义消息
const customMessage = ref('');

// 自动测试
const autoTestRunning = ref(false);
let autoTestTimer: ReturnType<typeof setInterval> | null = null;

/**
 * 获取当前时间字符串
 */
function getTimeString(): string {
  const now = new Date();
  return now.toLocaleTimeString('zh-CN', { hour12: false }) + '.' + now.getMilliseconds().toString().padStart(3, '0');
}

/**
 * 添加日志
 */
function addLog(direction: '发送' | '接收', messageType: string, data: any): void {
  logMessages.value.push({
    time: getTimeString(),
    direction,
    messageType,
    data,
    type: direction === '发送' ? 'send' : 'receive'
  });
  
  // 自动滚动到底部
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  });
}

/**
 * 格式化 JSON
 */
function formatJson(data: any): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

/**
 * 连接
 */
function connect(): void {
  init({
    url: serverUrl.value,
    onConnected: () => {
      addLog('接收', '系统', { message: '连接成功' });
    },
    onDisconnected: () => {
      addLog('接收', '系统', { message: '连接断开' });
      stopAutoTest();
    },
    onMessage: (data) => {
      addLog('接收', data.type || '未知', data.data || data);
    },
    onError: (error) => {
      addLog('接收', '错误', { message: String(error) });
    }
  });
}

/**
 * 断开连接
 */
function disconnect(): void {
  destroy();
  stopAutoTest();
}

/**
 * 清空日志
 */
function clearLog(): void {
  logMessages.value = [];
}

// ==================== 消息发送测试 ====================

/**
 * 发送无人机目标上报请求
 */
async function sendUAVTargetReport(): Promise<void> {
  addLog('发送', 'stUAVTargetReport', { action: 'request' });
  
  // 注册一次性处理器
  messageHandler.setUAVHandlers({
    onTargetReport: (data) => {
      addLog('接收', 'stUAVTargetReport', data);
    }
  });
  
  sendMessage(MessageType.UAV_TARGET_REPORT, { action: 'request' });
}

/**
 * 发送控制命令
 */
async function sendControlCommand(): Promise<void> {
  const commandId = `CMD_${Date.now()}`;
  const command = {
    commandId,
    action: 'track',
    targetId: 'UAV_001',
    params: { mode: 'auto' }
  };
  
  addLog('发送', 'stControlCommand', command);
  
  // 注册命令响应处理器
  messageHandler.setDeviceHandlers({
    onCommandResponse: (data) => {
      if (data.commandId === commandId) {
        addLog('接收', 'stCommandResponse', data);
      }
    }
  });
  
  sendMessage(MessageType.CONTROL_COMMAND, command);
}

/**
 * 发送任务分配请求
 */
function sendTaskAssign(): void {
  const taskRequest = {
    action: 'request',
    taskType: 'surveillance'
  };
  
  addLog('发送', 'stTaskAssign', taskRequest);
  
  messageHandler.setTaskHandlers({
    onTaskAssign: (data) => {
      addLog('接收', 'stTaskAssign', data);
    }
  });
  
  sendMessage(MessageType.TASK_ASSIGN, taskRequest);
}

/**
 * 请求告警信息
 */
function sendAlarmInfo(): void {
  addLog('发送', 'stAlarmInfo', { action: 'request' });
  
  messageHandler.setSystemHandlers({
    onAlarmInfo: (data) => {
      addLog('接收', 'stAlarmInfo', data);
    }
  });
  
  sendMessage(MessageType.ALARM_INFO, { action: 'request' });
}

/**
 * 发送心跳
 */
function sendHeartbeat(): void {
  const heartbeat = {
    type: 'ping',
    timestamp: Date.now()
  };
  
  sendMessage('ping', heartbeat);
  addLog('发送', 'ping', heartbeat);
}

/**
 * 发送自定义消息
 */
function sendCustomMessage(): void {
  try {
    const message = JSON.parse(customMessage.value);
    sendMessage(message.type || 'custom', message.data);
    addLog('发送', message.type || 'custom', message.data || message);
  } catch (error) {
    addLog('发送', '错误', { message: 'JSON 格式错误', error: String(error) });
  }
}

// ==================== 自动测试 ====================

/**
 * 开始自动测试
 */
function startAutoTest(): void {
  if (autoTestRunning.value) {
    stopAutoTest();
    return;
  }

  autoTestRunning.value = true;
  addLog('系统', '自动测试', { message: '开始自动测试' });

  // 设置处理器
  messageHandler.setUAVHandlers({
    onTargetReport: (data) => addLog('接收', 'stUAVTargetReport', data),
    onTargetUpdate: (data) => addLog('接收', 'stUAVTargetUpdate', data),
  });

  messageHandler.setDeviceHandlers({
    onCommandResponse: (data) => addLog('接收', 'stCommandResponse', data),
  });

  messageHandler.setSystemHandlers({
    onAlarmInfo: (data) => addLog('接收', 'stAlarmInfo', data),
  });

  // 每 2 秒发送一条测试消息
  autoTestTimer = setInterval(() => {
    const testTypes = [
      () => {
        sendMessage(MessageType.UAV_TARGET_REPORT, { action: 'auto_test' });
        addLog('发送', 'stUAVTargetReport', { action: 'auto_test' });
      },
      () => {
        sendMessage('ping', { timestamp: Date.now() });
        addLog('发送', 'ping', { timestamp: Date.now() });
      },
      () => {
        sendMessage(MessageType.ALARM_INFO, { action: 'auto_test' });
        addLog('发送', 'stAlarmInfo', { action: 'auto_test' });
      },
    ];

    const randomTest = testTypes[Math.floor(Math.random() * testTypes.length)];
    randomTest();
  }, 2000);
}

/**
 * 停止自动测试
 */
function stopAutoTest(): void {
  if (autoTestTimer) {
    clearInterval(autoTestTimer);
    autoTestTimer = null;
  }
  autoTestRunning.value = false;
  addLog('系统', '自动测试', { message: '停止自动测试' });
}

// 组件卸载时清理
onUnmounted(() => {
  stopAutoTest();
  destroy();
});
</script>

<style scoped>
.websocket-test {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

h2 {
  margin-bottom: 20px;
  color: #333;
}

h3 {
  margin: 16px 0 12px;
  font-size: 16px;
  color: #666;
}

/* 状态面板 */
.status-panel {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.status-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.status-item:last-child {
  margin-bottom: 0;
}

.status-item .label {
  font-weight: 600;
  margin-right: 8px;
}

.status-item .value {
  color: #666;
}

.status-item .value.connected {
  color: #52c41a;
  font-weight: 600;
}

/* 控制面板 */
.control-panel {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

/* 测试面板 */
.test-panel {
  background: #fafafa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.test-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.test-tools {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-group {
  display: flex;
  gap: 8px;
}

.input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

/* 按钮样式 */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #1890ff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #40a9ff;
}

.btn-danger {
  background: #ff4d4f;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #ff7875;
}

.btn-secondary {
  background: #999;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #777;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
  background: #e6f7ff;
  color: #1890ff;
}

.btn-sm:hover:not(:disabled) {
  background: #bae7ff;
}

/* 日志面板 */
.log-panel {
  background: #1e1e1e;
  border-radius: 8px;
  padding: 16px;
}

.log-panel h3 {
  color: #fff;
  margin-bottom: 12px;
}

.log-container {
  max-height: 400px;
  overflow-y: auto;
  font-family: 'Consolas', monospace;
  font-size: 12px;
}

.log-item {
  padding: 6px 8px;
  margin-bottom: 4px;
  border-radius: 4px;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 8px;
}

.log-item.send {
  background: #1a3a1a;
  border-left: 3px solid #52c41a;
}

.log-item.receive {
  background: #1a1a3a;
  border-left: 3px solid #1890ff;
}

.log-time {
  color: #888;
  flex-shrink: 0;
}

.log-direction {
  color: #aaa;
  flex-shrink: 0;
}

.log-type {
  color: #ffc107;
  font-weight: 600;
  flex-shrink: 0;
}

.log-data {
  width: 100%;
  margin: 4px 0 0;
  color: #d4d4d4;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
