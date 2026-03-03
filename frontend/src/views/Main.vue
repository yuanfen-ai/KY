<template>
  <div class="main-container">
    <!-- 顶部状态栏 -->
    <div class="status-bar">
      <div class="device-name">手持式察打一体枪</div>
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

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 左侧功能导航栏 -->
      <div class="left-sidebar">
        <button
          v-for="func in functions"
          :key="func.id"
          :class="['function-btn', { active: currentMode === func.id }]"
          @click="switchMode(func.id)"
        >
          <span class="func-icon">{{ func.icon }}</span>
          <span class="func-label">{{ func.label }}</span>
        </button>
      </div>

      <!-- 中心地图操作区 -->
      <div class="map-area">
        <div class="map-container" ref="mapContainer">
          <!-- 模拟地图背景 -->
          <div class="map-background">
            <!-- 建筑物和地标 -->
            <div class="landmark" style="top: 20%; left: 30%;">
              <div class="landmark-icon">🏢</div>
              <div class="landmark-text">南门</div>
            </div>
            <div class="landmark" style="top: 60%; left: 20%;">
              <div class="landmark-icon">🅿️</div>
              <div class="landmark-text">停车场</div>
            </div>
            <div class="landmark" style="top: 40%; left: 70%;">
              <div class="landmark-icon">📍</div>
              <div class="landmark-text">路正通用航空</div>
            </div>

            <!-- 道路线条 -->
            <div class="road road-1"></div>
            <div class="road road-2"></div>
            <div class="road road-3"></div>

            <!-- 目标无人机 -->
            <div
              class="drone-target"
              :style="{ top: '50%', left: '50%' }"
              @click="showTargetInfo = true"
            >
              <div class="target-circle"></div>
              <div class="drone-icon">🛸</div>
              <div class="click-hint">点击目标</div>
              <div class="arrow-hint">→</div>
            </div>

            <!-- 地图控制按钮 -->
            <div class="map-controls">
              <button class="control-btn" title="无人机总览">✈️</button>
              <button class="control-btn" title="地图设置">⚙️</button>
              <button class="control-btn" title="搜索">🔍</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部功能状态栏 -->
    <div class="bottom-bar">
      <div
        v-for="func in functions"
        :key="func.id"
        :class="['mode-item', { active: currentMode === func.id }]"
        @click="switchMode(func.id)"
      >
        <span class="mode-label">{{ func.label }}</span>
        <div :class="['status-dot', currentMode === func.id ? 'active' : 'inactive']"></div>
      </div>
    </div>

    <!-- 目标信息面板 -->
    <div v-if="showTargetInfo" class="target-panel">
      <div class="panel-header">
        <span class="panel-title">目标信息</span>
        <button class="close-btn" @click="showTargetInfo = false">✕</button>
      </div>
      <div class="panel-content">
        <div class="info-row">
          <span class="info-label">目标ID:</span>
          <span class="info-value">SN100601</span>
        </div>
        <div class="info-row">
          <span class="info-label">机型:</span>
          <span class="info-value">DJ御3pro</span>
        </div>
        <div class="info-row">
          <span class="info-label">经纬度:</span>
          <span class="info-value">23.6557444; 108.5668444</span>
        </div>
        <div class="info-row">
          <span class="info-label">高度:</span>
          <span class="info-value">45米</span>
        </div>
        <div class="info-row">
          <span class="info-label">水平速度:</span>
          <span class="info-value">20米/秒</span>
        </div>
        <div class="info-row">
          <span class="info-label">垂直速度:</span>
          <span class="info-value">5米/秒</span>
        </div>
      </div>
      <div class="panel-footer">
        <button class="whitelist-btn">+ 加入白名单</button>
      </div>
    </div>

    <!-- 退出按钮 -->
    <button class="logout-btn" @click="handleLogout">
      <span>🚪</span>
      <span>退出登录</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const currentMode = ref('detect');
const showTargetInfo = ref(false);
const currentTime = ref('');

const functions = [
  { id: 'detect', label: '侦测', icon: '📡' },
  { id: 'interfere', label: '干扰', icon: '📶' },
  { id: 'decoy', label: '诱骗', icon: '📍' }
];

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

const switchMode = (mode: string) => {
  currentMode.value = mode;
  console.log('切换到模式:', mode);
};

const handleLogout = () => {
  if (confirm('确定要退出登录吗？')) {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    router.push('/login');
  }
};

onMounted(() => {
  updateTime();
  timeInterval = window.setInterval(updateTime, 1000);

  // 检查登录状态
  if (localStorage.getItem('isLoggedIn') !== 'true') {
    router.push('/login');
  }
});

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval);
  }
});
</script>

<style scoped>
.main-container {
  width: 100vw;
  height: 100vh;
  background: #1a1a2e;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  overflow: hidden;
}

/* 顶部状态栏 */
.status-bar {
  background: #0f0f1a;
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #2a2a3e;
  height: 50px;
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

/* 主内容区 */
.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 左侧功能导航栏 */
.left-sidebar {
  width: 80px;
  background: #0f0f1a;
  border-right: 1px solid #2a2a3e;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
  gap: 20px;
}

.function-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #1a1a2e;
  border: 2px solid #2a2a3e;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.function-btn:hover {
  border-color: #64ffda;
  transform: scale(1.05);
}

.function-btn.active {
  border-color: #64ffda;
  background: rgba(100, 255, 218, 0.1);
  box-shadow: 0 0 15px rgba(100, 255, 218, 0.3);
}

.func-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.func-label {
  color: #ffffff;
  font-size: 12px;
}

/* 地图区域 */
.map-area {
  flex: 1;
  background: #f5f0e6;
  position: relative;
  overflow: hidden;
}

.map-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.map-background {
  width: 100%;
  height: 100%;
  position: relative;
  background: linear-gradient(135deg, #f5f0e6 0%, #e8e0d0 100%);
}

/* 地标 */
.landmark {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translate(-50%, -50%);
}

.landmark-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.landmark-text {
  background: #ffffff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  white-space: nowrap;
}

/* 道路 */
.road {
  position: absolute;
  background: #d4c8b8;
}

.road-1 {
  width: 8px;
  height: 60%;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
}

.road-2 {
  width: 50%;
  height: 8px;
  top: 50%;
  left: 25%;
  transform: translateY(-50%);
}

.road-3 {
  width: 6px;
  height: 40%;
  top: 40%;
  left: 60%;
  transform: rotate(45deg);
}

/* 目标无人机 */
.drone-target {
  position: absolute;
  transform: translate(-50%, -50%);
  cursor: pointer;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translate(-50%, -50%);
  }
  50% {
    transform: translate(-50%, -60%);
  }
}

.target-circle {
  position: absolute;
  width: 200px;
  height: 200px;
  border: 3px dashed #e91e63;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.6;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.05);
  }
}

.drone-icon {
  font-size: 48px;
  position: relative;
  z-index: 1;
}

.click-hint {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: #e91e63;
  color: #ffffff;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  z-index: 2;
}

.arrow-hint {
  position: absolute;
  top: 50%;
  left: 30px;
  color: #e91e63;
  font-size: 32px;
  font-weight: bold;
  transform: translateY(-50%);
  animation: pointRight 1s ease-in-out infinite;
}

@keyframes pointRight {
  0%, 100% {
    transform: translateY(-50%) translateX(0);
  }
  50% {
    transform: translateY(-50%) translateX(10px);
  }
}

/* 地图控制按钮 */
.map-controls {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.control-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #ffffff;
  border: 2px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.control-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 底部状态栏 */
.bottom-bar {
  height: 60px;
  background: #0f0f1a;
  border-top: 1px solid #2a2a3e;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 20px;
}

.mode-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 20px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.mode-item:hover {
  background: rgba(100, 255, 218, 0.05);
}

.mode-label {
  color: #ffffff;
  font-size: 14px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid #ffffff;
}

.status-dot.active {
  background: #4caf50;
  border-color: #4caf50;
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
}

.status-dot.inactive {
  border-color: #8892b0;
}

/* 目标信息面板 */
.target-panel {
  position: fixed;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 320px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  z-index: 100;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-50%) translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateY(-50%) translateX(0);
  }
}

.panel-header {
  background: #1a1a2e;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 12px 12px 0 0;
}

.panel-title {
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: #e91e63;
  font-size: 24px;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
  transition: all 0.3s ease;
}

.close-btn:hover {
  color: #c2185b;
  transform: scale(1.1);
}

.panel-content {
  padding: 20px 16px;
  border-bottom: 1px solid #e0e0e0;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  color: #666666;
  font-size: 14px;
}

.info-value {
  color: #333333;
  font-size: 14px;
  font-weight: 500;
}

.panel-footer {
  padding: 16px;
  display: flex;
  justify-content: center;
}

.whitelist-btn {
  padding: 12px 24px;
  background: #e0e0e0;
  border: none;
  border-radius: 8px;
  color: #333333;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.whitelist-btn:hover {
  background: #d0d0d0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 退出按钮 */
.logout-btn {
  position: fixed;
  bottom: 80px;
  right: 20px;
  padding: 12px 20px;
  background: #e91e63;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(233, 30, 99, 0.3);
  transition: all 0.3s ease;
  z-index: 50;
}

.logout-btn:hover {
  background: #c2185b;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(233, 30, 99, 0.4);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .target-panel {
    width: calc(100% - 40px);
    right: 20px;
    left: 20px;
  }
}
</style>
