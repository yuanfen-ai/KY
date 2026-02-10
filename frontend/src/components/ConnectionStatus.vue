<template>
  <div class="connection-status" :class="stateClass">
    <div class="status-icon">
      <span v-if="connectionState === 'OPEN'" class="connected">●</span>
      <span v-else-if="connectionState === 'CONNECTING'" class="connecting">●</span>
      <span v-else class="disconnected">●</span>
    </div>
    <div class="status-text">
      {{ statusText }}
      <span v-if="connectionState !== 'OPEN' && reconnectCount > 0">
        (重连中 {{ reconnectCount }}/{{ maxReconnect }})
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  connectionState: string;
  reconnectCount: number;
  maxReconnect: number;
}

const props = defineProps<Props>();

const stateClass = computed(() => ({
  'status-connected': props.connectionState === 'OPEN',
  'status-connecting': props.connectionState === 'CONNECTING',
  'status-disconnected': props.connectionState === 'CLOSED'
}));

const statusText = computed(() => {
  switch (props.connectionState) {
    case 'OPEN': return '已连接';
    case 'CONNECTING': return '连接中';
    case 'CLOSED': return '已断开';
    default: return '未知';
  }
});
</script>

<style scoped>
.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
}

.status-connected {
  background: #e7f5e7;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.status-connecting {
  background: #fff7e6;
  color: #faad14;
  border: 1px solid #ffe58f;
}

.status-disconnected {
  background: #fff1f0;
  color: #f5222d;
  border: 1px solid #ffa39e;
}

.status-icon {
  font-size: 12px;
  line-height: 1;
}

.connected {
  animation: blink 2s infinite;
}

.connecting {
  animation: blink 0.5s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
