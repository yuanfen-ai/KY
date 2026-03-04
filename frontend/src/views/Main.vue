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
        <div
          v-for="func in functions"
          :key="func.id"
          :class="['function-btn', { active: currentMode === func.id }]"
        >
          <span class="func-icon">{{ func.icon }}</span>
          <span class="func-label">{{ func.label }}</span>
        </div>
      </div>

      <!-- 侦测目标列表 -->
      <div class="detect-list-panel">
        <div class="list-header">
          <span class="list-title">侦测目标</span>
        </div>
        <div class="list-content">
          <div
            v-for="target in detectTargets"
            :key="target.id"
            :class="['target-item', { selected: selectedTargetId === target.id }]"
            @click="selectTarget(target)"
          >
            <div class="target-info">
              <!-- 上半组：实时侦测参数 -->
              <div class="target-param-row">
                <span class="param-label">时间:</span>
                <span class="param-value">{{ target.time }}</span>
                <span class="param-label" style="margin-left: 15px;">信号强度:</span>
                <span class="param-value">{{ target.signalStrength }}</span>
              </div>
              <div class="target-param-row">
                <span class="param-label">频点:</span>
                <span class="param-value">{{ target.frequency }}</span>
              </div>
              <!-- 下半组：无人机目标属性 -->
              <div class="target-detail-row">
                <span class="param-label">目标ID:</span>
                <span class="param-value">{{ target.targetId }}</span>
                <span class="param-label" style="margin-left: 10px;">机型:</span>
                <span class="param-value">{{ target.model }}</span>
              </div>
              <div class="target-detail-row">
                <span class="param-label">高度:</span>
                <span class="param-value">{{ target.altitude }}米</span>
                <span class="param-label" style="margin-left: 10px;">水平速度:</span>
                <span class="param-value">{{ target.horizontalSpeed }}米/秒</span>
              </div>
              <div class="target-detail-row">
                <span class="param-label">垂直速度:</span>
                <span class="param-value">{{ target.verticalSpeed }}米/秒</span>
              </div>
            </div>
            <div class="action-buttons">
              <button class="measure-btn green">
                测向
              </button>
              <button class="measure-btn blue">
                定位
              </button>
            </div>
          </div>
        </div>
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

            <!-- 中心雷达 -->
            <div class="radar-center">
              <div class="radar-icon">🛡️</div>
              <div class="radar-circle"></div>
            </div>

            <!-- 目标无人机 -->
            <div
              v-for="target in detectTargets"
              :key="target.id"
              :class="['drone-target', { selected: selectedTargetId === target.id }]"
              :style="{ top: target.top, left: target.left }"
              @click="handleTargetClick(target)"
            >
              <div class="target-circle"></div>
              <div class="drone-icon">✈️</div>
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

      <!-- 右下角目标信息面板 - 滑动效果 -->
      <div :class="['target-panel-bottom', { visible: showTargetInfo }]">
        <div class="panel-header">
          <span class="panel-title">目标信息</span>
          <button class="close-btn" @click="closeTargetPanel">×</button>
        </div>
        <div class="panel-content">
          <div class="info-row">
            <span class="info-label">目标ID:</span>
            <span class="info-value">{{ currentTargetInfo.targetId }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">机型:</span>
            <span class="info-value">{{ currentTargetInfo.model }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">经纬度:</span>
            <span class="info-value">{{ currentTargetInfo.lat }}; {{ currentTargetInfo.lng }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">高度:</span>
            <span class="info-value">{{ currentTargetInfo.altitude }}米</span>
          </div>
          <div class="info-row">
            <span class="info-label">水平速度:</span>
            <span class="info-value">{{ currentTargetInfo.horizontalSpeed }}米/秒</span>
          </div>
          <div class="info-row">
            <span class="info-label">垂直速度:</span>
            <span class="info-value">{{ currentTargetInfo.verticalSpeed }}米/秒</span>
          </div>
        </div>
        <div class="panel-footer">
          <button class="whitelist-btn">+加入白名单</button>
        </div>
      </div>
    </div>

    <!-- 底部设备状态栏 -->
    <div class="bottom-bar">
      <div class="status-warning">
        这里显示的是设备工作状态, 不可点击交互操作
      </div>
      <div class="device-status-items">
        <div class="device-status-item">
          <div :class="['status-indicator', deviceStatus.detect.active ? 'active' : 'inactive']"></div>
          <span class="status-label">侦测</span>
        </div>
        <div class="device-status-item">
          <div :class="['status-indicator', deviceStatus.interfere.active ? 'active' : 'inactive']"></div>
          <span class="status-label">干扰</span>
        </div>
        <div class="device-status-item">
          <div :class="['status-indicator', deviceStatus.decoy.active ? 'active' : 'inactive']"></div>
          <span class="status-label">诱骗</span>
        </div>
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';

// 添加调试日志
console.log('[MainPage] 组件开始加载...');

const router = useRouter();

console.log('[MainPage] router实例:', !!router);

const currentMode = ref('detect');
const showTargetInfo = ref(false);
const selectedTargetId = ref<string | null>(null);
const currentTime = ref('');

// 侦测目标数据
const detectTargets = ref([
  {
    id: 1,
    time: '10:01:59',
    signalStrength: 198,
    frequency: '805.4MHz',
    targetId: 'SN1001',
    model: '御4PRO',
    altitude: 18,
    horizontalSpeed: 18,
    verticalSpeed: 12,
    lat: 23.6557444,
    lng: 108.5668444,
    top: '40%',
    left: '60%'
  },
  {
    id: 2,
    time: '10:01:59',
    signalStrength: 198,
    frequency: '805.4MHz',
    targetId: 'SN1001',
    model: '御4PRO',
    altitude: 18,
    horizontalSpeed: 18,
    verticalSpeed: 12,
    lat: 23.6557445,
    lng: 108.5668445,
    top: '30%',
    left: '70%'
  },
  {
    id: 3,
    time: '10:01:59',
    signalStrength: 198,
    frequency: '805.4MHz',
    targetId: 'SN1002',
    model: '御4C',
    altitude: 18,
    horizontalSpeed: 18,
    verticalSpeed: 12,
    lat: 23.6557446,
    lng: 108.5668446,
    top: '55%',
    left: '45%'
  }
]);

const functions = [
  { id: 'detect', label: '侦测', icon: '📡' },
  { id: 'interfere', label: '干扰', icon: '📶' },
  { id: 'decoy', label: '诱骗', icon: '📍' }
];

// 设备工作状态（只显示，不可交互）
const deviceStatus = ref({
  detect: { active: true },
  interfere: { active: false },
  decoy: { active: false }
});

// 计算属性：当前选中目标信息
const currentTargetInfo = computed(() => {
  const target = detectTargets.value.find(t => t.id === selectedTargetId.value);
  return target || {
    targetId: 'SN100501',
    model: 'D.御3pro',
    lat: '23.6557444',
    lng: '108.5686344',
    altitude: 45,
    horizontalSpeed: 20,
    verticalSpeed: 5
  };
});

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

// 选中目标
const selectTarget = (target: any) => {
  selectedTargetId.value = target.id;
};

// 点击地图上的无人机目标
const handleTargetClick = (target: any) => {
  if (selectedTargetId.value === target.id && showTargetInfo.value) {
    // 如果点击的是同一个目标且信息框已显示，则隐藏信息框
    showTargetInfo.value = false;
  } else {
    // 否则选中目标并显示信息框
    selectedTargetId.value = target.id;
    showTargetInfo.value = true;
  }
};

// 关闭目标信息面板
const closeTargetPanel = () => {
  showTargetInfo.value = false;
};

const handleLogout = () => {
  if (confirm('确定要退出登录吗？')) {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    router.push('/login');
  }
};

onMounted(() => {
  console.log('[MainPage] onMounted 开始执行');

  updateTime();
  timeInterval = window.setInterval(updateTime, 1000);

  // 检查登录状态
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  console.log('[MainPage] 登录状态检查:', isLoggedIn);

  if (!isLoggedIn) {
    console.log('[MainPage] 用户未登录，跳转到登录页');
    router.push('/login');
  } else {
    console.log('[MainPage] 用户已登录，显示主页面');
  }

  console.log('[MainPage] onMounted 执行完成');
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
  position: relative;
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
  z-index: 10;
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
  border-color: #4fc3f7;
  background: rgba(79, 195, 247, 0.15);
}

.func-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.func-label {
  color: #ffffff;
  font-size: 12px;
}

/* 侦测目标列表 */
.detect-list-panel {
  position: absolute;
  left: 80px;
  top: 0;
  width: 320px;
  height: 100%;
  background: #ffffff;
  border-right: 1px solid #e0e0e0;
  z-index: 5;
  display: flex;
  flex-direction: column;
}

.list-header {
  background: #e6f0f7;
  padding: 12px 16px;
  border-bottom: 1px solid #d0dce8;
}

.list-title {
  color: #1a5490;
  font-size: 14px;
  font-weight: 600;
}

.list-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: #f8f8f8;
}

.target-item {
  background: #f0f0f0;
  border: 1px solid #808080;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.target-item:hover {
  background: #e0e0e0;
}

.target-item.selected {
  background: #1a5490;
  border-color: #1a5490;
}

.target-item.selected .param-label,
.target-item.selected .param-value {
  color: #ffffff;
}

.target-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.target-param-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.target-detail-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.param-label {
  color: #808080;
  font-size: 12px;
  font-weight: 500;
}

.param-value {
  color: #000000;
  font-size: 12px;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.measure-btn {
  color: #ffffff;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  min-width: 50px;
}

.measure-btn.green {
  background: #4caf50;
}

.measure-btn.green:hover {
  background: #388e3c;
}

.measure-btn.blue {
  background: #1565c0;
}

.measure-btn.blue:hover {
  background: #0d47a1;
}

/* 地图区域 */
.map-area {
  flex: 1;
  background: #f5f0e6;
  position: relative;
  overflow: hidden;
  margin-left: 320px;
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

/* 中心雷达 */
.radar-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
}

.radar-icon {
  font-size: 48px;
  position: relative;
  z-index: 2;
}

.radar-circle {
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

/* 目标无人机 */
.drone-target {
  position: absolute;
  transform: translate(-50%, -50%);
  cursor: pointer;
  animation: float 3s ease-in-out infinite;
}

.drone-target.selected {
  animation: none;
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
  width: 100px;
  height: 100px;
  border: 2px dashed #e91e63;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: targetPulse 2s ease-in-out infinite;
}

.drone-target.selected .target-circle {
  border-color: #4fc3f7;
  border-width: 3px;
}

@keyframes targetPulse {
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
  font-size: 32px;
  position: relative;
  z-index: 1;
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

/* 右下角目标信息面板 - 滑动效果 */
.target-panel-bottom {
  position: fixed;
  right: 0;
  bottom: 80px;
  width: 350px;
  background: #ffffff;
  border: 2px solid #666666;
  border-right: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 100;
  transform: translateX(100%);
  transition: transform 0.3s ease-in-out;
  overflow: hidden;
}

.target-panel-bottom.visible {
  transform: translateX(0);
}

.panel-header {
  background: #1a5490;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-title {
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
}

.close-btn {
  background: #ff4444;
  border: none;
  color: #ffffff;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.close-btn:hover {
  background: #cc0000;
}

.panel-content {
  padding: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  color: #808080;
  font-size: 13px;
  font-weight: 500;
}

.info-value {
  color: #000000;
  font-size: 13px;
  font-weight: 600;
}

.panel-footer {
  padding: 12px 16px;
  background: #f0f0f0;
  display: flex;
  justify-content: center;
}

.whitelist-btn {
  padding: 10px 20px;
  background: #81d4fa;
  border: none;
  border-radius: 6px;
  color: #000000;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.whitelist-btn:hover {
  background: #4fc3f7;
}

/* 底部设备状态栏 */
.bottom-bar {
  height: 60px;
  background: #e0e0e0;
  border-top: 2px solid #cccccc;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.status-warning {
  color: #ff0000;
  font-size: 12px;
  font-weight: 600;
}

.device-status-items {
  display: flex;
  gap: 40px;
}

.device-status-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #999999;
}

.status-indicator.active {
  background: #4caf50;
  border-color: #4caf50;
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.6);
}

.status-indicator.inactive {
  background: #cccccc;
  border-color: #999999;
}

.status-label {
  color: #333333;
  font-size: 14px;
  font-weight: 500;
}

/* 退出按钮 */
.logout-btn {
  position: fixed;
  bottom: 20px;
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
  .detect-list-panel {
    width: 280px;
  }

  .target-panel-bottom {
    width: calc(100% - 40px);
    right: 20px;
    left: 20px;
  }
}
</style>
