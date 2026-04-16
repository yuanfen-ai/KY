<template>
  <div class="page-wrapper">
    <div class="page-container">
      <!-- 顶部状态栏 -->
      <div class="status-bar">
        <div class="device-name">{{ deviceName }}</div>
        <div class="status-items">
          <!-- 通信信号 -->
          <div class="status-item">
            <SignalIcon :strength="deviceSignal" />
            <span>{{ networkTypeLabel }}</span>
          </div>
          <!-- 时间 -->
          <div class="status-item">
            <span class="time">{{ currentTime }}</span>
          </div>
          <!-- 电量 -->
          <div class="status-item">
            <BatteryIcon :level="deviceBattery" :status="deviceBatteryStatus" />
            <span :class="{ 'low-battery': deviceBatteryStatus === 2 }">{{ deviceBattery }}%</span>
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useDeviceStatus, registerDeviceStatusHandlers, unregisterDeviceStatusHandlers } from '@/composables/useDeviceStatus';
import { BatteryStatus, NetworkType } from '@/models/models';
import BatteryIcon from './BatteryIcon.vue';
import SignalIcon from './SignalIcon.vue';

interface Props {
  deviceName?: string;
}

withDefaults(defineProps<Props>(), {
  deviceName: '手持式察打一体枪',
});

// 从全局状态获取电量和信号
const { batteryLevel, batteryStatus, signalStrength, networkType } = useDeviceStatus();

const deviceBattery = computed(() => batteryLevel.value);
const deviceBatteryStatus = computed(() => batteryStatus.value);
const deviceSignal = computed(() => signalStrength.value);

const networkTypeLabel = computed(() => {
  switch (networkType.value) {
    case NetworkType.WIRED: return '有线';
    case NetworkType.WIFI: return 'WiFi';
    case NetworkType.CELLULAR: return '4G/5G';
    default: return '4G/5G';
  }
});

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

onMounted(() => {
  updateTime();
  timeInterval = window.setInterval(updateTime, 1000);
  // 注册电量/信号处理器
  registerDeviceStatusHandlers();
});

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval);
  }
  // 注销电量/信号处理器
  unregisterDeviceStatusHandlers();
});
</script>

<style scoped>
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

.page-container {
  width: 100%;
  max-width: 800px;
  height: 100%;
  max-height: 480px;
  background: #1a1a2e;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

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

.status-item .time {
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.low-battery {
  color: #ff4444;
}

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #031632;
  border-top: none !important;
  overflow: hidden;
}
</style>
