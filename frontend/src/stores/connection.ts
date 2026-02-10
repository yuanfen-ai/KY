import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useConnectionStore = defineStore('connection', () => {
  const isConnected = ref(false);
  const connectionState = ref('CLOSED');
  const reconnectCount = ref(0);
  const maxReconnect = ref(5);

  const setConnected = (connected: boolean) => {
    isConnected.value = connected;
  };

  const setConnectionState = (state: string) => {
    connectionState.value = state;
  };

  const setReconnectCount = (count: number) => {
    reconnectCount.value = count;
  };

  const reset = () => {
    isConnected.value = false;
    connectionState.value = 'CLOSED';
    reconnectCount.value = 0;
  };

  return {
    isConnected,
    connectionState,
    reconnectCount,
    maxReconnect,
    setConnected,
    setConnectionState,
    setReconnectCount,
    reset
  };
});
