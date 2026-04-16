/**
 * 设备状态全局状态管理
 * 电量、信号等跨组件共享数据
 * 
 * 自动注册 MessageHandler 处理器，无需在业务组件中手动绑定
 */
import { ref, readonly } from 'vue';
import type { DeviceBatteryReportData, DeviceSignalReportData } from '@/models/models';
import { BatteryStatus, NetworkType } from '@/models/models';
import { messageHandler } from '@/utils/MessageHandler';

// ==================== 全局响应式状态 ====================

const batteryLevel = ref(100);
const batteryStatus = ref<BatteryStatus>(BatteryStatus.NORMAL);
const signalStrength = ref(4);
const networkType = ref<NetworkType>(NetworkType.WIRED);

// ==================== 内部更新方法 ====================

function handleBatteryReport(data: DeviceBatteryReportData) {
  console.log('[DeviceStatus] 电量:', data.iBatteryLevel + '%, 状态:', data.iBatteryStatus);
  batteryLevel.value = data.iBatteryLevel ?? 100;
  batteryStatus.value = data.iBatteryStatus ?? BatteryStatus.NORMAL;
}

function handleSignalReport(data: DeviceSignalReportData) {
  console.log('[DeviceStatus] 信号: 强度=', data.iSignalStrength, ', 网络=', data.iNetworkType);
  signalStrength.value = data.iSignalStrength ?? 4;
  networkType.value = data.iNetworkType ?? NetworkType.WIRED;
}

// ==================== 注册/注销处理器 ====================

let registered = false;

/**
 * 注册电量和信号的 MessageHandler 处理器
 * 应在 PageTemplate.vue 的 onMounted 中调用
 */
export function registerDeviceStatusHandlers() {
  if (registered) return;
  messageHandler.setDeviceBatteryHandlers({ onDeviceBatteryReport: handleBatteryReport });
  messageHandler.setDeviceSignalHandlers({ onDeviceSignalReport: handleSignalReport });
  registered = true;
  console.log('[DeviceStatus] 处理器已注册');
}

/**
 * 注销电量和信号的处理器
 * 应在 PageTemplate.vue 的 onUnmounted 中调用
 */
export function unregisterDeviceStatusHandlers() {
  if (!registered) return;
  messageHandler.setDeviceBatteryHandlers({ onDeviceBatteryReport: undefined });
  messageHandler.setDeviceSignalHandlers({ onDeviceSignalReport: undefined });
  registered = false;
  console.log('[DeviceStatus] 处理器已注销');
}

// ==================== 只读访问 ====================

export function useDeviceStatus() {
  return {
    batteryLevel: readonly(batteryLevel),
    batteryStatus: readonly(batteryStatus),
    signalStrength: readonly(signalStrength),
    networkType: readonly(networkType),
  };
}
