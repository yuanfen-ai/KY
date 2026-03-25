<template>
  <PageTemplate>
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
              v-model="loginForm.username"
              type="text"
              class="form-input"
              placeholder="请输入用户名"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">密码</label>
          <div class="input-wrapper">
            <span class="input-icon">🔒</span>
            <input
              v-model="loginForm.password"
              :type="showPassword ? 'text' : 'password'"
              class="form-input"
              placeholder="请输入密码"
              required
            />
            <button type="button" class="toggle-password" @click="showPassword = !showPassword">
              {{ showPassword ? '👁️' : '👁️‍🗨️' }}
            </button>
          </div>
        </div>

        <button type="submit" class="login-button" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>

        <div class="login-footer">
          <p class="device-info">设备序列号: SN20260301001</p>
          <p class="version-info">系统版本: v2.1.0</p>
        </div>
      </form>
    </div>
  </PageTemplate>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { globalWebSocketManager } from '@/composables/useWebSocketManager';
import { WS_CONFIG } from '@/config';
import PageTemplate from '@/components/PageTemplate.vue';

// 添加调试日志
console.log('[Login] 组件开始加载...');

const router = useRouter();

console.log('[Login] router实例:', !!router);

// 默认登录账号和密码
const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = '123456';

const loginForm = ref({
  username: DEFAULT_USERNAME, // 预填充默认账号
  password: DEFAULT_PASSWORD  // 预填充默认密码
});

const showPassword = ref(false);
const loading = ref(false);

console.log('[Login] 响应式数据初始化完成');

/**
 * 初始化 WebSocket 连接
 */
const initWebSocketConnection = () => {
  // 检查是否启用 WebSocket
  if (!WS_CONFIG.ENABLED) {
    console.log('[Login] WebSocket 未启用，跳过初始化');
    return;
  }

  console.log('[Login] ═══════════════════════════════════');
  console.log('[Login] 开始初始化 WebSocket 连接...');
  console.log(`[Login] WebSocket 地址: ${WS_CONFIG.URL}`);
  console.log(`[Login] 重连次数: ${WS_CONFIG.RECONNECT_ATTEMPTS}`);
  console.log(`[Login] 心跳间隔: ${WS_CONFIG.HEARTBEAT_INTERVAL}ms`);
  
  globalWebSocketManager.init({
    url: WS_CONFIG.URL,
    reconnectAttempts: WS_CONFIG.RECONNECT_ATTEMPTS,
    reconnectInterval: WS_CONFIG.RECONNECT_INTERVAL,
    heartbeatInterval: WS_CONFIG.HEARTBEAT_INTERVAL,
    heartbeatTimeout: WS_CONFIG.HEARTBEAT_TIMEOUT,
    onConnected: () => {
      console.log('[Login] ✅ WebSocket 连接成功');
    },
    onDisconnected: () => {
      console.warn('[Login] ⚠️ WebSocket 连接已断开');
    },
    onError: (error) => {
      console.error('[Login] ❌ WebSocket 连接错误:', error);
    }
  });
  
  console.log('[Login] WebSocket 初始化请求已发送');
  console.log('[Login] ═══════════════════════════════════');
};

const handleLogin = async () => {
  if (loading.value) return;

  loading.value = true;

  // 模拟登录验证
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 验证用户名和密码
    if (loginForm.value.username === DEFAULT_USERNAME && loginForm.value.password === DEFAULT_PASSWORD) {
      console.log('[Login] ✅ 登录验证成功');
      
      // 保存登录状态
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('username', loginForm.value.username);

      // 登录成功后初始化 WebSocket 连接
      initWebSocketConnection();

      // 跳转到主页面
      router.push('/main');
    } else {
      alert('用户名或密码错误！');
    }
  } catch (error) {
    console.error('[Login] ❌ 登录失败:', error);
    alert('登录失败，请重试');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  console.log('[Login] onMounted 开始执行');

  // 清除残留的登录状态，确保系统启动后总是进入登录界面
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('username');
  console.log('[Login] 已清除残留登录状态');

  // 检查是否已登录（此时应该为 false）
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  console.log('[Login] 登录状态检查:', isLoggedIn);

  if (isLoggedIn) {
    console.log('[Login] 用户已登录，跳转到主页面');
    router.push('/main');
  } else {
    console.log('[Login] 用户未登录，显示登录页面');
  }

  console.log('[Login] onMounted 执行完成');
});
</script>

<style scoped>
/* 登录内容区域 */
.login-content {
  flex: 1;
  padding: 30px 50px;
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
  z-index: 1;
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
}

.form-input:focus {
  outline: none;
  border-color: #64ffda;
  box-shadow: 0 0 0 3px rgba(100, 255, 218, 0.1);
}

.form-input::placeholder {
  color: #8892b0;
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
