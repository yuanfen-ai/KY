/**
 * 设备状态全局状态管理
 * 电量、信号等跨组件共享数据
 */
import { ref, readonly } from 'vue';
import type { DeviceBatteryReportData, DeviceSignalReportData } from '@/models/models';
import { BatteryStatus, NetworkType } from '@/models/models';

// ==================== 全局响应式状态 ====================

const batteryLevel = ref(100);
const batteryStatus = ref<BatteryStatus>(BatteryStatus.NORMAL);
const signalStrength = ref(4);
const networkType = ref<NetworkType>(NetworkType.WIRED);

// ==================== 更新方法 ====================

export function updateDeviceBattery(data: DeviceBatteryReportData) {
  batteryLevel.value = data.iBatteryLevel ?? 100;
  batteryStatus.value = data.iBatteryStatus ?? BatteryStatus.NORMAL;
}

export function updateDeviceSignal(data: DeviceSignalReportData) {
  signalStrength.value = data.iSignalStrength ?? 4;
  networkType.value = data.iNetworkType ?? NetworkType.WIRED;
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
