<template>
  <div class="main-page-wrapper">
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
          @click="handleFunctionClick(func.id)"
        >
          <span class="func-icon">{{ func.icon }}</span>
          <span class="func-label">{{ func.label }}</span>
        </div>
      </div>

      <!-- 侦测目标列表 -->
      <div :class="['detect-list-panel', { visible: showDetectList }]">
        <div class="list-header">
          <span class="list-title">侦测目标</span>
        </div>
        <div class="list-content">
          <div
            v-for="target in detectTargets"
            :key="target.id"
            :class="['target-card', { selected: selectedTargetId === target.id }]"
            @click="selectTarget(target)"
          >
            <!-- 第一列：目标信息区域（80%） -->
            <div class="target-info">
              <!-- 根据目标类型显示不同信息 -->
              <template v-if="target.type === 'signal'">
                <!-- 信号信息 -->
                <div class="info-row">
                  <span class="info-text">时间: {{ target.time }}</span>
                  <span class="info-text">信号强度: {{ target.signalStrength }}</span>
                </div>
                <div class="info-row">
                  <span class="info-text">频点: {{ target.frequency }}</span>
                </div>
              </template>
              <template v-else>
                <!-- 目标信息 -->
                <div class="info-row">
                  <span class="info-text">目标ID:{{ target.targetId }}</span>
                  <span class="info-text">机型:{{ target.model }}</span>
                </div>
                <div class="info-row">
                  <span class="info-text">高度:{{ target.altitude }}米</span>
                  <span class="info-text">水平速度:{{ target.horizontalSpeed }}米/秒</span>
                </div>
                <div class="info-row">
                  <span class="info-text">垂直速度:{{ target.verticalSpeed }}米/秒</span>
                </div>
              </template>
            </div>

            <!-- 第二列：操作按钮（20%） -->
            <div
              :class="['action-button', { active: target.buttonActive }]"
              @click.stop="toggleButton(target)"
            >
              <span class="btn-label">{{ target.buttonType === 'measure' ? '测向' : '定位' }}</span>
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

    <!-- 底部设备状态栏 - 居中显示，透明背景 -->
    <div class="bottom-bar">
      <div class="device-status-container">
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
    </div>

    <!-- 退出按钮 -->
    <button class="logout-btn" @click="handleLogout">
      <span>🚪</span>
      <span>退出登录</span>
    </button>
    </div>
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
const showDetectList = ref(true); // 侦测目标列表显示状态
const selectedTargetId = ref<string | null>(null);
const currentTime = ref('');

// 侦测目标数据（添加类型标识：signal=信号信息, target=目标信息）
const detectTargets = ref([
  {
    id: 1,
    type: 'signal' as 'signal' | 'target', // 目标类型：信号信息
    time: '10:01:59',
    signalStrength: 198,
    frequency: '805.4MHz',
    buttonType: 'measure' as 'measure' | 'locate', // 按钮类型：测向
    buttonActive: false // 默认灰色（未激活）
  },
  {
    id: 2,
    type: 'target' as 'signal' | 'target', // 目标类型：目标信息
    targetId: 'SN1001',
    model: '御4PRO',
    altitude: 18,
    horizontalSpeed: 18,
    verticalSpeed: 12,
    lat: 23.6557445,
    lng: 108.5668445,
    top: '30%',
    left: '70%',
    buttonType: 'locate' as 'measure' | 'locate', // 按钮类型：定位
    buttonActive: false // 默认灰色（未激活）
  },
  {
    id: 3,
    type: 'signal' as 'signal' | 'target', // 目标类型：信号信息
    time: '10:01:59',
    signalStrength: 198,
    frequency: '805.4MHz',
    buttonType: 'measure' as 'measure' | 'locate',
    buttonActive: false // 默认灰色（未激活）
  }
]);

const functions = [
  { id: 'detect', label: '侦测', icon: '📡' },
  { id: 'interfere', label: '干扰', icon: '📶' },
  { id: 'decoy', label: '诱骗', icon: '📍' }
];

// 设备工作状态（只显示，不可交互）
// 按照设计图：侦测和诱骗为绿色（激活），干扰为灰色（未激活）
const deviceStatus = ref({
  detect: { active: true },
  interfere: { active: false },
  decoy: { active: true }  // 改为激活状态
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

// 切换按钮激活状态
const toggleButton = (target: any) => {
  // 如果点击的是已激活的按钮，则取消激活
  if (target.buttonActive) {
    target.buttonActive = false;
  } else {
    // 先取消所有目标的激活状态
    detectTargets.value.forEach(t => {
      t.buttonActive = false;
    });
    // 激活当前目标的按钮
    target.buttonActive = true;
  }
};

// 切换侦测目标列表显示/隐藏
const toggleDetectList = () => {
  showDetectList.value = !showDetectList.value;
  console.log('[MainPage] 侦测列表显示状态切换:', showDetectList.value);
};

// 处理功能按钮点击
const handleFunctionClick = (funcId: string) => {
  currentMode.value = funcId;
  console.log('[MainPage] 功能按钮点击:', funcId);

  // 只有点击"侦测"按钮时才切换列表显示/隐藏
  if (funcId === 'detect') {
    toggleDetectList();
  }
};

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
/* 16:10 比例的页面包装器 */
.main-page-wrapper {
  width: 100vw;
  height: 100vh;
  background: #0f0f1a;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  overflow: hidden;
}

.main-container {
  aspect-ratio: 16 / 10;
  width: 100%;
  max-width: 800px;
  max-height: 500px; /* 适配800*480分辨率，留出一些padding */
  height: auto;
  background: rgba(15, 15, 26, 0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
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
  transform: translateX(0);
  transition: transform 0.3s ease;
}

.detect-list-panel:not(.visible) {
  transform: translateX(-100%);
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
  background: #bbdefb; /* 浅蓝色背景 */
}

/* 侦测目标卡片 - 纵向两列布局，8:2比例 */
.target-card {
  background: #1a5490; /* 深蓝色背景 */
  border-radius: 8px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 0;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
}

.target-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.target-card.selected {
  box-shadow: 0 0 16px rgba(79, 195, 247, 0.6);
}

/* 第一列：目标信息区域 - 占80% */
.target-info {
  flex: 8; /* 80% */
  background: #1a5490; /* 深蓝色背景 */
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-text {
  color: #ffffff; /* 白色文字 */
  font-size: 13px;
  font-weight: 400;
  letter-spacing: 0.5px;
}

/* 第二列：操作按钮 - 占20% */
.action-button {
  flex: 2; /* 20% */
  background: #bdbdbd; /* 默认灰色 */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  writing-mode: vertical-rl;
  text-orientation: upright;
}

.action-button:hover {
  filter: brightness(1.1);
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.3);
}

/* 激活状态 - 绿色 */
.action-button.active {
  background: #4caf50; /* 绿色 */
}

.action-button.active:hover {
  background: #43a047;
}

.btn-label {
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 4px;
  padding: 8px 0;
}

/* 地图区域 */
.map-area {
  flex: 1;
  background: #f5f0e6;
  position: relative;
  overflow: hidden;
  /* 移除 margin-left，让地图充满整个空间 */
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

/* 右下角目标信息面板 - 滑动效果，透明背景 */
.target-panel-bottom {
  position: fixed;
  right: 0;
  bottom: 80px;
  width: 350px;
  background: rgba(255, 255, 255, 0.95); /* 半透明白色背景 */
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
  background: #666666;
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
  background: rgba(240, 240, 240, 0.9); /* 半透明浅灰色背景 */
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid rgba(240, 240, 240, 0.5);
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
  padding: 0; /* 去掉padding */
  background: rgba(240, 240, 240, 0.9); /* 半透明浅灰色背景 */
  display: flex;
  justify-content: stretch; /* 填充对齐 */
}

.whitelist-btn {
  width: 100%; /* 通栏按钮 */
  padding: 12px 20px;
  background: #cccccc;
  border: none;
  border-radius: 0; /* 无圆角 */
  color: #333333;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.whitelist-btn:hover {
  background: #bbbbbb;
}

/* 底部设备状态栏 - 居中显示，透明背景 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: transparent; /* 透明背景 */
  display: flex;
  align-items: center;
  justify-content: center; /* 居中显示 */
  z-index: 50;
}

.device-status-container {
  background: transparent; /* 完全透明背景 */
  padding: 8px 30px;
  border-radius: 0; /* 去掉圆角 */
  border: none; /* 去掉边框 */
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
  color: #ffffff; /* 改为白色文字，在透明背景下更清晰 */
  font-size: 14px;
  font-weight: 500;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5); /* 添加文字阴影，提高可读性 */
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

/* 响应式设计 - 适配800*480分辨率 */
@media (max-width: 850px) {
  .detect-list-panel {
    width: 280px;
  }

  .target-panel-bottom {
    width: calc(100% - 40px);
    right: 20px;
    left: 20px;
  }

  .status-bar {
    padding: 8px 15px;
  }

  .device-name {
    font-size: 12px;
  }

  .status-item {
    font-size: 11px;
  }
}

@media (max-width: 600px) {
  .detect-list-panel {
    width: 240px;
  }

  .target-panel-bottom {
    width: calc(100% - 20px);
    right: 10px;
    left: 10px;
  }

  .status-bar {
    padding: 6px 10px;
    height: 40px;
  }

  .device-name {
    font-size: 11px;
  }

  .status-item {
    font-size: 10px;
  }
}
</style>
