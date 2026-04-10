<template>
  <div class="page-wrapper">
    <div class="page-container">
      <!-- 顶部状态栏 -->
      <div class="status-bar">
        <div class="device-name">{{ deviceName }}</div>
        <div class="status-items">
          <div class="status-item">
            <span class="icon">📶</span>
            <span>{{ networkType }}</span>
          </div>
          <div class="status-item">
            <span class="time">{{ currentTime }}</span>
          </div>
          <div class="status-item">
            <span class="icon">🔋</span>
            <span>{{ batteryLevel }}%</span>
          </div>
        </div>
      </div>

      <!-- 内容区域 - 由调用方自定义内容 -->
      <div class="content-area">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

interface Props {
  deviceName?: string;
  networkType?: string;
  batteryLevel?: number;
}

withDefaults(defineProps<Props>(), {
  deviceName: '手持式察打一体枪',
  networkType: '4G/5G',
  batteryLevel: 100
});

const currentTime = ref('');
let timeInterval: number | null = null;

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

onMounted(() => {
  updateTime();
  timeInterval = window.setInterval(updateTime, 1000);
});

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval);
  }
});
</script>

<style scoped>
/* 页面包装器 */
.page-wrapper {
  width: 100vw;
  height: 100vh;
  background: #0f0f1a;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  overflow-y: auto;
}

/* 主容器 - 16:10比例 */
.page-container {
  width: 100%;
  max-width: 800px;
  height: 100%;
  max-height: 600px;
  background: #1a1a2e;
  display: flex;
  flex-direction: column;
  overflow: visible;
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
  background: #031632;
  border-top: none !important;
  overflow: visible;
}
</style>
