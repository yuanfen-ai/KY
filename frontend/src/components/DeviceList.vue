<template>
  <div class="device-list">
    <el-card class="list-card">
      <template #header>
        <div class="card-header">
          <span>设备列表</span>
          <el-button type="primary" size="small" @click="$emit('refresh')">刷新</el-button>
        </div>
      </template>

      <div v-if="devices.length === 0" class="empty-state">
        <el-empty description="暂无设备" />
      </div>

      <el-table v-else :data="devices" stripe style="width: 100%">
        <el-table-column prop="device_id" label="设备ID" width="150" />
        <el-table-column prop="device_name" label="设备名称" />
        <el-table-column prop="device_type" label="类型" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="last_heartbeat" label="最后心跳" width="180">
          <template #default="{ row }">
            {{ row.last_heartbeat ? formatDate(row.last_heartbeat) : '从未' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="$emit('select', row.device_id)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import type { Device } from '@/types';

defineProps<{
  devices: Device[];
}>();

defineEmits<{
  refresh: [];
  select: [deviceId: string];
}>();

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
</script>

<style scoped>
.device-list {
  height: 100%;
}

.list-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.list-card :deep(.el-card__body) {
  flex: 1;
  overflow: auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-state {
  padding: 40px 0;
}
</style>
