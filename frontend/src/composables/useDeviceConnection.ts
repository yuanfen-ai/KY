import { ref } from 'vue';
import { useWebSocket } from './useWebSocket';
import { MessageCode, createWsPacket } from '@/types';
import type { Device, WsPacket } from '@/types';

export function useDeviceConnection(wsUrl: string) {
  const deviceStatus = ref<Map<string, any>>(new Map());
  const lastResponse = ref<any>(null);
  const devices = ref<Device[]>([]);

  const ws = useWebSocket({
    url: wsUrl,
    reconnectAttempts: 5,
    reconnectInterval: 3000,
    heartbeatInterval: 30000,
    onConnected: () => {
      console.log('WebSocket已连接');
      // 连接成功后获取设备列表
      getDeviceList();
    },
    onDisconnected: () => {
      console.log('WebSocket已断开');
    },
    onMessage: (data: WsPacket) => {
      console.log('收到消息:', data);
      const iCode = data.iCode;
      
      // 处理设备数据
      if (iCode === String(MessageCode.DEVICE_DATA)) {
        deviceStatus.value.set(data.iSelfData?.deviceId, data.iSelfData?.data);
      }
      
      // 处理设备响应
      if (iCode === String(MessageCode.COMMAND_RESPONSE)) {
        lastResponse.value = data;
      }

      // 处理设备列表
      if (iCode === String(MessageCode.DEVICE_LIST)) {
        devices.value = data.iSelfData || [];
      }
    },
    onError: (error: Event) => {
      console.error('WebSocket错误:', error);
    }
  });

  // 订阅设备数据
  const subscribeDevice = (deviceId: string) => {
    ws.send(createWsPacket(String(MessageCode.DEVICE_SUBSCRIBE), {
      deviceId,
      action: 'subscribe',
      timestamp: Date.now()
    }));
  };

  // 取消订阅
  const unsubscribeDevice = (deviceId: string) => {
    ws.send(createWsPacket(String(MessageCode.DEVICE_UNSUBSCRIBE), {
      deviceId,
      action: 'unsubscribe',
      timestamp: Date.now()
    }));
  };

  // 发送设备指令
  const sendCommand = (deviceId: string, command: string, params: any = {}) => {
    ws.send(createWsPacket(String(MessageCode.COMMAND_DEVICE_CONTROL), {
      deviceId,
      command,
      params,
      timestamp: Date.now()
    }));
  };

  // 获取设备列表
  const getDeviceList = () => {
    ws.send(createWsPacket(String(MessageCode.QUERY_DEVICE_LIST), {
      timestamp: Date.now()
    }));
  };

  // 获取设备状态
  const getDeviceStatus = (deviceId: string): any => {
    return deviceStatus.value.get(deviceId);
  };

  return {
    ...ws,
    disconnect: ws.close,  // 添加 disconnect 别名
    deviceStatus,
    lastResponse,
    devices,
    subscribeDevice,
    unsubscribeDevice,
    sendCommand,
    getDeviceList,
    getDeviceStatus
  };
}
