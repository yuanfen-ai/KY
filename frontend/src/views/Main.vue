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

      <!-- 侦测列表侧滑面板 -->
      <div :class="['detect-list-panel', { visible: showDetectList }]">
        <div class="list-header">
          <span class="list-title">侦测目标</span>
          <button class="measure-btn" @click="toggleMeasureAll">
            {{ allMeasuring ? '取消测向' : '测向' }}
          </button>
        </div>
        <div class="list-content">
          <div
            v-for="target in detectTargets"
            :key="target.id"
            :class="['target-item', { selected: selectedTargetId === target.id }]"
            @click="selectTarget(target)"
          >
            <div class="target-basic-info">
              <span class="info-item">{{ target.time }}</span>
              <span class="info-item">{{ target.signalStrength }}</span>
              <span class="info-item">{{ target.frequency }}</span>
            </div>
            <div class="target-detail-info">
              <span>目标ID: {{ target.targetId }}</span>
              <span>机型: {{ target.model }}</span>
              <span>高度: {{ target.altitude }}米</span>
              <span>水平速度: {{ target.horizontalSpeed }}米/秒</span>
              <span>垂直速度: {{ target.verticalSpeed }}米/秒</span>
            </div>
            <button
              :class="['action-btn', { active: target.measuring }]"
              @click.stop="toggleMeasure(target)"
            >
              {{ target.measuring ? '取消' : '测向' }}
            </button>
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

            <!-- 测向雷达扫描效果 -->
            <div v-if="measuringTargets.length > 0" class="radar-scan">
              <div
                v-for="(mt, index) in measuringTargets"
                :key="mt.id"
                :class="['scan-line', `scan-line-${index}`]"
                :style="{
                  transform: `rotate(${(index * 120)}deg)`,
                }"
              ></div>
            </div>

            <!-- 目标无人机 -->
            <div
              v-for="target in detectTargets"
              :key="target.id"
              :class="['drone-target', { selected: selectedTargetId === target.id, measuring: target.measuring }]"
              :style="{ top: target.top, left: target.left }"
              @click="handleTargetClick(target)"
            >
              <div class="target-circle"></div>
              <div class="drone-icon">✈️</div>
              <div v-if="target.measuring" class="direction-line"></div>
            </div>

            <!-- 地图控制按钮 -->
            <div class="map-controls">
              <button class="control-btn" title="无人机总览">✈️</button>
              <button class="control-btn" title="地图设置">⚙️</button>
              <button class="control-btn" title="搜索">🔍</button>
            </div>

            <!-- 图例 -->
            <div class="map-legend">
              <div class="legend-item">
                <div class="legend-dot detect"></div>
                <span>侦测</span>
              </div>
              <div class="legend-item">
                <div class="legend-dot interfere"></div>
                <span>干扰</span>
              </div>
              <div class="legend-item">
                <div class="legend-dot decoy"></div>
                <span>诱骗</span>
              </div>
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

    <!-- 右下角目标信息面板 -->
    <div v-if="showTargetInfo" class="target-panel-bottom">
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const currentMode = ref('detect');
const showDetectList = ref(false);
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
    left: '60%',
    measuring: false
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
    left: '70%',
    measuring: false
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
    left: '45%',
    measuring: false
  }
]);

const functions = [
  { id: 'detect', label: '侦测', icon: '📡' },
  { id: 'interfere', label: '干扰', icon: '📶' },
  { id: 'decoy', label: '诱骗', icon: '📍' }
];

// 计算属性：正在测向的目标
const measuringTargets = computed(() => {
  return detectTargets.value.filter(t => t.measuring);
});

// 计算属性：是否全部测向
const allMeasuring = computed(() => {
  return detectTargets.value.every(t => t.measuring);
});

// 计算属性：当前选中目标信息
const currentTargetInfo = computed(() => {
  const target = detectTargets.value.find(t => t.id === selectedTargetId.value);
  return target || {
    targetId: 'SN100601',
    model: 'D.御3pro',
    lat: '23.6557444',
    lng: '108.5668444',
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

// 切换模式
const switchMode = (mode: string) => {
  currentMode.value = mode;

  // 如果切换到侦测模式，显示/隐藏列表
  if (mode === 'detect') {
    showDetectList.value = !showDetectList.value;
  } else {
    // 切换到其他模式，隐藏列表
    showDetectList.value = false;
  }

  console.log('切换到模式:', mode);
};

// 切换单个目标的测向状态
const toggleMeasure = (target: any) => {
  target.measuring = !target.measuring;
};

// 切换所有目标的测向状态
const toggleMeasureAll = () => {
  const newState = !allMeasuring.value;
  detectTargets.value.forEach(target => {
    target.measuring = newState;
  });
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

/* 侦测列表侧滑面板 */
.detect-list-panel {
  position: absolute;
  left: 80px;
  top: 0;
  width: 320px;
  height: 100%;
  background: #0f0f1a;
  border-right: 1px solid #2a2a3e;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  z-index: 5;
  display: flex;
  flex-direction: column;
}

.detect-list-panel.visible {
  transform: translateX(0);
}

.list-header {
  background: #1a1a2e;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #2a2a3e;
}

.list-title {
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
}

.measure-btn {
  background: #4caf50;
  color: #ffffff;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.measure-btn:hover {
  background: #45a049;
}

.list-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.target-item {
  background: #1a1a2e;
  border: 1px solid #2a2a3e;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.target-item:hover {
  border-color: #64ffda;
  background: rgba(100, 255, 218, 0.05);
}

.target-item.selected {
  border-color: #64ffda;
  background: rgba(100, 255, 218, 0.1);
}

.target-basic-info {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}

.info-item {
  color: #8892b0;
  font-size: 12px;
}

.target-detail-info {
  background: #2a2a4e;
  padding: 8px;
  border-radius: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 11px;
  color: #8892b0;
}

.action-btn {
  background: #2a2a3e;
  color: #ffffff;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  align-self: flex-end;
}

.action-btn:hover {
  background: #3a3a4e;
}

.action-btn.active {
  background: #4caf50;
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

/* 测向雷达扫描效果 */
.radar-scan {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 3;
  pointer-events: none;
}

.scan-line {
  position: absolute;
  width: 300px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #4caf50, transparent);
  transform-origin: left center;
  animation: scan 2s ease-in-out infinite;
}

.scan-line-0 {
  animation-delay: 0s;
}

.scan-line-1 {
  animation-delay: 0.67s;
}

.scan-line-2 {
  animation-delay: 1.34s;
}

@keyframes scan {
  0%, 100% {
    opacity: 0;
  }
  50% {
    opacity: 1;
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

.drone-target.measuring .drone-icon {
  color: #4caf50;
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
  border-color: #64ffda;
  border-width: 3px;
}

.drone-target.measuring .target-circle {
  border-color: #4caf50;
  border-style: solid;
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

.direction-line {
  position: absolute;
  width: 150px;
  height: 2px;
  background: linear-gradient(90deg, #4caf50, transparent);
  top: 50%;
  left: 50%;
  transform-origin: left center;
  animation: directionPulse 1.5s ease-in-out infinite;
}

@keyframes directionPulse {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
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

/* 图例 */
.map-legend {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.9);
  padding: 12px;
  border-radius: 8px;
  display: flex;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #333;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-dot.detect {
  background: #4caf50;
}

.legend-dot.interfere {
  background: #9e9e9e;
}

.legend-dot.decoy {
  background: #4caf50;
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

/* 右下角目标信息面板 */
.target-panel-bottom {
  position: fixed;
  right: 20px;
  bottom: 80px;
  width: 320px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  z-index: 100;
  animation: slideInBottom 0.3s ease-out;
}

@keyframes slideInBottom {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
