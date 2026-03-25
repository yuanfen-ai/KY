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

      <!-- 内容区域 -->
      <div class="content-area">
        <!-- 标题栏 -->
        <div class="header-bar">
          <div class="header-left">
            <button v-if="showBackButton" class="back-btn" @click="handleBack">
              <span class="back-icon">←</span>
            </button>
          </div>
          <div class="header-title">{{ title }}</div>
          <div class="header-right">
            <slot name="header-right"></slot>
          </div>
        </div>

        <!-- 内容插槽 -->
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';

interface Props {
  title?: string;
  deviceName?: string;
  networkType?: string;
  batteryLevel?: number;
  showBackButton?: boolean;
  backPath?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: '页面标题',
  deviceName: '手持式察打一体枪',
  networkType: '4G/5G',
  batteryLevel: 100,
  showBackButton: true,
  backPath: undefined
});

const router = useRouter();
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

// 返回操作
const handleBack = () => {
  if (props.backPath) {
    router.push(props.backPath);
  } else {
    router.back();
  }
};

// 发出返回事件
const emit = defineEmits<{
  (e: 'back'): void;
}>();

const handleBackClick = () => {
  emit('back');
  handleBack();
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
  align-items: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  overflow: hidden;
}

/* 主容器 - 16:10比例 */
.page-container {
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
  background: rgba(6, 71, 117, 0.95);
  height: 32px;
  padding: 0 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.device-name {
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
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
  font-size: 13px;
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
  background: #031632;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* 顶部标题栏 */
.header-bar {
  background: rgba(6, 71, 117, 0.8);
  height: 40px;
  padding: 0 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
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
</style>
