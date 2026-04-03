<template>
  <!-- 全屏容器 -->
  <div class="playback-wrapper">
    <div class="playback-container">
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

      <!-- 内容区域 -->
      <div class="content-area">
        <!-- 标题栏 - 悬浮于地图之上 -->
        <div class="header-bar">
          <div class="header-left">
            <button class="back-btn" @click="goBack">
              <span class="back-icon">←</span>
            </button>
          </div>
          <div class="header-title">告警回放</div>
          <div class="header-right"></div>
        </div>

        <!-- 回放信息栏 - 悬浮于地图之上 -->
        <div class="info-bar">
          <div class="info-item">
            <span class="info-label">SN码:</span>
            <span class="info-value">{{ recordData?.snCode || '--' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">型号:</span>
            <span class="info-value">{{ recordData?.model || '--' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">发现时间:</span>
            <span class="info-value">{{ recordData?.discoveryTime || '--' }}</span>
          </div>
        </div>

        <!-- 地图显示区域 -->
        <div class="map-area">
          <div class="map-container">
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
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { MAP_CONFIG } from '@/config';
import { useMap } from '@/composables/useMap';

interface Props {
  recordData?: {
    id: string;
    snCode: string;
    model: string;
    discoveryTime: string;
    endTime: string;
    // 回放轨迹数据
    trackData?: {
      uavLng: number;
      uavLat: number;
      uavHeight: number;
      pilotLng?: number;
      pilotLat?: number;
    }[];
  };
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

// 版本标识
const CODE_VERSION = '2024-04-03-TARGET-MANAGEMENT';
console.log('[AlarmPlayback] 组件版本:', CODE_VERSION);

// ========================================
// 时间显示
// ========================================
const currentTime = ref('');
let timeInterval: number | null = null;

const updateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  currentTime.value = `${year}.${month}.${day} ${hours}:${minutes}`;
};

// ========================================
// 地图
// ========================================
const mapIframeRef = ref<HTMLIFrameElement | null>(null);
const mapServiceUrl = MAP_CONFIG.ENABLED ? MAP_CONFIG.MAP_URL : '';

const {
  initMap,
  setCallbacks,
  destroy: destroyMap,
  parseLocation,
  isMapReady,
  // 目标管理方法
  addOrUpdateUavTarget,
  addOrUpdatePilotTarget,
  addTargetsToQueue,
  resetTargets
} = useMap(mapIframeRef);

// ========================================
// 地图事件处理
// ========================================

const onMapIframeLoad = () => {
  console.log('[AlarmPlayback] 地图 iframe 加载完成');

  // 设置回调
  setCallbacks({
    loadComplete: () => {
      console.log('[AlarmPlayback] 🎯 地图加载完成 (loadComplete 回调触发)');
      
      // 重置目标状态
      resetTargets();
      
      // 如果有回放数据，将轨迹数据加入队列
      if (props.recordData?.trackData && props.recordData.trackData.length > 0) {
        const snCode = props.recordData.snCode;
        
        // 构造目标数据列表
        const targetDataList = props.recordData.trackData.map(track => ({
          sID: snCode,
          dbUavLng: track.uavLng,
          dbUavLat: track.uavLat,
          dbHeight: track.uavHeight,
          dbPoliteLng: track.pilotLng || 0,
          dbPoliteLat: track.pilotLat || 0
        }));
        
        // 批量添加到待处理队列
        addTargetsToQueue(targetDataList);
        console.log(`[AlarmPlayback] 已将 ${targetDataList.length} 个轨迹点加入待处理队列`);
      }
    },
    mouseLocation: (locationStr: string) => {
      const coords = parseLocation(locationStr);
      if (coords) {
        // 鼠标位置信息
      }
    }
  });

  initMap();
};

const onMapIframeError = () => {
  console.error('[AlarmPlayback] 地图 iframe 加载失败');
};

// 返回（关闭回放界面）
const goBack = () => {
  // 释放地图资源
  destroyMap();
  emit('close');
};

onMounted(() => {
  // 启动时间更新
  updateTime();
  timeInterval = window.setInterval(updateTime, 1000);
  
  console.log('[AlarmPlayback] 组件加载，记录数据:', props.recordData);
  console.log('[AlarmPlayback] 地图服务URL:', mapServiceUrl);
});

onUnmounted(() => {
  // 清除时间定时器
  if (timeInterval) {
    clearInterval(timeInterval);
  }
  // 释放地图资源
  destroyMap();
  console.log('[AlarmPlayback] 组件卸载');
});
</script>

<style scoped>
/* 全屏容器 */
.playback-wrapper {
  width: 100%;
  height: 100%;
  background: #0f0f1a;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  overflow: hidden;
}

/* 主容器 - 16:10比例 */
.playback-container {
  aspect-ratio: 16 / 10;
  width: 100%;
  max-width: 800px;
  max-height: 500px;
  height: auto;
  background: #1a1a2e;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* 顶部状态栏 */
.status-bar {
  background: rgba(3, 22, 50, 0.8);
  height: 24px;
  padding: 0 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(42, 42, 62, 0.5);
}

.device-name {
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
}

.status-items {
  display: flex;
  align-items: center;
  gap: 16px;
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

/* 内容区域 */
.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  background: #031632;
}

/* 标题栏 - 悬浮于地图之上 */
.header-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  background: rgba(6, 71, 117, 0.8);
  height: 40px;
  padding: 0 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-left {
  width: 60px;
}

.back-btn {
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 24px;
  cursor: pointer;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.back-icon {
  font-size: 20px;
}

.header-title {
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  flex: 1;
}

.header-right {
  width: 60px;
}

/* 回放信息栏 - 悬浮于地图之上 */
.info-bar {
  position: absolute;
  top: 40px;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 8px 16px;
  background: rgba(6, 71, 117, 0.4);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.info-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
}

.info-value {
  color: #ffffff;
  font-size: 13px;
  font-weight: 500;
}

/* 地图区域 */
.map-area {
  flex: 1;
  overflow: hidden;
  position: relative;
  height: 100%;
}

.map-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.map-iframe {
  width: 100%;
  height: 100%;
  border: none;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}
</style>
