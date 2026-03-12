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

        <!-- 过滤按钮 -->
        <div class="filter-buttons">
          <button
            :class="['filter-btn', { active: filterType === 'signal' }]"
            @click="filterType = 'signal'"
          >
            侦测目标
          </button>
          <button
            :class="['filter-btn', { active: filterType === 'target' }]"
            @click="filterType = 'target'"
          >
            定位目标
          </button>
        </div>

        <div class="list-content">
          <div
            v-for="target in filteredDetectTargets"
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
      <div class="map-area" @click="handleMapClick">
        <div class="map-container" ref="mapContainer">
          <!-- 信号强度进度条 - 显示在顶部中间 -->
          <div :class="['signal-progress-container', { visible: showSignalProgress }]">
            <div class="signal-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <!-- 信号源中心点 -->
                <circle cx="12" cy="18" r="2" fill="#2196F3"/>

                <!-- 第一层信号弧 - 小 -->
                <path d="M8 14 Q12 8 16 14" stroke="#2196F3" stroke-width="1.5" fill="none" stroke-linecap="round"/>

                <!-- 第二层信号弧 - 中 -->
                <path d="M5 10 Q12 2 19 10" stroke="#2196F3" stroke-width="1.5" fill="none" stroke-linecap="round"/>

                <!-- 第三层信号弧 - 大 -->
                <path d="M3 7 Q12 -2 21 7" stroke="#2196F3" stroke-width="1.5" fill="none" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="progress-bar-wrapper">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: signalProgressPercent + '%' }"></div>
              </div>
              <div class="signal-value">{{ signalValue }}</div>
            </div>
          </div>

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
              @click.stop="handleTargetClick(target)"
            >
              <div class="target-circle"></div>
              <div class="drone-icon">✈️</div>
            </div>

            <!-- 地图控制按钮 -->
            <div class="map-controls">
              <button class="control-btn" title="无人机总览" @click.stop>✈️</button>
              <button class="control-btn" title="地图设置" @click.stop>⚙️</button>
              <button class="control-btn" title="搜索" @click.stop>🔍</button>
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

      <!-- 右下角干扰模式悬浮框 - 滑动效果 -->
      <div :class="['target-panel-bottom', 'interference-panel', { visible: showInterferencePanel }]">
        <div class="panel-header">
          <span class="panel-title">干扰模式</span>
        </div>
        <div class="panel-scroll-wrapper">
          <div class="panel-content">
            <div class="panel-section">
              <div class="section-title">频段选择</div>
              <div class="frequency-list">
                <label class="frequency-item">
                  <input type="checkbox" value="805-850" />
                  <span class="frequency-label">805~850 MHz</span>
                </label>
                <label class="frequency-item">
                  <input type="checkbox" value="850-928" />
                  <span class="frequency-label">850~928 MHz</span>
                </label>
                <label class="frequency-item">
                  <input type="checkbox" value="928-960" />
                  <span class="frequency-label">928~960 MHz</span>
                </label>
                <label class="frequency-item">
                  <input type="checkbox" value="2400-2483" />
                  <span class="frequency-label">2400~2483 MHz</span>
                </label>
                <label class="frequency-item">
                  <input type="checkbox" value="5725-5850" />
                  <span class="frequency-label">5725~5850 MHz</span>
                </label>
              </div>
            </div>
          </div>
          <div class="panel-footer">
            <button :class="['interference-btn', { active: deviceStatus.interfere.active }]" @click="toggleInterference">
              {{ deviceStatus.interfere.active ? '干扰关闭' : '干扰开启' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 右下角诱骗模式悬浮框 - 滑动效果 -->
      <div :class="['target-panel-bottom', 'deception-panel', { visible: showDeceptionPanel }]">
        <div class="panel-header">
          <span class="panel-title">诱骗模式</span>
        </div>
        <div class="panel-scroll-wrapper">
          <div class="panel-content">
            <div class="panel-section">
              <div class="section-title">诱骗类型</div>
              <div class="deception-type-list">
                <label class="deception-type-item">
                  <input type="radio" name="deceptionType" value="gps" checked />
                  <span class="deception-type-label">GPS诱骗</span>
                </label>
                <label class="deception-type-item">
                  <input type="radio" name="deceptionType" value="beidou" />
                  <span class="deception-type-label">北斗诱骗</span>
                </label>
                <label class="deception-type-item">
                  <input type="radio" name="deceptionType" value="glonass" />
                  <span class="deception-type-label">GLONASS诱骗</span>
                </label>
              </div>
            </div>
            <div class="panel-section">
              <div class="section-title">目标位置</div>
              <div class="location-input">
                <div class="input-group">
                  <label class="input-label">纬度:</label>
                  <input type="text" value="23.6557445" class="location-input-field" />
                </div>
                <div class="input-group">
                  <label class="input-label">经度:</label>
                  <input type="text" value="108.5668445" class="location-input-field" />
                </div>
                <div class="input-group">
                  <label class="input-label">高度:</label>
                  <input type="number" value="100" class="location-input-field" />
                </div>
              </div>
            </div>
          </div>
          <div class="panel-footer">
            <button :class="['deception-btn', { active: deviceStatus.decoy.active }]" @click="toggleDeception">
              {{ deviceStatus.decoy.active ? '诱骗关闭' : '诱骗开启' }}
            </button>
          </div>
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
const showDetectList = ref(false); // 侦测目标列表显示状态 - 初始隐藏
const showInterferencePanel = ref(false); // 干扰模式悬浮框显示状态
const showDeceptionPanel = ref(false); // 诱骗模式悬浮框显示状态
const showSignalProgress = ref(false); // 信号进度条显示状态
const signalValue = ref(0); // 信号数值
const signalProgressPercent = ref(0); // 信号进度百分比
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
  { id: 'interference', label: '干扰', icon: '📶' },
  { id: 'deception', label: '诱骗', icon: '📍' }
];

// 设备工作状态（只显示，不可交互）
// 所有功能默认关闭状态
const deviceStatus = ref({
  detect: { active: false },
  interfere: { active: false },
  decoy: { active: false }
});

// 过滤类型：signal=侦测目标，target=定位目标
const filterType = ref<'signal' | 'target'>('signal');

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

// 计算属性：过滤后的侦测目标列表
const filteredDetectTargets = computed(() => {
  if (filterType.value === 'all') {
    return detectTargets.value;
  }
  return detectTargets.value.filter(target => target.type === filterType.value);
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
    // 隐藏信号进度条
    showSignalProgress.value = false;
  } else {
    // 先取消所有目标的激活状态
    detectTargets.value.forEach(t => {
      t.buttonActive = false;
    });
    // 激活当前目标的按钮
    target.buttonActive = true;

    // 根据按钮类型显示或隐藏信号进度条
    if (target.buttonType === 'measure') {
      // 点击测向按钮，显示信号进度条
      showSignalProgress.value = true;
      // 设置初始信号值（从目标数据获取）
      signalValue.value = target.signalStrength || 0;
      updateSignalProgress(signalValue.value);
    } else {
      // 点击定位按钮，隐藏信号进度条
      showSignalProgress.value = false;
    }
  }
};

// 更新信号进度百分比（假设最大值为255）
const updateSignalProgress = (value: number) => {
  const maxValue = 255;
  const percent = Math.min((value / maxValue) * 100, 100);
  signalProgressPercent.value = percent;
};

// 接收后端信号数据的接口（预留）
// 使用方法：在WebSocket消息处理或API响应中调用此方法
// 示例：onSignalDataReceived({ value: 198 });
const onSignalDataReceived = (data: { value: number }) => {
  if (showSignalProgress.value) {
    signalValue.value = data.value;
    updateSignalProgress(data.value);
    console.log('[MainPage] 接收到信号数据:', data.value);
  }
};

// 切换侦测目标列表显示/隐藏
const toggleDetectList = () => {
  showDetectList.value = !showDetectList.value;
  console.log('[MainPage] 侦测列表显示状态切换:', showDetectList.value);
};

// 切换干扰状态
const toggleInterference = () => {
  deviceStatus.value.interfere.active = !deviceStatus.value.interfere.active;
  console.log('[MainPage] 干扰状态切换:', deviceStatus.value.interfere.active);
};

// 切换诱骗状态
const toggleDeception = () => {
  deviceStatus.value.decoy.active = !deviceStatus.value.decoy.active;
  console.log('[MainPage] 诱骗状态切换:', deviceStatus.value.decoy.active);
};

// 处理功能按钮点击
const handleFunctionClick = (funcId: string) => {
  console.log('[MainPage] 功能按钮点击:', funcId);
  console.log('[MainPage] 当前模式:', currentMode.value);

  // 互斥控制：点击不同菜单时显示对应的悬浮框，隐藏其他悬浮框
  // 如果点击的是当前已激活的菜单，则关闭该悬浮框
  if (funcId === currentMode.value) {
    // 点击当前已激活的菜单，关闭对应悬浮框
    console.log('[MainPage] 点击当前激活菜单，切换显示状态');
    if (funcId === 'detect') {
      showDetectList.value = !showDetectList.value;
    } else if (funcId === 'interference') {
      showInterferencePanel.value = !showInterferencePanel.value;
    } else if (funcId === 'deception') {
      showDeceptionPanel.value = !showDeceptionPanel.value;
    }
  } else {
    // 点击不同的菜单，切换到新菜单
    console.log('[MainPage] 点击不同菜单，切换模式');
    currentMode.value = funcId;
    // 关闭所有悬浮框和面板
    showDetectList.value = false;
    showInterferencePanel.value = false;
    showDeceptionPanel.value = false;
    showTargetInfo.value = false;
    // 点击干扰或诱骗时隐藏信号进度条
    if (funcId === 'interference' || funcId === 'deception') {
      showSignalProgress.value = false;
    }

    // 显示新菜单对应的悬浮框
    if (funcId === 'detect') {
      showDetectList.value = true;
      console.log('[MainPage] 显示侦测列表');
    } else if (funcId === 'interference') {
      showInterferencePanel.value = true;
      console.log('[MainPage] 显示干扰悬浮框');
    } else if (funcId === 'deception') {
      showDeceptionPanel.value = true;
      console.log('[MainPage] 显示诱骗悬浮框');
    }
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

// 点击地图时隐藏所有弹出框
const handleMapClick = () => {
  console.log('[MainPage] 点击地图，隐藏所有弹出框');
  showDetectList.value = false;
  showInterferencePanel.value = false;
  showDeceptionPanel.value = false;
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
  background: rgba(15, 15, 26, 0.9);
  padding: 12px 20px;
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
  z-index: 100; /* 确保左侧菜单不被悬浮框覆盖 */
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
  z-index: 60; /* 大于底部状态栏的z-index: 50 */
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

/* 过滤按钮容器 */
.filter-buttons {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

/* 过滤按钮样式 */
.filter-btn {
  flex: 1;
  padding: 8px 12px;
  background: #e0e0e0;
  border: 1px solid #ccc;
  border-radius: 6px;
  color: #333;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  outline: none;
}

.filter-btn:hover {
  background: #d0d0d0;
}

/* 侦测目标按钮激活状态 - 深色偏黄的暖棕色 */
.filter-btn.active:first-child {
  background: #8B7355;
  border-color: #8B7355;
  color: #fff;
}

/* 定位目标按钮激活状态 - 深色偏蓝的深蓝色 */
.filter-btn.active:nth-child(2) {
  background: #2D3748;
  border-color: #2D3748;
  color: #fff;
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

/* 信号强度进度条容器 */
.signal-progress-container {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 80;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

.signal-progress-container.visible {
  opacity: 1;
  visibility: visible;
}

.signal-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  min-width: 24px;
}

.progress-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  width: 200px;
  height: 20px;
  background: #f0f0f0;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(to right, #e0f7fa, #fff9c4, #ff9800);
  border-radius: 10px;
  transition: width 0.3s ease;
}

.signal-value {
  font-size: 16px;
  font-weight: 600;
  color: #000000;
  min-width: 50px;
  text-align: right;
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
  z-index: 150; /* 大于左侧菜单，确保在最上层 */
  transform: translateX(100%);
  transition: transform 0.3s ease-in-out;
  overflow: hidden;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.target-panel-bottom.visible {
  transform: translateX(0);
}

/* 干扰和诱骗悬浮框 - 与侦测列表完全一致 */
.target-panel-bottom.interference-panel,
.target-panel-bottom.deception-panel {
  position: absolute;
  left: 80px;
  top: 0;
  width: 320px;
  height: 100%;
  max-height: none; /* 覆盖基础类的max-height: 70vh */
  background: #ffffff;
  border-right: 1px solid #e0e0e0;
  border-left: 2px solid #666666; /* 保留左侧边框 */
  border-top: none; /* 覆盖基础类的边框 */
  border-bottom: none;
  box-shadow: none; /* 覆盖基础类的阴影 */
  z-index: 60; /* 大于底部状态栏的z-index: 50，覆盖基础类的z-index: 150 */
  display: flex;
  flex-direction: column;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
}

.target-panel-bottom.interference-panel.visible,
.target-panel-bottom.deception-panel.visible {
  transform: translateX(0);
}

.panel-header {
  background: #e6f0f7;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #d0dce8;
}

.panel-title {
  color: #1a5490;
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
  padding: 12px;
  background: #bbdefb;
}

/* 滚动包装器 - 包含content和footer */
.panel-scroll-wrapper {
  flex: 1;
  overflow-y: auto;
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
  padding: 12px 16px;
  background: rgba(240, 240, 240, 0.9); /* 半透明浅灰色背景 */
  display: flex;
  justify-content: flex-end; /* 靠右布局 */
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

/* 干扰和诱骗模式悬浮框样式 */
.panel-section {
  margin-bottom: 16px;
}

.section-title {
  color: #333;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 2px solid #e0e0e0;
}

/* 频段列表样式 */
.frequency-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.frequency-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.frequency-item:hover {
  background: rgba(230, 240, 255, 0.9);
}

.frequency-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.frequency-label {
  color: #333;
  font-size: 13px;
}

/* 诱骗类型样式 */
.deception-type-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.deception-type-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.deception-type-item:hover {
  background: rgba(230, 240, 255, 0.9);
}

.deception-type-item input[type="radio"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.deception-type-label {
  color: #333;
  font-size: 13px;
}

/* 位置输入样式 */
.location-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-label {
  color: #666;
  font-size: 12px;
  font-weight: 500;
  width: 50px;
}

.location-input-field {
  flex: 1;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 13px;
  color: #333;
}

.location-input-field:focus {
  outline: none;
  border-color: #4fc3f7;
  box-shadow: 0 0 0 2px rgba(79, 195, 247, 0.1);
}

/* 功率控制样式 */
.power-control {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 4px;
}

.power-slider {
  flex: 1;
  -webkit-appearance: none;
  height: 6px;
  background: #ddd;
  border-radius: 3px;
  outline: none;
}

.power-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: #4fc3f7;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.power-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #4fc3f7;
  border-radius: 50%;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.power-value {
  color: #333;
  font-size: 13px;
  font-weight: 600;
  min-width: 40px;
  text-align: right;
}

/* 干扰按钮样式 */
.interference-btn {
  width: auto; /* 自适应宽度 */
  min-width: 100px; /* 最小宽度 */
  padding: 10px 20px;
  background: #ff9800;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.interference-btn:hover {
  background: #f57c00;
}

.interference-btn.active {
  background: #f44336;
}

.interference-btn.active:hover {
  background: #d32f2f;
}

/* 诱骗按钮样式 */
.deception-btn {
  width: auto; /* 自适应宽度 */
  min-width: 100px; /* 最小宽度 */
  padding: 10px 20px;
  background: #9c27b0;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.deception-btn:hover {
  background: #7b1fa2;
}

.deception-btn.active {
  background: #4caf50;
}

.deception-btn.active:hover {
  background: #388e3c;
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
  z-index: 200; /* 确保在最上层 */
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
  }

  .device-name {
    font-size: 11px;
  }

  .status-item {
    font-size: 10px;
  }
}
</style>
