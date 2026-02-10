<template>
  <div class="dashboard">
    <!-- 顶部导航栏 -->
    <el-header class="header">
      <div class="header-left">
        <h1>KY 设备管理系统</h1>
        <ConnectionStatus
          :connection-state="connectionState"
          :reconnect-count="reconnectCount"
          :max-reconnect="5"
        />
      </div>
      <div class="header-right">
        <el-button @click="connect" v-if="!isConnected">连接服务器</el-button>
        <el-button @click="disconnect" v-else type="danger">断开连接</el-button>
      </div>
    </el-header>

    <!-- 主内容区 -->
    <el-main class="main-content">
      <el-row :gutter="20">
        <!-- 左侧设备列表 -->
        <el-col :span="8">
          <DeviceList
            :devices="devices"
            @refresh="refreshDevices"
            @select="handleSelectDevice"
          />
        </el-col>

        <!-- 右侧设备控制 -->
        <el-col :span="16">
          <DeviceControlPanel
            :device="selectedDevice"
            :realtime-data="deviceRealtimeData"
            :last-response="lastResponse"
            @send-command="handleSendCommand"
          />
        </el-col>
      </el-row>
    </el-main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useDeviceStore } from '@/stores/device';
import { useConnectionStore } from '@/stores/connection';
import { useDeviceConnection } from '@/composables/useDeviceConnection';
import ConnectionStatus from '@/components/ConnectionStatus.vue';
import DeviceList from '@/components/DeviceList.vue';
import DeviceControlPanel from '@/components/DeviceControlPanel.vue';
import { ElMessage } from 'element-plus';

const deviceStore = useDeviceStore();
const connectionStore = useConnectionStore();

const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000/ws';

const {
  connect: connectWs,
  disconnect: disconnectWs,
  isConnected,
  connectionState,
  reconnectCount,
  sendCommand,
  subscribeDevice,
  unsubscribeDevice,
  getDeviceList,
  getDeviceStatus
} = useDeviceConnection(wsUrl);

const selectedDeviceId = ref<string | null>(null);
const deviceRealtimeData = ref<any>(null);
const lastResponse = ref<any>(null);

const devices = computed(() => deviceStore.devices);
const selectedDevice = computed(() => {
  if (!selectedDeviceId.value) return null;
  return deviceStore.devices.find(d => d.device_id === selectedDeviceId.value) || null;
});

// 连接服务器
const connect = () => {
  connectWs();
};

// 断开连接
const disconnect = () => {
  disconnectWs();
};

// 刷新设备列表
const refreshDevices = () => {
  getDeviceList();
};

// 选择设备
const handleSelectDevice = (deviceId: string) => {
  // 取消之前的订阅
  if (selectedDeviceId.value) {
    unsubscribeDevice(selectedDeviceId.value);
  }

  selectedDeviceId.value = deviceId;

  // 订阅新设备
  subscribeDevice(deviceId);

  // 获取设备当前状态
  const status = getDeviceStatus(deviceId);
  if (status) {
    deviceRealtimeData.value = status;
  }
};

// 发送指令
const handleSendCommand = (deviceId: string, command: string, params: any) => {
  sendCommand(deviceId, command, params);
};

// 监听设备数据更新
useDeviceConnection(wsUrl).on('deviceData', (data: any) => {
  if (data.deviceId === selectedDeviceId.value) {
    deviceRealtimeData.value = data.data;
  }
});

// 监听设备响应
useDeviceConnection(wsUrl).on('deviceResponse', (data: any) => {
  if (data.deviceId === selectedDeviceId.value) {
    lastResponse.value = data;
  }
});

// 更新连接状态
useDeviceConnection(wsUrl).on('connected', () => {
  connectionStore.setConnected(true);
  connectionStore.setConnectionState('OPEN');
  ElMessage.success('服务器连接成功');
});

useDeviceConnection(wsUrl).on('disconnected', () => {
  connectionStore.setConnected(false);
  connectionStore.setConnectionState('CLOSED');
  ElMessage.warning('服务器连接断开');
});

onMounted(() => {
  // 自动连接
  connect();
});
</script>

<style scoped>
.dashboard {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
}

.header {
  background: white;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-left h1 {
  font-size: 20px;
  margin: 0;
  font-weight: 500;
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow: hidden;
}

.main-content .el-row {
  height: 100%;
}

.main-content .el-col {
  height: 100%;
}
</style>
