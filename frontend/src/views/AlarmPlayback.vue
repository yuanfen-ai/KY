<template>
  <PageTemplate>
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
  </PageTemplate>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import PageTemplate from '@/components/PageTemplate.vue';
import { MAP_CONFIG } from '@/config';
import { useMap } from '@/composables/useMap';

interface Props {
  recordData?: {
    id: string;
    snCode: string;
    model: string;
    discoveryTime: string;
    endTime: string;
  };
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

// ========================================
// 地图
// ========================================
const mapIframeRef = ref<HTMLIFrameElement | null>(null);
const mapServiceUrl = MAP_CONFIG.ENABLED ? MAP_CONFIG.MAP_URL : '';

const {
  initMap,
  setCallbacks,
  destroy: destroyMap,
  parseLocation
} = useMap(mapIframeRef);

// ========================================
// 地图事件处理
// ========================================

const onMapIframeLoad = () => {
  console.log('[AlarmPlayback] 地图 iframe 加载完成');

  // 使用 nextTick 确保 DOM 更新完成
  nextTick(() => {
    setCallbacks({
      loadComplete: () => {
        console.log('[AlarmPlayback] 地图加载完成');
      },
      mouseLocation: (locationStr: string) => {
        const coords = parseLocation(locationStr);
        if (coords) {
          // 鼠标位置信息
        }
      }
    });

    initMap();
  });
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
  console.log('[AlarmPlayback] 组件加载，记录数据:', props.recordData);
  console.log('[AlarmPlayback] 地图服务URL:', mapServiceUrl);
});

onUnmounted(() => {
  destroyMap();
  console.log('[AlarmPlayback] 组件卸载');
});
</script>

<style scoped>
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
