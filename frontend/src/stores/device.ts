import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Device, Alert } from '@/types';

export const useDeviceStore = defineStore('device', () => {
  // 状态
  const devices = ref<Device[]>([]);
  const selectedDeviceId = ref<string | null>(null);
  const alerts = ref<Alert[]>([]);
  const loading = ref(false);

  // 计算属性
  const onlineDevices = computed(() => 
    devices.value.filter(d => d.status === 'online')
  );

  const offlineDevices = computed(() => 
    devices.value.filter(d => d.status === 'offline')
  );

  const errorDevices = computed(() => 
    devices.value.filter(d => d.status === 'error')
  );

  const selectedDevice = computed(() => 
    devices.value.find(d => d.device_id === selectedDeviceId.value) || null
  );

  // Actions
  const setDevices = (deviceList: Device[]) => {
    devices.value = deviceList;
  };

  const updateDevice = (deviceId: string, updates: Partial<Device>) => {
    const index = devices.value.findIndex(d => d.device_id === deviceId);
    if (index !== -1) {
      devices.value[index] = { ...devices.value[index], ...updates };
    }
  };

  const selectDevice = (deviceId: string | null) => {
    selectedDeviceId.value = deviceId;
  };

  const addAlert = (alert: Alert) => {
    alerts.value.unshift(alert);
  };

  const clearAlerts = () => {
    alerts.value = [];
  };

  return {
    // State
    devices,
    selectedDeviceId,
    alerts,
    loading,
    // Computed
    onlineDevices,
    offlineDevices,
    errorDevices,
    selectedDevice,
    // Actions
    setDevices,
    updateDevice,
    selectDevice,
    addAlert,
    clearAlerts
  };
});
