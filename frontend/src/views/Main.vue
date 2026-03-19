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
      <!-- 左侧功能按钮组 - 悬浮于底图之上，靠左对齐 -->
      <div class="left-function-buttons">
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
            <!-- 顶部通栏：SN码 + 操作按钮 -->
            <div class="target-header">
              <span class="sn-text">SN码: {{ target.snCode || '未知' }}</span>
              <div
                :class="['action-button', { active: target.buttonActive }]"
                @click.stop="toggleButton(target)"
              >
                <span class="btn-label">{{ target.buttonType === 'measure' ? '测向' : '定位' }}</span>
              </div>
            </div>

            <!-- 中间信息区：3行2列网格 -->
            <div class="target-info-grid">
              <!-- 第1行：型号 + 水平速度 -->
              <div class="info-cell">
                <span class="info-text">型号: {{ target.model || '未知' }}</span>
              </div>
              <div class="info-cell">
                <span class="info-text">水平速度: {{ target.horizontalSpeed }}m/s</span>
              </div>
              <!-- 第2行：高度 + 垂直速度 -->
              <div class="info-cell">
                <span class="info-text">高度: {{ target.altitude }}m</span>
              </div>
              <div class="info-cell">
                <span class="info-text">垂直速度: {{ target.verticalSpeed }}m/s</span>
              </div>
              <!-- 第3行：经纬度（跨两列） -->
              <div class="info-cell info-cell-full">
                <span class="coord-text">经纬度: {{ target.longitude || '未知' }};{{ target.latitude || '未知' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 中心地图操作区 -->
      <div class="map-area">
        <div class="map-container" ref="mapContainer">
          <!-- 信号强度进度条 - 显示在顶部中间 -->
          <div :class="['signal-progress-container', { visible: showSignalProgress }]" @click.stop>
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

          <!-- 地图服务 iframe -->
          <iframe
            ref="mapIframeRef"
            :src="mapServiceUrl"
            class="map-iframe"
            frameborder="0"
            allowfullscreen
            @load="onMapIframeLoad"
            @error="onMapIframeError"
          ></iframe>

          <!-- 目标无人机覆盖层 -->
          <div class="map-overlay">
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

            <!-- 飞手目标 -->
            <div
              :class="['pilot-target', { selected: showPilotInfo }]"
              :style="{ top: pilotTarget.top, left: pilotTarget.left }"
              @click.stop="handlePilotClick"
            >
              <div class="pilot-circle"></div>
              <div class="pilot-icon">👤</div>
            </div>
          </div>

          <!-- 地图控制按钮 -->
          <div class="map-controls">
            <!-- 设备状态显示 - 横向布局 -->
            <div class="device-status-inline">
              <div class="device-status-item-inline">
                <div :class="['status-indicator-small', deviceStatus.detect.active ? 'active' : 'inactive']"></div>
                <span class="status-label-small">侦测</span>
              </div>
              <div class="device-status-item-inline">
                <div :class="['status-indicator-small', deviceStatus.interfere.active ? 'active' : 'inactive']"></div>
                <span class="status-label-small">干扰</span>
              </div>
              <div class="device-status-item-inline">
                <div :class="['status-indicator-small', deviceStatus.decoy.active ? 'active' : 'inactive']"></div>
                <span class="status-label-small">诱骗</span>
              </div>
            </div>
            <!-- 目标数量统计 - 横向排列两个卡片 -->
            <div class="target-stats">
              <div class="stat-card">
                <div class="stat-number">{{ detectTargetCount }}</div>
                <div class="stat-label">定位目标</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">{{ signalTargetCount }}</div>
                <div class="stat-label">侦测目标</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右下角目标信息面板 - 滑动效果 -->
      <div :class="['target-panel-bottom', 'target-info-panel', { visible: showTargetInfo }]">
        <div class="panel-header">
          <span class="panel-title">目标信息</span>
          <button class="close-btn transparent" @click="closeTargetPanel">×</button>
        </div>
        <div class="panel-body">
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
            <div class="info-row">
              <span class="info-label">经纬度:</span>
              <span class="info-value">{{ currentTargetInfo.lat }}; {{ currentTargetInfo.lng }}</span>
            </div>
          </div>
          <div class="panel-footer">
            <button class="whitelist-btn">加入白名单</button>
          </div>
        </div>
      </div>

      <!-- 右下角飞手位置弹出框 - 滑动效果 -->
      <div :class="['target-panel-bottom', 'pilot-info-panel', { visible: showPilotInfo }]">
        <div class="panel-header">
          <span class="panel-title">飞手位置</span>
          <button class="close-btn transparent" @click="closePilotPanel">×</button>
        </div>
        <div class="panel-body">
          <div class="panel-content">
            <div class="info-row">
              <span class="info-label">经纬度:</span>
              <span class="info-value">{{ pilotTarget.latitude }}; {{ pilotTarget.longitude }}</span>
            </div>
            <div class="qr-code-container">
              <canvas ref="qrCodeCanvas" class="qr-code"></canvas>
            </div>
            <div class="qr-hint">提示：扫描该二维码可导航到飞手位置</div>
          </div>
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
            <button :class="['interference-btn', { active: interferenceButtonActive }]" @click="toggleInterference">
              {{ interferenceButtonActive ? '干扰关闭' : '干扰开启' }}
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
            <button :class="['deception-btn', { active: deceptionButtonActive }]" @click="toggleDeception">
              {{ deceptionButtonActive ? '诱骗关闭' : '诱骗开启' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 底部居中按钮组 -->
      <div class="bottom-center-buttons">
        <button :class="['bottom-btn', { active: activeBottomButton === 'monitor' }]" @click="goToMain">
          <span class="bottom-btn-text">运行监视</span>
        </button>
        <div class="bottom-btn-wrapper">
          <button :class="['bottom-btn', { active: activeBottomButton === 'config' }]" @click="toggleConfigMenu">
            <span class="bottom-btn-text">配置管理</span>
          </button>
          <!-- 配置管理二级菜单 -->
          <div v-if="showConfigMenu" class="sub-menu config-menu">
            <div class="sub-menu-item" @click="handleConfigItem('blacklist')">黑白名单配置</div>
            <div class="sub-menu-item" @click="handleConfigItem('user')">用户管理</div>
            <div class="sub-menu-item" @click="handleConfigItem('system')">系统配置</div>
            <div class="sub-menu-item" @click="handleConfigItem('noFly')">禁飞区设置</div>
          </div>
        </div>
        <div class="bottom-btn-wrapper">
          <button :class="['bottom-btn', { active: activeBottomButton === 'statistics' }]" @click="toggleStatisticsMenu">
            <span class="bottom-btn-text">查询统计</span>
          </button>
          <!-- 查询统计二级菜单 -->
          <div v-if="showStatisticsMenu" class="sub-menu statistics-menu">
            <div class="sub-menu-item" @click="handleStatisticsItem('alarm')">告警记录</div>
            <div class="sub-menu-item" @click="handleStatisticsItem('interference')">干扰操作记录</div>
            <div class="sub-menu-item" @click="handleStatisticsItem('deception')">诱骗操作记录</div>
            <div class="sub-menu-item" @click="handleStatisticsItem('detect')">侦测操作记录</div>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import QRCode from 'qrcode';
import { MAP_CONFIG } from '@/config';
import { useMap } from '@/composables/useMap';

// 版本标识 - 用于确认是否加载了最新代码
const CODE_VERSION = '2024-03-18-v5';
console.log('[MainPage] ========== 组件版本:', CODE_VERSION, '==========');
console.log('[MainPage] 组件开始加载...');

const router = useRouter();

console.log('[MainPage] router实例:', !!router);

// ========================================
// 地图相关变量和状态
// ========================================
const mapIframeRef = ref<HTMLIFrameElement | null>(null);
const mapServiceUrl = MAP_CONFIG.ENABLED ? MAP_CONFIG.MAP_URL : '';

// 使用地图 composable
const {
  initMap,
  setCallbacks,
  destroy: destroyMap,
  parseLocation
} = useMap(mapIframeRef);

console.log('[MainPage] 地图服务配置:', {
  enabled: MAP_CONFIG.ENABLED,
  url: mapServiceUrl
});

const currentMode = ref('detect');
const showTargetInfo = ref(false);
const showDetectList = ref(false); // 侦测目标列表显示状态 - 初始隐藏
const showInterferencePanel = ref(false); // 干扰模式悬浮框显示状态
const showDeceptionPanel = ref(false); // 诱骗模式悬浮框显示状态
const showPilotInfo = ref(false); // 飞手位置弹出框显示状态
const qrCodeCanvas = ref<HTMLCanvasElement | null>(null); // 二维码Canvas
const showSignalProgress = ref(false); // 信号进度条显示状态
const signalValue = ref(0); // 信号数值
const signalProgressPercent = ref(0); // 信号进度百分比
const selectedTargetId = ref<number | null>(null);
const currentTime = ref('');

// 底部按钮菜单状态
const showConfigMenu = ref(false); // 配置管理二级菜单显示状态
const showStatisticsMenu = ref(false); // 查询统计二级菜单显示状态
const activeBottomButton = ref<string | null>('monitor'); // 当前激活的底部按钮，默认为运行监视

// 飞手目标数据
const pilotTarget = ref({
  id: 'pilot-1',
  type: 'pilot',
  longitude: '108.5667500',
  latitude: '23.6556500',
  top: '55%',
  left: '35%'
});

// 侦测目标数据
const detectTargets = ref([
  {
    id: 1,
    type: 'target',
    snCode: 'SN15478214',
    model: '御3C',
    altitude: 56,
    horizontalSpeed: 18,
    verticalSpeed: 12,
    longitude: '23.6557444',
    latitude: '108.5668751',
    top: '30%',
    left: '70%',
    buttonType: 'locate' as 'measure' | 'locate',
    buttonActive: false
  },
  {
    id: 2,
    type: 'target',
    snCode: 'SN15478215',
    model: '御4PRO',
    altitude: 120,
    horizontalSpeed: 25,
    verticalSpeed: 8,
    longitude: '23.6558000',
    latitude: '108.5669000',
    top: '40%',
    left: '60%',
    buttonType: 'locate' as 'measure' | 'locate',
    buttonActive: false
  },
  {
    id: 3,
    type: 'target',
    snCode: 'SN15478216',
    model: '御Air 2',
    altitude: 85,
    horizontalSpeed: 15,
    verticalSpeed: 5,
    longitude: '23.6557000',
    latitude: '108.5668000',
    top: '50%',
    left: '45%',
    buttonType: 'locate' as 'measure' | 'locate',
    buttonActive: false
  },
  {
    id: 4,
    type: 'target',
    snCode: 'SN15478217',
    model: '御Mini 3',
    altitude: 45,
    horizontalSpeed: 22,
    verticalSpeed: 10,
    longitude: '23.6557500',
    latitude: '108.5668500',
    top: '35%',
    left: '55%',
    buttonType: 'measure' as 'measure' | 'locate',
    buttonActive: false
  }
]);

const functions = [
  { id: 'detect', label: '侦测', icon: '📡' },
  { id: 'interference', label: '干扰', icon: '📶' },
  { id: 'deception', label: '诱骗', icon: '📍' }
];

// 设备工作状态（只显示，来自后端设备状态上报）
// 注意：这些状态不应被按钮点击修改，应该通过WebSocket等接收后端设备状态更新
const deviceStatus = ref({
  detect: { active: false },   // 侦测设备状态
  interfere: { active: false }, // 干扰设备状态
  decoy: { active: false }     // 诱骗设备状态
});

// 按钮点击状态（独立于设备状态）
// 用于控制按钮的开启/关闭显示，不影响底部设备状态
const interferenceButtonActive = ref(false);
const deceptionButtonActive = ref(false);

// 过滤类型：signal=侦测目标，target=定位目标
const filterType = ref<'signal' | 'target'>('signal');

// 计算属性：当前选中目标信息
const currentTargetInfo = computed(() => {
  console.log('[MainPage] currentTargetInfo 计算 - selectedTargetId:', selectedTargetId.value);
  const target = detectTargets.value.find(t => t.id === selectedTargetId.value);
  console.log('[MainPage] 找到的目标:', target);
  if (target) {
    // 将字段名统一映射为模板中使用的名称
    const result = {
      targetId: target.snCode,
      model: target.model,
      lat: target.latitude,
      lng: target.longitude,
      altitude: target.altitude,
      horizontalSpeed: target.horizontalSpeed,
      verticalSpeed: target.verticalSpeed
    };
    console.log('[MainPage] 返回目标信息:', result);
    return result;
  }
  // 默认值
  console.log('[MainPage] 返回默认值');
  return {
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
  // 根据过滤类型筛选：signal=测向目标，target=定位目标
  if (filterType.value === 'all') {
    return detectTargets.value;
  }
  return detectTargets.value.filter(target => target.buttonType === (filterType.value === 'signal' ? 'measure' : 'locate'));
});

// 计算属性：定位目标数量（buttonType === 'locate'）
const detectTargetCount = computed(() => {
  return detectTargets.value.filter(target => target.buttonType === 'locate').length;
});

// 计算属性：侦测目标数量（buttonType === 'measure'）
const signalTargetCount = computed(() => {
  return detectTargets.value.filter(target => target.buttonType === 'measure').length;
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

// 切换干扰按钮状态（不影响底部设备状态）
const toggleInterference = () => {
  interferenceButtonActive.value = !interferenceButtonActive.value;
  console.log('[MainPage] 干扰按钮状态切换:', interferenceButtonActive.value);
  console.log('[MainPage] 干扰设备状态（来自后端）:', deviceStatus.value.interfere.active);
};

// 切换诱骗按钮状态（不影响底部设备状态）
const toggleDeception = () => {
  deceptionButtonActive.value = !deceptionButtonActive.value;
  console.log('[MainPage] 诱骗按钮状态切换:', deceptionButtonActive.value);
  console.log('[MainPage] 诱骗设备状态（来自后端）:', deviceStatus.value.decoy.active);
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
    showPilotInfo.value = false;
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
  console.log('[MainPage] selectTarget 调用 - 目标ID:', target.id, '目标数据:', target);
  selectedTargetId.value = target.id;
  showTargetInfo.value = true; // 显示目标信息弹出框
  console.log('[MainPage] selectTarget 完成 - selectedTargetId:', selectedTargetId.value, 'showTargetInfo:', showTargetInfo.value);
};

// 点击地图上的无人机目标
const handleTargetClick = (target: any) => {
  console.log('[MainPage] handleTargetClick 调用 - 目标ID:', target.id, '目标数据:', target);
  // 互斥：关闭飞手位置弹出框
  showPilotInfo.value = false;
  
  if (selectedTargetId.value === target.id && showTargetInfo.value) {
    // 如果点击的是同一个目标且信息框已显示，则隐藏信息框
    console.log('[MainPage] 隐藏信息框');
    showTargetInfo.value = false;
  } else {
    // 否则选中目标并显示信息框
    console.log('[MainPage] 显示信息框');
    selectedTargetId.value = target.id;
    showTargetInfo.value = true;
  }
  console.log('[MainPage] handleTargetClick 完成 - selectedTargetId:', selectedTargetId.value, 'showTargetInfo:', showTargetInfo.value);
};

// 关闭目标信息面板
const closeTargetPanel = () => {
  showTargetInfo.value = false;
};

// 点击飞手目标
const handlePilotClick = () => {
  console.log('[MainPage] handlePilotClick 调用');
  // 互斥：关闭目标信息弹出框
  showTargetInfo.value = false;
  selectedTargetId.value = null;
  
  if (showPilotInfo.value) {
    // 如果飞手位置弹出框已显示，则隐藏
    showPilotInfo.value = false;
  } else {
    // 显示飞手位置弹出框
    showPilotInfo.value = true;
    // 生成二维码
    nextTick(() => {
      generateQRCode();
    });
  }
  console.log('[MainPage] handlePilotClick 完成 - showPilotInfo:', showPilotInfo.value);
};

// 关闭飞手位置面板
const closePilotPanel = () => {
  showPilotInfo.value = false;
};

// 生成二维码
const generateQRCode = async () => {
  if (!qrCodeCanvas.value) {
    console.log('[MainPage] qrCodeCanvas未初始化');
    return;
  }
  
  try {
    // 生成导航链接（使用高德地图或百度地图格式）
    const lat = pilotTarget.value.latitude;
    const lng = pilotTarget.value.longitude;
    const navUrl = `https://uri.amap.com/marker?position=${lng},${lat}&name=飞手位置`;
    
    await QRCode.toCanvas(qrCodeCanvas.value, navUrl, {
      width: 80,
      margin: 1,
      color: {
        dark: '#ffffff',
        light: '#00000000'
      }
    });
    console.log('[MainPage] 二维码生成成功');
  } catch (error) {
    console.error('[MainPage] 二维码生成失败:', error);
  }
};

// ========================================
// 地图事件处理
// ========================================

/**
 * 收缩所有展开的面板和菜单
 */
const collapseAllPanels = () => {
  showDetectList.value = false;
  showInterferencePanel.value = false;
  showDeceptionPanel.value = false;
  showTargetInfo.value = false;
  showPilotInfo.value = false;
  showSignalProgress.value = false;
  showConfigMenu.value = false;
  showStatisticsMenu.value = false;
  selectedTargetId.value = null;
  activeBottomButton.value = 'monitor'; // 设置运行监视按钮为选中状态
};

/**
 * 地图 iframe 加载完成回调
 */
const onMapIframeLoad = () => {
  console.log('[MainPage] 地图 iframe 加载完成');

  // 设置回调方法
  setCallbacks({
    loadComplete: () => {
      console.log('[MainPage] 地图加载完成');
    },
    selectOther: () => {
      collapseAllPanels();
    },
    selectRight_ClickOther: () => {
      collapseAllPanels();
    },
    mouseLocation: (locationStr: string) => {
      const coords = parseLocation(locationStr);
      if (coords) {
        console.log('[MainPage] 解析坐标 - 经度:', coords.longitude, '纬度:', coords.latitude);
      }
    }
  });

  // 初始化地图
  initMap();
};

/**
 * 地图 iframe 加载错误回调
 */
const onMapIframeError = () => {
  console.error('[MainPage] 地图 iframe 加载失败');
};

// ========================================
// 地图事件处理结束
// ========================================

// 运行监视按钮 - 返回主界面
const goToMain = () => {
  console.log('[MainPage] 运行监视 - 返回主界面');
  // 关闭所有面板和菜单
  showDetectList.value = false;
  showInterferencePanel.value = false;
  showDeceptionPanel.value = false;
  showConfigMenu.value = false;
  showStatisticsMenu.value = false;
  showTargetInfo.value = false;
  showPilotInfo.value = false;
  // 重置所有按钮状态
  currentMode.value = 'detect';
  activeBottomButton.value = 'monitor'; // 激活运行监视按钮
};

// 切换配置管理二级菜单
const toggleConfigMenu = () => {
  console.log('[MainPage] 切换配置管理菜单');
  showConfigMenu.value = !showConfigMenu.value;
  showStatisticsMenu.value = false; // 关闭查询统计菜单
  activeBottomButton.value = showConfigMenu.value ? 'config' : null; // 根据菜单状态设置激活按钮
};

// 切换查询统计二级菜单
const toggleStatisticsMenu = () => {
  console.log('[MainPage] 切换查询统计菜单');
  showStatisticsMenu.value = !showStatisticsMenu.value;
  showConfigMenu.value = false; // 关闭配置管理菜单
  activeBottomButton.value = showStatisticsMenu.value ? 'statistics' : null; // 根据菜单状态设置激活按钮
};

// 处理配置管理菜单项点击
const handleConfigItem = (item: string) => {
  console.log('[MainPage] 配置管理项点击:', item);
  showConfigMenu.value = false;
  activeBottomButton.value = null; // 关闭菜单后清除激活状态
  // 根据item执行相应操作
  switch (item) {
    case 'blacklist':
      console.log('黑白名单配置');
      break;
    case 'user':
      console.log('用户管理');
      break;
    case 'system':
      console.log('系统配置');
      break;
    case 'noFly':
      console.log('禁飞区设置');
      router.push('/nofly');
      break;
  }
};

// 处理查询统计菜单项点击
const handleStatisticsItem = (item: string) => {
  console.log('[MainPage] 查询统计项点击:', item);
  showStatisticsMenu.value = false;
  activeBottomButton.value = null; // 关闭菜单后清除激活状态
  // TODO: 根据item执行相应操作
  switch (item) {
    case 'alarm':
      console.log('告警记录');
      break;
    case 'interference':
      console.log('干扰操作记录');
      break;
    case 'deception':
      console.log('诱骗操作记录');
      break;
    case 'detect':
      console.log('侦测操作记录');
      break;
  }
};

onMounted(() => {
  updateTime();
  timeInterval = window.setInterval(updateTime, 1000);

  // 检查登录状态
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  if (!isLoggedIn) {
    router.push('/login');
  }
});

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval);
  }
  // 销毁地图
  destroyMap();
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
  overflow: hidden; /* 恢复 overflow: hidden，防止内容溢出容器边界 */
  position: relative; /* 提供定位上下文给绝对定位的子元素 */
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 顶部状态栏 */
.status-bar {
  background: rgba(3, 22, 50, 0.8);
  height: 24px;
  padding: 0 10px;
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
  position: relative;
}

/* 左侧功能按钮组 - 悬浮于底图之上，垂直排列，靠左对齐 */
.left-function-buttons {
  position: absolute;
  left: 5px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 200;
  will-change: transform; /* 优化渲染性能 */
}

/* 功能按钮 - 独立的图文按钮，无边框、白色加粗字体 */
.function-btn {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  background: rgba(3, 22, 50, 0.8); /* #031632，80%透明度 */
  border: none; /* 无边框 */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.function-btn:hover {
  background: rgba(3, 22, 50, 0.9); /* 悬停时透明度增加到90% */
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(100, 255, 218, 0.2);
}

.function-btn.active {
  background: #0B5D98; /* 选中状态背景色 */
  border: none;
  box-shadow: 0 0 20px rgba(11, 93, 152, 0.4);
}

.function-btn.active .func-label {
  color: #ffffff;
}

.function-btn.active .func-icon {
  color: #ffffff;
}

.func-icon {
  font-size: 28px;
  margin-bottom: 6px;
}

.func-label {
  color: #ffffff; /* 白色字体 */
  font-size: 13px;
  font-weight: bold; /* 加粗 */
}

/* 侦测目标列表 */
.detect-list-panel {
  position: absolute;
  left: 75px; /* 与按钮组对齐（5px边距 + 60px按钮宽度 + 10px间距） */
  top: 50%;
  margin-top: -220px; /* 垂直居中：高度440px的一半 */
  width: 252px;
  height: 440px;
  background: rgba(3, 22, 50, 0.8);
  border: 2px solid #666666;
  border-left: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 250; /* 与其他面板一致 */
  display: flex;
  flex-direction: column;
  transform: translateX(-400px); /* 默认完全隐藏在左侧，确保面板完全移出可视区域 */
  transition: transform 0.3s ease;
  will-change: transform; /* 优化渲染性能 */
}

.detect-list-panel.visible {
  transform: translateX(0); /* 显示时回到原位 */
}

.list-header {
  background: url('/backgrounds/小标题样式3 拷贝 2.png') no-repeat center center;
  background-size: cover;
  width: 252px;
  height: 32px;
  padding: 0;
  border-bottom: 1px solid #d0dce8;
  display: flex;
  justify-content: center;
  align-items: center;
}

.list-title {
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
}

/* 过滤按钮容器 */
.filter-buttons {
  display: flex;
  gap: 8px;
  padding: 5px 12px;
  background: transparent;
  border-bottom: none;
}

/* 过滤按钮样式 */
.filter-btn {
  flex: 0 0 auto;
  padding: 0;
  width: 88px;
  height: 24px;
  background: url('/backgrounds/按钮2.png') no-repeat center center;
  background-size: cover;
  border: none;
  border-radius: 0;
  color: #ffffff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  outline: none;
  box-shadow: none;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

.filter-btn:hover {
  background: url('/backgrounds/按钮2.png') no-repeat center center;
  background-size: cover;
}

/* 过滤按钮激活状态 */
.filter-btn.active {
  background: url('/backgrounds/按钮2(选中)2.png') no-repeat center center;
  background-size: cover;
  color: #ffffff;
  font-weight: 600;
}

.list-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: transparent;
  /* 隐藏滚动条但保留滚动功能 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

/* Chrome/Safari/Opera 隐藏滚动条 */
.list-content::-webkit-scrollbar {
  display: none;
}

/* 侦测目标卡片 - 新布局：顶部通栏 + 中间2x2网格 + 底部通栏 */
.target-card {
  background: transparent;
  border: 1px solid #e0e0e0; /* 浅色边框 */
  border-radius: 4px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.target-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-color: #90caf9;
}

.target-card.selected {
  box-shadow: 0 0 12px rgba(33, 150, 243, 0.4);
  border-color: #2196f3;
}

/* 顶部通栏：SN码 + 操作按钮 */
.target-header {
  flex: 0 0 auto;
  height: 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px;
  background: transparent;
  border-bottom: 1px solid #f0f0f0;
}

.sn-text {
  color: #ffffff;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* 操作按钮 - 横向布局 */
.action-button {
  width: 88px;
  height: 24px;
  padding: 0;
  background: url('/backgrounds/按钮2.png') no-repeat center center;
  background-size: cover;
  border: none;
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  writing-mode: horizontal-tb;
  text-orientation: mixed;
  box-shadow: none;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

.action-button:hover {
  background: url('/backgrounds/按钮2.png') no-repeat center center;
  background-size: cover;
}

/* 激活状态 */
.action-button.active {
  background: url('/backgrounds/按钮2(选中)2.png') no-repeat center center;
  background-size: cover;
}

.action-button.active .btn-label {
  color: #ffffff;
  font-weight: 600;
}

.btn-label {
  color: #ffffff;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 1px;
  padding: 0;
}

/* 中间信息区：3行2列网格 */
.target-info-grid {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr; /* 两列等宽 */
  grid-template-rows: 1fr 1fr auto; /* 两行等高，第三行自适应 */
  padding: 12px;
  gap: 8px;
  background: transparent;
}

.info-cell {
  display: flex;
  align-items: center;
  min-height: 24px;
}

/* 跨两列的单元格 */
.info-cell-full {
  grid-column: 1 / -1; /* 跨越所有列 */
}

.info-text {
  color: #ffffff;
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 0.3px;
  white-space: nowrap;
}

/* 经纬度文字样式 */
.coord-text {
  color: #ffffff;
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 0.3px;
  word-break: break-all;
}

/* 删除之前的 target-footer 样式，因为经纬度已经移到网格中 */

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

/* 地图iframe样式 */
.map-iframe {
  width: 100%;
  height: 100%;
  border: none;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

/* 地图覆盖层 - 用于放置目标图标 */
.map-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* 默认不拦截事件，让点击穿透到iframe */
  z-index: 2;
}

/* 覆盖层内的目标元素可以接收点击事件 */
.map-overlay .drone-target,
.map-overlay .pilot-target {
  pointer-events: auto;
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

/* 地图控制按钮区域 */
.map-controls {
  position: absolute;
  top: 5px;
  right: 5px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: flex-end;
  z-index: 10;
}

/* 设备状态显示（右上角） - 横向布局 */
.device-status-inline {
  display: flex;
  flex-direction: row;
  gap: 20px;
  padding: 8px 16px;
  background: rgba(3, 22, 50, 0.8);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.device-status-item-inline {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-indicator-small {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid #999999;
  flex-shrink: 0;
}

.status-indicator-small.active {
  background: #4caf50;
  border-color: #4caf50;
  box-shadow: 0 0 6px rgba(76, 175, 80, 0.6);
}

.status-indicator-small.inactive {
  background: #cccccc;
  border-color: #999999;
}

.status-label-small {
  color: #ffffff;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}

/* 目标数量统计 - 横向排列两个卡片 */
.target-stats {
  display: flex;
  flex-direction: row;
  gap: 8px;
  width: 100%;
}

.stat-card {
  flex: 1;
  min-width: 60px;
  padding: 6px 10px;
  background: rgba(3, 22, 50, 0.8);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.stat-number {
  color: #ffffff;
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  color: #ffffff;
  font-size: 11px;
  font-weight: 500;
  margin-top: 2px;
  white-space: nowrap;
}

/* 控制按钮行 */
.control-buttons-row {
  display: flex;
  gap: 8px;
}

.control-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(68, 160, 141, 0.3);
}

.control-btn:hover {
  transform: scale(1.1);
  background: linear-gradient(135deg, #5ee0d7 0%, #55b39f 100%);
  box-shadow: 0 3px 6px rgba(68, 160, 141, 0.4);
}

.control-btn:active {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%);
  box-shadow: 0 4px 12px rgba(255, 165, 0, 0.5);
}

/* 右下角目标信息面板 - 滑动效果，透明背景 */
.target-panel-bottom {
  position: absolute;
  right: 5px;
  bottom: 10px;
  width: 300px; /* 减小宽度，避免溢出容器 */
  max-height: 60vh; /* 减小最大高度，避免溢出容器 */
  background: rgba(255, 255, 255, 0.95); /* 半透明白色背景 */
  border: 2px solid #666666;
  border-right: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 150; /* 大于左侧菜单，确保在最上层 */
  transform: translateX(110%); /* 增加到110%，确保完全隐藏包括阴影 */
  transition: transform 0.3s ease-in-out;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 目标信息弹出框 - 单独样式，使用组合选择器提高优先级 */
.target-panel-bottom.target-info-panel {
  width: 158px !important;
  height: 268px !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.target-panel-bottom.visible {
  transform: translateX(0);
}

/* 干扰和诱骗悬浮框 - 从左侧按钮组右侧滑出 */
.target-panel-bottom.interference-panel,
.target-panel-bottom.deception-panel {
  position: absolute;
  left: 75px !important; /* 与按钮组对齐（5px边距 + 60px按钮宽度 + 10px间距） */
  top: 50% !important;
  margin-top: -220px !important; /* 垂直居中：高度440px的一半 */
  width: 252px !important; /* 强制覆盖全局样式 */
  height: 440px !important; /* 强制覆盖全局样式 */
  max-height: 440px !important; /* 强制覆盖全局样式 */
  background: rgba(3, 22, 50, 0.8);
  border: 2px solid #666666;
  border-left: none; /* 移除左边框，与按钮组衔接 */
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 250; /* 高于左侧按钮组(200) */
  display: flex;
  flex-direction: column;
  transform: translateX(-400px); /* 默认完全隐藏在左侧，确保面板完全移出可视区域 */
  transition: transform 0.3s ease;
}

.target-panel-bottom.interference-panel.visible,
.target-panel-bottom.deception-panel.visible {
  transform: translateX(0); /* 显示时回到原位 */
}

.panel-header {
  background: url('/backgrounds/小标题样式3 拷贝 2.png') no-repeat center center;
  background-size: cover;
  width: 252px;
  height: 32px;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  border-bottom: 1px solid #d0dce8;
}

/* 目标信息弹出框标题栏 - 单独样式 */
.target-info-panel .panel-header {
  background: url('/backgrounds/小标题样式2.png') no-repeat center center;
  background-size: cover;
  width: 158px;
  height: 32px;
  padding: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: none;
}

.panel-title {
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
}

/* 目标信息弹出框标题 - 单独样式 */
.target-info-panel .panel-title {
  padding-left: 8px;
  font-size: 14px;
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

/* 透明背景的关闭按钮 - 用于目标信息弹出框 */
.close-btn.transparent {
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0;
}

.close-btn.transparent:hover {
  background: rgba(255, 255, 255, 0.1);
}

.panel-content {
  padding: 12px;
  background: transparent;
}

/* 目标信息弹出框内容区域包装器 - 包含content和footer，共用背景图片 */
.target-info-panel .panel-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: url('/backgrounds/斜弹框背景图.png') no-repeat center center;
  background-size: 100% 100%;
}

/* 目标信息弹出框内容区域 - 单独样式 */
.target-info-panel .panel-content {
  padding: 4px 6px;
  flex: 0 0 auto;
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  background: transparent;
}

/* 滚动包装器 - 包含content和footer */
.panel-scroll-wrapper {
  flex: 1;
  overflow-y: auto;
  /* 隐藏滚动条但保留滚动功能 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

/* Chrome/Safari/Opera 隐藏滚动条 */
.panel-scroll-wrapper::-webkit-scrollbar {
  display: none;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid rgba(240, 240, 240, 0.5);
}

/* 目标信息弹出框信息行 - 单独样式 */
.target-info-panel .info-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 3px 4px;
  border-bottom: none;
}

.target-panel-bottom:not(.interference-panel):not(.deception-panel) .info-row:last-child {
  border-bottom: none;
}

.target-info-panel .info-label {
  color: #ffffff;
  font-size: 14px;
  font-weight: 400;
  margin-right: 4px;
  white-space: nowrap;
}

.target-info-panel .info-value {
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  text-align: left;
  flex: 1;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  color: #ffffff;
  font-size: 13px;
  font-weight: 500;
}

.info-value {
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
}

.panel-footer {
  padding: 12px 16px;
  background: transparent;
  display: flex;
  justify-content: flex-end; /* 靠右布局 */
}

/* 目标信息弹出框底部按钮区域 - 单独样式 */
.target-info-panel .panel-footer {
  padding: 4px 6px;
  display: flex;
  justify-content: center;
}

.whitelist-btn {
  width: 100%; /* 通栏按钮 */
  padding: 12px 20px;
  background: url('/assets/backgrounds/按钮(默认).png') no-repeat center center;
  background-size: 100% 100%;
  border: none;
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

/* 目标信息弹出框加入白名单按钮 - 单独样式 */
.target-info-panel .whitelist-btn {
  width: 88px;
  height: 24px;
  padding: 0;
  background: url('/backgrounds/按钮2.png') no-repeat center center;
  background-size: cover;
  border: none;
  border-radius: 0;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  box-shadow: none;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  margin: 0 auto;
}

.target-panel-bottom:not(.interference-panel):not(.deception-panel) .whitelist-btn:hover {
  background: url('/backgrounds/按钮2.png') no-repeat center center;
  background-size: cover;
}

.target-panel-bottom:not(.interference-panel):not(.deception-panel) .whitelist-btn:active {
  background: url('/backgrounds/按钮2(选中)2.png') no-repeat center center;
  background-size: cover;
}

/* 飞手目标样式 */
.pilot-target {
  position: absolute;
  cursor: pointer;
  transform: translate(-50%, -50%);
  z-index: 20;
}

.pilot-target .pilot-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 165, 0, 0.3);
  border: 2px solid #ffa500;
  animation: pilot-pulse 2s infinite;
}

.pilot-target .pilot-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 18px;
}

.pilot-target.selected .pilot-circle {
  background: rgba(255, 165, 0, 0.6);
  border-width: 3px;
}

@keyframes pilot-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 165, 0, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 165, 0, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 165, 0, 0);
  }
}

/* 飞手位置弹出框样式 */
.pilot-info-panel {
  width: 158px !important;
  height: 268px !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.pilot-info-panel .panel-header {
  background: url('/backgrounds/小标题样式2.png') no-repeat center center;
  background-size: cover;
  width: 158px;
  height: 32px;
  padding: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: none;
}

.pilot-info-panel .panel-title {
  padding-left: 8px;
  font-size: 14px;
  color: #ffffff;
  font-weight: 600;
}

.pilot-info-panel .panel-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: url('/backgrounds/斜弹框背景图.png') no-repeat center center;
  background-size: 100% 100%;
}

.pilot-info-panel .panel-content {
  padding: 4px 6px;
  flex: 1;
  display: flex;
  flex-direction: column;
  background: transparent;
}

.pilot-info-panel .info-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 3px 4px;
  border-bottom: none;
}

.pilot-info-panel .info-label {
  color: #ffffff;
  font-size: 14px;
  font-weight: 400;
  margin-right: 4px;
  white-space: nowrap;
}

.pilot-info-panel .info-value {
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  text-align: left;
  flex: 1;
}

.qr-code-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 0;
}

.qr-code {
  width: 80px;
  height: 80px;
}

.qr-hint {
  color: #ffffff;
  font-size: 10px;
  text-align: center;
  padding: 4px;
  opacity: 0.8;
}

/* 干扰和诱骗模式悬浮框样式 */
.panel-section {
  margin-bottom: 16px;
}

.section-title {
  color: #ffffff;
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
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.frequency-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.frequency-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.frequency-label {
  color: #ffffff;
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
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.deception-type-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.deception-type-item input[type="radio"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.deception-type-label {
  color: #ffffff;
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
  color: #ffffff;
  font-size: 12px;
  font-weight: 500;
  width: 50px;
}

.location-input-field {
  flex: 1;
  padding: 6px 8px;
  background: transparent;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 13px;
  color: #ffffff;
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
  background: transparent;
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
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  min-width: 40px;
  text-align: right;
}

/* 干扰按钮样式 */
.interference-btn {
  width: 88px;
  height: 24px;
  padding: 0;
  background: url('/backgrounds/按钮2.png') no-repeat center center;
  background-size: cover;
  border: none;
  border-radius: 0;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: none;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

.interference-btn:hover {
  background: url('/backgrounds/按钮2.png') no-repeat center center;
  background-size: cover;
}

.interference-btn.active {
  background: url('/backgrounds/按钮2(选中)2.png') no-repeat center center;
  background-size: cover;
}

/* 诱骗按钮样式 */
.deception-btn {
  width: 88px;
  height: 24px;
  padding: 0;
  background: url('/backgrounds/按钮2.png') no-repeat center center;
  background-size: cover;
  border: none;
  border-radius: 0;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: none;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
}

.deception-btn:hover {
  background: url('/backgrounds/按钮2.png') no-repeat center center;
  background-size: cover;
}

.deception-btn.active {
  background: url('/backgrounds/按钮2(选中)2.png') no-repeat center center;
  background-size: cover;
}

/* 响应式设计 - 适配800*480分辨率 */
@media (max-width: 850px) {
  /* 保持参数面板统一尺寸，不受响应式影响 */
  .detect-list-panel {
    width: 252px; /* 保持统一尺寸 */
    max-height: 440px; /* 保持统一尺寸 */
  }

  /* 保持干扰和诱骗面板统一尺寸 */
  .target-panel-bottom.interference-panel,
  .target-panel-bottom.deception-panel {
    width: 252px !important; /* 强制保持统一尺寸 */
    height: 440px !important; /* 强制保持统一尺寸 */
    left: 75px !important; /* 强制保持左侧定位 */
    right: auto !important; /* 覆盖响应式设计的 right 属性 */
  }

  /* 仅影响右侧目标信息面板 */
  .target-panel-bottom:not(.interference-panel):not(.deception-panel) {
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
  /* 保持参数面板统一尺寸，不受响应式影响 */
  .detect-list-panel {
    width: 252px; /* 保持统一尺寸 */
    max-height: 440px; /* 保持统一尺寸 */
  }

  /* 保持干扰和诱骗面板统一尺寸 */
  .target-panel-bottom.interference-panel,
  .target-panel-bottom.deception-panel {
    width: 252px !important; /* 强制保持统一尺寸 */
    height: 440px !important; /* 强制保持统一尺寸 */
    left: 75px !important; /* 强制保持左侧定位 */
    right: auto !important; /* 覆盖响应式设计的 right 属性 */
  }

  /* 仅影响右侧目标信息面板 */
  .target-panel-bottom:not(.interference-panel):not(.deception-panel) {
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

/* 底部居中按钮组 */
.bottom-center-buttons {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 15px;
  z-index: 100; /* 低于左侧悬浮框，避免遮蔽 */
  align-items: center; /* 垂直居中对齐 */
}

/* 按钮包装器 - 用于定位菜单 */
.bottom-btn-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 底部按钮样式 */
.bottom-btn {
  width: 84px;
  height: 32px;
  border-radius: 0; /* 无边框圆角 */
  background-color: transparent; /* 透明背景色 */
  background-image: url('/backgrounds/按钮(默认).png'); /* 背景图片 */
  background-size: 100% 100%; /* 完全填充 */
  background-position: center;
  background-repeat: no-repeat;
  border: none; /* 无边框 */
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: #ffffff;
  appearance: none; /* 移除浏览器默认样式 */
  -webkit-appearance: none; /* 移除Safari/Chrome默认样式 */
  -moz-appearance: none; /* 移除Firefox默认样式 */
}

.bottom-btn:hover {
  transform: translateY(-3px);
}

.bottom-btn.active {
  background-color: transparent; /* 透明背景色 */
  background-image: url('/backgrounds/按钮(选中状态).png'); /* 选中状态背景图片 */
  transform: translateY(-1px);
}

.bottom-btn-text {
  color: #ffffff;
  font-size: 12px;
  font-weight: bold;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

/* 二级菜单通用样式 */
.sub-menu {
  position: absolute;
  bottom: 42px; /* 在按钮上方：32px按钮高度 + 10px间距 */
  left: 50%;
  transform: translateX(-50%);
  background: #064775; /* 深蓝色背景 */
  border: none; /* 无边框 */
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 310; /* 高于按钮 */
  min-width: 160px;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* 菜单项样式 */
.sub-menu-item {
  padding: 12px 16px;
  color: #ffffff; /* 白色文字以适应深色背景 */
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2); /* 半透明白色分隔线 */
}

.sub-menu-item:last-child {
  border-bottom: none;
}

.sub-menu-item:hover {
  background: rgba(255, 255, 255, 0.15); /* 悬停时半透明白色背景 */
  color: #ffffff;
  padding-left: 20px; /* 悬停时向右移动 */
}

.sub-menu-item:active {
  background: rgba(255, 255, 255, 0.25); /* 点击时更深一点的背景 */
}
</style>
