import { ref, onUnmounted } from 'vue';
import type { Ref } from 'vue';
import WebSocketService from '@/utils/websocket';
import type { WebSocketConfig, WsPacket } from '@/types';

export function useWebSocket(config: WebSocketConfig) {
  const wsService = ref<WebSocketService | null>(null);
  const isConnected: Ref<boolean> = ref(false);
  const connectionState: Ref<string> = ref('CLOSED');
  const reconnectCount = ref(0);

  const connect = () => {
    wsService.value = new WebSocketService({
      ...config,
      onConnected: () => {
        isConnected.value = true;
        connectionState.value = 'OPEN';
        reconnectCount.value = 0;
        config.onConnected?.();
      },
      onDisconnected: () => {
        isConnected.value = false;
        connectionState.value = 'CLOSED';
        config.onDisconnected?.();
      },
      onMessage: (data: WsPacket) => {
        config.onMessage?.(data);
      },
      onError: (error: Event) => {
        config.onError?.(error);
      }
    });

    // 监听重连事件
    wsService.value.on('reconnectFailed', () => {
      reconnectCount.value = config.reconnectAttempts || 5;
    });

    wsService.value.on('disconnected', (event: CloseEvent) => {
      // 如果不是手动关闭，增加重连计数
      if (event.code !== 1000) {
        reconnectCount.value++;
      }
    });
  };

  const send = (packet: WsPacket) => {
    wsService.value?.send(packet);
  };

  const close = () => {
    wsService.value?.close();
    wsService.value = null;
  };

  const on = (event: string, handler: Function) => {
    wsService.value?.on(event, handler);
  };

  const off = (event: string, handler?: Function) => {
    wsService.value?.off(event, handler);
  };

  // 组件卸载时清理
  onUnmounted(() => {
    close();
  });

  return {
    connect,
    send,
    close,
    on,
    off,
    isConnected,
    connectionState,
    reconnectCount
  };
}
