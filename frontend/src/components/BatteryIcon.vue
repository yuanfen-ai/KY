<template>
  <svg class="battery-icon" viewBox="0 0 28 14" width="28" height="14">
    <!-- 电池外壳 -->
    <rect x="0.5" y="1" width="23" height="12" rx="2" ry="2"
      :stroke="shellColor" stroke-width="1.2" fill="none" />
    <!-- 电池正极凸起 -->
    <rect x="24" y="4" width="3" height="6" rx="1" ry="1"
      :fill="shellColor" />
    <!-- 电量填充 -->
    <rect v-if="level > 0" x="2" y="3" :width="fillWidth" height="8" rx="1" ry="1"
      :fill="fillColor" />
    <!-- 充电闪电符号 -->
    <path v-if="status === 3" d="M13 2 L10 7.5 L12.5 7.5 L11.5 12 L15 6.5 L12.5 6.5 Z"
      fill="#FFD700" stroke="#FFD700" stroke-width="0.5" stroke-linejoin="round" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { BatteryStatus } from '@/models/models';

interface Props {
  /** 电量百分比 0-100 */
  level?: number;
  /** 电池状态：1-正常 2-低电量 3-充电中 */
  status?: number;
}

const props = withDefaults(defineProps<Props>(), {
  level: 100,
  status: BatteryStatus.NORMAL,
});

// 电量填充宽度：最大 19px（外壳内部宽度 23 - 2*2 间距）
const fillWidth = computed(() => {
  const maxW = 19;
  return Math.max(1, Math.round(maxW * props.level / 100));
});

// 电池外壳颜色
const shellColor = computed(() => {
  if (props.status === BatteryStatus.LOW) return '#ff4444';
  return '#ffffff';
});

// 电量填充颜色
const fillColor = computed(() => {
  if (props.status === BatteryStatus.LOW) return '#ff4444';
  if (props.status === BatteryStatus.CHARGING) return '#4CAF50';
  if (props.level > 60) return '#4CAF50';
  if (props.level > 20) return '#FFC107';
  return '#ff4444';
});
</script>

<style scoped>
.battery-icon {
  flex-shrink: 0;
}
</style>
