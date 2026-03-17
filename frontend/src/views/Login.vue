<template>
  <div class="login-container">
    <!-- 设备背景模拟 - 16:9比例 -->
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
const currentTime = ref('');

console.log('[Login] 响应式数据初始化完成');

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

    // 验证用户名和密码
    if (loginForm.value.username === DEFAULT_USERNAME && loginForm.value.password === DEFAULT_PASSWORD) {
      // 保存登录状态
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('username', loginForm.value.username);

      // 跳转到主页面
      router.push('/main');
    } else {
      alert('用户名或密码错误！');
    }
  } catch (error) {
    console.error('登录失败:', error);
    alert('登录失败，请重试');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  console.log('[Login] onMounted 开始执行');

  updateTime();
  timeInterval = window.setInterval(updateTime, 1000);

  // 检查是否已登录
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
  /* 透明背景 */
  background: transparent;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  /* 16:9 比例容器 */
  position: relative;
  overflow: hidden; /* 防止出现滚动条 */
}

/* 16:10 比例的设备框架 */
.device-frame {
  /* 16:10 比例 */
  aspect-ratio: 16 / 10;
  width: 100%;
  max-width: 800px;
  max-height: 550px; /* 增加高度以容纳所有内容 */
  height: auto; /* 改为 auto，让 aspect-ratio 控制高度 */
  /* 半透明背景，带模糊效果 */
  background: rgba(15, 15, 26, 0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.status-bar {
  background: rgba(3, 22, 50, 0.8);
  height: 24px;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(42, 42, 62, 0.5);
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
  padding: 30px 50px 30px 50px; /* 减少上下padding */
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden; /* 改为 hidden，移除滚动条 */
}

.logo-area {
  text-align: center;
  margin-top: 5px;
  margin-bottom: 12px;
  line-height: 1.1;
}

.logo-icon {
  font-size: 56px; /* 减小logo图标大小 */
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
  font-size: 26px; /* 减小标题大小 */
  font-weight: 700;
  margin-bottom: 3px;
  line-height: 1.1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.system-subtitle {
  color: #8892b0;
  font-size: 15px; /* 减小副标题大小 */
  line-height: 1.1;
  margin-bottom: 12px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 12px; /* 减少表单元素间距 */
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px; /* 减少标签和输入框的间距 */
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
  padding: 10px 14px 10px 44px; /* 减少输入框的padding */
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
  padding: 10px; /* 减少登录按钮的padding */
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

/* 响应式设计 - 适配800*480分辨率 */
@media (max-width: 850px) {
  .device-frame {
    max-width: 100%;
    max-height: none;
    aspect-ratio: auto;
    height: auto;
    min-height: 480px;
  }

  .login-content {
    padding: 30px 30px 25px 30px;
  }

  .logo-icon {
    font-size: 48px;
  }

  .system-title {
    font-size: 24px;
  }

  .system-subtitle {
    font-size: 14px;
  }
}

@media (max-width: 600px) {
  .login-container {
    align-items: flex-start;
    padding-top: 10px;
  }

  .login-content {
    padding: 25px 20px 20px 20px;
  }

  .logo-icon {
    font-size: 40px;
  }

  .system-title {
    font-size: 20px;
  }

  .system-subtitle {
    font-size: 13px;
  }
}
</style>
