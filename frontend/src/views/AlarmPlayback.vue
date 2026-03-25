<template>
  <PageTemplate>
    <!-- 标题栏 -->
    <div class="header-bar">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <span class="back-icon">←</span>
        </button>
      </div>
      <div class="header-title">告警回放</div>
      <div class="header-right"></div>
    </div>

    <!-- 回放信息栏 -->
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

    <!-- 地图区域 -->
    <div class="map-area">
      <div class="map-container">
        <!-- 地图服务 iframe -->
        <iframe
          ref="mapIframeRef"
          :src="mapServiceUrl"
          class="map-iframe"
          frameborder="0"
          allowfullscreen
        ></iframe>
      </div>
    </div>
  </PageTemplate>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import PageTemplate from '@/components/PageTemplate.vue';
import { MAP_CONFIG } from '@/config';

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

// 地图相关
const mapIframeRef = ref<HTMLIFrameElement | null>(null);
const mapServiceUrl = MAP_CONFIG.ENABLED ? MAP_CONFIG.MAP_URL : '';

// 返回（关闭回放界面）
const goBack = () => {
  emit('close');
};

onMounted(() => {
  console.log('[AlarmPlayback] 组件加载，记录数据:', props.recordData);
});

onUnmounted(() => {
  console.log('[AlarmPlayback] 组件卸载');
});
</script>

<style scoped>
/* 标题栏 */
.header-bar {
  background: rgba(6, 71, 117, 0.8);
  height: 40px;
  padding: 0 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
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

/* 回放信息栏 */
.info-bar {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 8px 16px;
  background: rgba(6, 71, 117, 0.4);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
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
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.map-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.map-iframe {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
