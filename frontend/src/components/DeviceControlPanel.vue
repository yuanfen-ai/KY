<template>
  <div class="device-control-panel">
    <el-card v-if="device">
      <template #header>
        <div class="card-header">
          <span>{{ device.device_name }}</span>
          <el-tag :type="getStatusType(device.status)" size="small">
            {{ getStatusText(device.status) }}
          </el-tag>
        </div>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="设备ID">{{ device.device_id }}</el-descriptions-item>
        <el-descriptions-item label="设备类型">{{ device.device_type }}</el-descriptions-item>
        <el-descriptions-item label="TCP地址">{{ device.tcp_host }}</el-descriptions-item>
        <el-descriptions-item label="TCP端口">{{ device.tcp_port }}</el-descriptions-item>
        <el-descriptions-item label="最后心跳">
          {{ device.last_heartbeat ? formatDate(device.last_heartbeat) : '从未' }}
        </el-descriptions-item>
      </el-descriptions>

      <el-divider />

      <div class="control-section">
        <h4>发送指令</h4>
        <el-form :model="commandForm" label-width="100px">
          <el-form-item label="指令类型">
            <el-select v-model="commandForm.command" placeholder="请选择指令">
              <el-option label="启动" value="START" />
              <el-option label="停止" value="STOP" />
              <el-option label="重置" value="RESET" />
              <el-option label="获取状态" value="GET_STATUS" />
            </el-select>
          </el-form-item>
          <el-form-item label="参数">
            <el-input
              v-model="commandForm.params"
              type="textarea"
              :rows="3"
              placeholder="JSON格式的参数，例如: {&quot;speed&quot;: 100}"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="sendCommand" :loading="sending">
              发送指令
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-divider />

      <div v-if="lastResponse" class="response-section">
        <h4>设备响应</h4>
        <el-alert
          :title="lastResponse.status === 'success' ? '成功' : '失败'"
          :type="lastResponse.status === 'success' ? 'success' : 'error'"
          :description="JSON.stringify(lastResponse.result || lastResponse.message, null, 2)"
          :closable="false"
        />
      </div>

      <div class="realtime-data">
        <h4>实时数据</h4>
        <el-empty v-if="!realtimeData" description="暂无数据" />
        <pre v-else class="data-display">{{ JSON.stringify(realtimeData, null, 2) }}</pre>
      </div>
    </el-card>

    <el-empty v-else description="请选择设备" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Device } from '@/types';
import { ElMessage } from 'element-plus';

interface Props {
  device: Device | null;
  realtimeData?: any;
  lastResponse?: any;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  sendCommand: [deviceId: string, command: string, params: any];
}>();

const commandForm = ref({
  command: 'GET_STATUS',
  params: ''
});
const sending = ref(false);

const getStatusType = (status: string) => {
  switch (status) {
    case 'online': return 'success';
    case 'offline': return 'info';
    case 'error': return 'danger';
    default: return 'warning';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'online': return '在线';
    case 'offline': return '离线';
    case 'error': return '异常';
    default: return '未知';
  }
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN');
};

const sendCommand = async () => {
  if (!props.device) return;

  try {
    sending.value = true;
    
    const params = commandForm.value.params 
      ? JSON.parse(commandForm.value.params)
      : {};

    emit('sendCommand', props.device.device_id, commandForm.value.command, params);
    
    ElMessage.success('指令已发送');
  } catch (error: any) {
    ElMessage.error('参数格式错误: ' + error.message);
  } finally {
    sending.value = false;
  }
};

watch(() => props.device, () => {
  commandForm.value.command = 'GET_STATUS';
  commandForm.value.params = '';
});
</script>

<style scoped>
.device-control-panel {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.control-section,
.response-section,
.realtime-data {
  margin-top: 16px;
}

.control-section h4,
.response-section h4,
.realtime-data h4 {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 500;
}

.data-display {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  overflow: auto;
  max-height: 200px;
  font-size: 12px;
}
</style>
