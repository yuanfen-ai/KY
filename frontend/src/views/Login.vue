<template>
  <PageTemplate :keyboard-height="isKeyboardVisible ? 220 : 0">
    <!-- 登录表单区 -->
    <div class="login-content">
      <div class="logo-area">
        <div class="logo-icon">🛡️</div>
        <h1 class="system-title">手持察打一体设备</h1>
        <p class="system-subtitle">反无人机操作控制系统</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label class="form-label">用户名</label>
          <div class="input-wrapper">
            <span class="input-icon">👤</span>
            <input
              ref="usernameInputRef"
              v-model="loginForm.username"
              type="text"
              inputmode="text"
              enterkeyhint="next"
              autocomplete="username"
              autocapitalize="none"
              autocorrect="off"
              spellcheck="false"
              class="form-input"
              placeholder="请输入用户名"
              @focus="handleInputFocus(usernameInputRef)"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">密码</label>
          <div class="input-wrapper">
            <span class="input-icon">🔒</span>
            <input
              ref="passwordInputRef"
              v-model="loginForm.password"
              :type="showPassword ? 'text' : 'password'"
              inputmode="text"
              enterkeyhint="done"
              autocomplete="current-password"
              autocapitalize="none"
              autocorrect="off"
              spellcheck="false"
              class="form-input"
              placeholder="请输入密码"
              @focus="handleInputFocus(passwordInputRef)"
            />
            <button type="button" class="toggle-password" @click="showPassword = !showPassword">
              {{ showPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
        </div>

        <!-- 登录失败悬浮提示 -->
        <Transition name="fade">
          <div v-if="errorMessage" class="error-toast">
            <span class="error-icon">⚠️</span>
            <span class="error-text">{{ errorMessage }}</span>
          </div>
        </Transition>

        <button type="submit" class="login-button" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>

        <div class="login-footer">
          <p class="device-info">设备序列号: SN20260301001</p>
          <p class="version-info">系统版本: v2.1.0</p>
        </div>
      </form>
    </div>

    <!-- 虚拟键盘 -->
    <VirtualKeyboard
      v-model:visible="isKeyboardVisible"
      :input-ref="currentInputRef"
      @close="handleKeyboardClose"
    />
  </PageTemplate>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { globalWebSocketManager } from '@/composables/useWebSocketManager';
import { WS_CONFIG } from '@/config';
import { createWsPacket, generateRequestId, getCurrentTimeString } from '@/utils/MessageHandler';
import PageTemplate from '@/components/PageTemplate.vue';
import VirtualKeyboard from '@/components/VirtualKeyboard.vue';

const router = useRouter();

// 默认登录账号
const DEFAULT_USERNAME = 'admin';

const loginForm = ref({
  username: DEFAULT_USERNAME,
  password: ''
});

const showPassword = ref(false);
const loading = ref(false);
const errorMessage = ref('');
const isKeyboardVisible = ref(false);
const currentInputRef = ref<HTMLInputElement | null>(null);

// 输入框 refs
const usernameInputRef = ref<HTMLInputElement | null>(null);
const passwordInputRef = ref<HTMLInputElement | null>(null);

// 待发送的登录请求ID，用于匹配响应
let pendingLoginRequestId: string | null = null;

/**
 * 处理输入框获取焦点（打开虚拟键盘）
 */
const handleInputFocus = (inputRef: HTMLInputElement | null) => {
  if (inputRef) {
    currentInputRef.value = inputRef;
    isKeyboardVisible.value = true;
  }
};

/**
 * 关闭虚拟键盘
 */
const handleKeyboardClose = () => {
  isKeyboardVisible.value = false;
};

/**
 * 初始化 WebSocket 连接（页面加载时立即建立）
 */
const initWebSocketConnection = () => {
  if (!WS_CONFIG.ENABLED) {
    return;
  }

  globalWebSocketManager.init({
    url: WS_CONFIG.URL,
    reconnectAttempts: WS_CONFIG.RECONNECT_ATTEMPTS,
    reconnectInterval: WS_CONFIG.RECONNECT_INTERVAL,
    heartbeatInterval: WS_CONFIG.HEARTBEAT_INTERVAL,
    heartbeatTimeout: WS_CONFIG.HEARTBEAT_TIMEOUT,
    onConnected: () => {
      // WebSocket 连接成功回调
      // 立即发送一次心跳
      const heartbeatPacket = createWsPacket('ping', {});
      heartbeatPacket.iType = '0';
      globalWebSocketManager.send(heartbeatPacket);
    },
    onDisconnected: () => {
      // WebSocket 连接断开回调
    },
    onError: (error) => {
      // WebSocket 连接错误回调
    }
  });
};

/**
 * 处理登录响应
 */
const handleLoginResponse = (data: any) => {
  // 检查是否是登录请求的响应（通过 iTo 匹配）
  if (pendingLoginRequestId && data.iTo === pendingLoginRequestId && data.iCode === 'DB001') {
    pendingLoginRequestId = null;
    loading.value = false;

    if (data.iSelfData && data.iSelfData.success === true) {
      // 登录成功
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('username', loginForm.value.username);
      router.push('/main');
    } else {
      // 登录失败，显示错误信息（使用服务端返回的 message）
      errorMessage.value = data.iSelfData?.message || '登录失败';
    }
  }
};

/**
 * 处理登录
 */
const handleLogin = async () => {
  if (loading.value) return;

  // 清除之前的错误信息
  errorMessage.value = '';

  // 验证用户名
  if (!loginForm.value.username || loginForm.value.username.trim() === '') {
    errorMessage.value = '用户名不能为空';
    return;
  }

  // 验证密码
  if (!loginForm.value.password || loginForm.value.password.trim() === '') {
    errorMessage.value = '密码不能为空';
    return;
  }

  loading.value = true;

  // 构建登录请求数据包
  const packet = createWsPacket('DB101', {
    username: loginForm.value.username,
    password: loginForm.value.password
  });
  packet.iType = 'db';

  // 保存请求ID，用于匹配响应
  pendingLoginRequestId = packet.iTo;

  // 发送登录请求
  globalWebSocketManager.send(packet);
};

onMounted(() => {
  // 清除残留的登录状态
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('username');

  // 页面加载时立即建立 WebSocket 连接
  initWebSocketConnection();

  // 监听 WebSocket 消息，处理登录响应
  globalWebSocketManager.on(handleLoginResponse);
});

onUnmounted(() => {
  // 组件卸载时移除监听
  globalWebSocketManager.off(handleLoginResponse);
});
</script>

<style scoped>
/* 登录内容区域 */
.login-content {
  flex: 1;
  padding: 30px 50px;
  padding-bottom: env(keyboard-inset-bottom, 30px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
}

.logo-area {
  text-align: center;
  margin-top: 5px;
  margin-bottom: 12px;
  line-height: 1.1;
}

.logo-icon {
  font-size: 56px;
  margin-bottom: 6px;
  animation: pulse 2s infinite;
  display: block;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.system-title {
  color: #ffffff;
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 3px;
  line-height: 1.1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.system-subtitle {
  color: #8892b0;
  font-size: 15px;
  line-height: 1.1;
  margin-bottom: 12px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-label {
  color: #ccd6f6;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.2;
  margin-bottom: 2px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  font-size: 16px;
  pointer-events: none;
  user-select: none;
}

.form-input {
  width: 100%;
  padding: 10px 14px 10px 44px;
  background: rgba(26, 26, 46, 0.8);
  border: 2px solid rgba(42, 42, 62, 0.8);
  border-radius: 8px;
  color: #ffffff;
  font-size: 16px;
  line-height: 1.2;
  transition: all 0.3s ease;
  position: relative;
  z-index: 10;
  cursor: text;
}

.form-input:focus {
  outline: none;
  border-color: #64ffda;
  box-shadow: 0 0 0 3px rgba(100, 255, 218, 0.1);
}

.form-input::placeholder {
  color: #8892b0;
}

/* 登录错误悬浮提示 */
.error-toast {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.85);
  border: 1px solid #ff4d4f;
  border-radius: 8px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.error-icon {
  font-size: 16px;
}

.error-text {
  color: #ff4d4f;
  font-size: 14px;
  font-weight: 500;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.toggle-password {
  position: absolute;
  right: 12px;
  background: transparent;
  border: none;
  color: #8892b0;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.3s ease;
  z-index: 1;
}

.toggle-password:hover {
  color: #64ffda;
  background: rgba(100, 255, 218, 0.1);
}

.login-button {
  width: 100%;
  padding: 10px;
  background: linear-gradient(135deg, #64ffda 0%, #4ecdc4 100%);
  border: none;
  border-radius: 8px;
  color: #0a0a0a;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(100, 255, 218, 0.3);
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(100, 255, 218, 0.4);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-footer {
  margin-top: 12px;
  margin-bottom: 10px;
  text-align: center;
}

.device-info {
  color: #8892b0;
  font-size: 12px;
  margin-bottom: 3px;
  line-height: 1.1;
}

.version-info {
  color: #8892b0;
  font-size: 12px;
  line-height: 1.1;
}
</style>
