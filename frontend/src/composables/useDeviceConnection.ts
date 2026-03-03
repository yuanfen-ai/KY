import { ref } from 'vue';
import { useWebSocket } from './useWebSocket';
import type { Device } from '@/types';

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
    onMessage: (data) => {
      console.log('收到消息:', data);
      
      // 处理设备数据
      if (data.type === 'deviceData') {
        deviceStatus.value.set(data.deviceId, data.data);
      }
      
      // 处理设备响应
      if (data.type === 'deviceResponse') {
        lastResponse.value = data;
      }

      // 处理设备列表
      if (data.type === 'deviceList') {
        devices.value = data.devices;
      }
    },
    onError: (error) => {
      console.error('WebSocket错误:', error);
    }
  });

  // 订阅设备数据
  const subscribeDevice = (deviceId: string) => {
    ws.send({
      type: 'subscribe',
      deviceId,
      timestamp: Date.now()
    });
  };

  // 取消订阅
  const unsubscribeDevice = (deviceId: string) => {
    ws.send({
      type: 'unsubscribe',
      deviceId,
      timestamp: Date.now()
    });
  };

  // 发送设备指令
  const sendCommand = (deviceId: string, command: string, params: any = {}) => {
    ws.send({
      type: 'command',
      deviceId,
      data: {
        command,
        params
      },
      timestamp: Date.now()
    });
  };

  // 获取设备列表
  const getDeviceList = () => {
    ws.send({
      type: 'getDeviceList',
      timestamp: Date.now()
    });
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
