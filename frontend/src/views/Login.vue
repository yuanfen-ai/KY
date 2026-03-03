<template>
  <div class="login-container">
    <!-- 设备背景模拟 -->
    <div class="device-frame">
      <!-- 顶部状态栏 -->
      <div class="status-bar">
        <div class="device-name">手持察打一体设备</div>
        <div class="status-items">
          <div class="status-item">
            <span class="icon">📶</span>
            <span>4G/5G</span>
          </div>
          <div class="status-item">
            <span class="time">{{ currentTime }}</span>
          </div>
          <div class="status-item">
            <span class="icon">🔋</span>
            <span>100%</span>
          </div>
        </div>
      </div>

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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const loginForm = ref({
  username: '',
  password: ''
});

const showPassword = ref(false);
const loading = ref(false);
const currentTime = ref('');

// 更新时间
const updateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  currentTime.value = `${year}.${month}.${day} ${hours}:${minutes}`;
};

let timeInterval: number;

const handleLogin = async () => {
  if (loading.value) return;

  loading.value = true;

  // 模拟登录验证
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 简单的验证逻辑（实际项目中应该调用后端API）
    if (loginForm.value.username && loginForm.value.password) {
      // 保存登录状态
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('username', loginForm.value.username);
      
      // 跳转到主页面
      router.push('/main');
    } else {
      alert('请输入用户名和密码');
    }
  } catch (error) {
    console.error('登录失败:', error);
    alert('登录失败，请重试');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  updateTime();
  timeInterval = window.setInterval(updateTime, 1000);

  // 检查是否已登录
  if (localStorage.getItem('isLoggedIn') === 'true') {
    router.push('/main');
  }
});

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval);
  }
});
</script>

<style scoped>
.login-container {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.device-frame {
  width: 100%;
  max-width: 480px;
  height: 100%;
  max-height: 800px;
  background: #0f0f1a;
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.status-bar {
  background: #1a1a2e;
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #2a2a3e;
}

.device-name {
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
}

.status-items {
  display: flex;
  gap: 16px;
  align-items: center;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #ffffff;
  font-size: 12px;
}

.status-item .icon {
  font-size: 14px;
}

.status-item .time {
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.login-content {
  flex: 1;
  padding: 40px 30px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow-y: auto;
}

.logo-area {
  text-align: center;
  margin-bottom: 40px;
}

.logo-icon {
  font-size: 64px;
  margin-bottom: 16px;
  animation: pulse 2s infinite;
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
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.system-subtitle {
  color: #8892b0;
  font-size: 14px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  color: #ccd6f6;
  font-size: 14px;
  font-weight: 500;
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
  padding: 14px 14px 14px 44px;
  background: #1a1a2e;
  border: 2px solid #2a2a3e;
  border-radius: 8px;
  color: #ffffff;
  font-size: 16px;
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
  background: none;
  border: none;
  color: #8892b0;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  transition: color 0.3s;
}

.toggle-password:hover {
  color: #64ffda;
}

.login-button {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #64ffda 0%, #48c6a9 100%);
  border: none;
  border-radius: 8px;
  color: #1a1a2e;
  font-size: 16px;
  font-weight: 700;
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
  text-align: center;
  margin-top: 20px;
}

.device-info,
.version-info {
  color: #8892b0;
  font-size: 12px;
  margin: 4px 0;
}

/* 响应式设计 */
@media (max-width: 600px) {
  .device-frame {
    max-width: 100%;
    max-height: 100%;
    border-radius: 0;
  }
}
</style>
