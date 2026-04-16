<template>
  <svg class="signal-icon" viewBox="0 0 22 16" width="22" height="16">
    <!-- 4根信号柱，从左到右递增 -->
    <rect v-for="(bar, idx) in bars" :key="idx"
      :x="idx * 5.5" :y="16 - bar.height" width="4" :height="bar.height" rx="1"
      :fill="idx < strength ? activeColor : inactiveColor" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  /** 信号强度 1-弱 2-中 3-强 4-满格 */
  strength?: number;
}

const props = withDefaults(defineProps<Props>(), {
  strength: 4,
});

// 4根柱子的高度
const bars = [
  { height: 4 },   // 最矮
  { height: 7 },
  { height: 11 },
  { height: 16 },  // 最高
];

const activeColor = '#4CAF50';
const inactiveColor = 'rgba(255,255,255,0.25)';
</script>

<style scoped>
.signal-icon {
  flex-shrink: 0;
}
</style>
