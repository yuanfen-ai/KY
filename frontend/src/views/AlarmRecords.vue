<template>
  <div class="alarm-records">
    <!-- 查询筛选区域 -->
    <div class="filter-section">
      <div class="filter-row">
        <div class="filter-item">
          <label>SN码</label>
          <input v-model="searchSN" type="text" placeholder="请输入SN码" />
        </div>
        <div class="filter-item">
          <label>开始时间</label>
          <input v-model="startTime" type="datetime-local" />
        </div>
        <div class="filter-item">
          <label>结束时间</label>
          <input v-model="endTime" type="datetime-local" />
        </div>
        <button class="query-btn" @click="handleQuery">查询</button>
      </div>
    </div>

    <!-- 告警卡片列表 -->
    <div class="card-list" v-if="records.length > 0">
      <div class="card-item" v-for="(record, index) in records" :key="record.id">
        <div class="card-header">
          <span class="card-index">{{ (currentPage - 1) * pageSize + index + 1 }}</span>
          <span class="card-sn">SN: {{ record.sn }}</span>
          <span class="card-model">型号: {{ record.model }}</span>
          <span class="card-status active">告警</span>
        </div>
        <div class="card-body">
          <div class="card-time">
            <span>{{ formatDisplayTime(record.startTime) }}</span>
            <span class="time-arrow">→</span>
            <span>{{ formatDisplayTime(record.endTime) }}</span>
          </div>
        </div>
        <div class="card-actions">
          <button class="action-btn delete-btn" @click="handleDelete(record)">删除</button>
          <button class="action-btn replay-btn" @click="handleReplay(record)">回放</button>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination" v-if="total > pageSize">
        <button @click="prevPage" :disabled="currentPage === 1">上一页</button>
        <span>{{ currentPage }} / {{ totalPages }}</span>
        <button @click="nextPage" :disabled="currentPage === totalPages">下一页</button>
      </div>
    </div>

    <!-- 空状态 -->
    <div class="empty-state" v-if="!loading && records.length === 0 && hasSearched">
      <p>暂无告警记录数据</p>
    </div>

    <!-- 加载状态 -->
    <div class="loading-state" v-if="loading">
      <p>加载中...</p>
    </div>

    <!-- 回放弹窗 -->
    <AlarmPlayback
      v-if="showPlayback"
      :recordId="currentReplayId"
      @close="showPlayback = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { messageHandler } from '@/utils/MessageHandler';
import { MessageCode } from '@/utils/MessageHandler';
import {
  type AlarmRecordQueryData,
  type AlarmRecordQueryResponseData,
  type AlarmRecordDeleteData,
  type AlarmRecordDeleteResponseData,
} from '@/models/models';
import { showTopToast } from '@/utils/toastMessage';
import { formatDisplayTime } from '@/utils/timeUtils';
import AlarmPlayback from './AlarmPlayback.vue';

// 搜索条件
const searchSN = ref('');
const startTime = ref('');
const endTime = ref('');

// 列表数据
const records = ref<any[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = 10;
const loading = ref(false);
const hasSearched = ref(false);

// 回放弹窗
const showPlayback = ref(false);
const currentReplayId = ref<number | string>(0);

// 计算总页数
const totalPages = computed(() => Math.ceil(total.value / pageSize));

// 查询记录
const handleQuery = async () => {
  if (!startTime.value || !endTime.value) {
    showTopToast('请选择查询时间范围');
    return;
  }

  loading.value = true;
  hasSearched.value = true;

  const requestData: AlarmRecordQueryData = {
    sn: searchSN.value || undefined,
    startTime: startTime.value.replace('T', ' ') + ':00',
    endTime: endTime.value.replace('T', ' ') + ':59',
    page: currentPage.value,
    pageSize: pageSize,
  };

  try {
    await messageHandler.sendRequest(
      MessageCode.ALARM_RECORD_QUERY,
      requestData,
      10000,
      'db'
    );
  } catch (error) {
    console.error('[AlarmRecords] 查询失败:', error);
    showTopToast('查询失败，请重试');
    loading.value = false;
  }
};

// 处理查询响应
const handleAlarmRecordQueryResponse = (data: AlarmRecordQueryResponseData) => {
  loading.value = false;

  if (!data.success) {
    showTopToast(data.message || '查询失败');
    return;
  }

  records.value = data.data || [];
  total.value = data.total || 0;
  currentPage.value = data.page || 1;
};

// 删除记录
const handleDelete = async (record: any) => {
  const deleteData: AlarmRecordDeleteData = {
    id: record.id,
  };

  try {
    await messageHandler.sendRequest(
      MessageCode.ALARM_RECORD_DELETE,
      deleteData,
      10000,
      'db'
    );
  } catch (error) {
    console.error('[AlarmRecords] 删除失败:', error);
    showTopToast('删除请求发送失败');
  }
};

// 处理删除响应
const handleAlarmRecordDeleteResponse = (data: AlarmRecordDeleteResponseData) => {
  if (data.success) {
    // 重新查询刷新列表
    handleQuery();
  } else {
    showTopToast(data.message || '删除失败');
  }
};

// 回放
const handleReplay = (record: any) => {
  currentReplayId.value = record.id;
  showPlayback.value = true;
};

// 分页
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    handleQuery();
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    handleQuery();
  }
};

// 注册处理器
onMounted(() => {
  messageHandler.setAlarmRecordHandlers({
    onAlarmRecordQueryResponse: handleAlarmRecordQueryResponse,
    onAlarmRecordDeleteResponse: handleAlarmRecordDeleteResponse,
  });
});

onUnmounted(() => {
  messageHandler.setAlarmRecordHandlers({
    onAlarmRecordQueryResponse: undefined,
    onAlarmRecordDeleteResponse: undefined,
  });
});
</script>

<style scoped>
.alarm-records {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.filter-section {
  background: rgba(10, 25, 50, 0.8);
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 16px;
  border: 1px solid rgba(64, 158, 255, 0.2);
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-item label {
  font-size: 12px;
  color: #8ba3c7;
}

.filter-item input {
  background: rgba(16, 32, 56, 0.9);
  border: 1px solid rgba(64, 158, 255, 0.3);
  border-radius: 4px;
  color: #e0e8f0;
  padding: 6px 12px;
  font-size: 13px;
  outline: none;
  width: 200px;
}

.filter-item input:focus {
  border-color: #409eff;
}

.query-btn {
  background: linear-gradient(135deg, #409eff, #337ecc);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 24px;
  font-size: 13px;
  cursor: pointer;
  margin-top: auto;
  transition: all 0.3s ease;
}

.query-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  flex: 1;
}

.card-item {
  background: linear-gradient(135deg, rgba(15, 30, 55, 0.95), rgba(20, 40, 70, 0.9));
  border: 1px solid rgba(64, 158, 255, 0.2);
  border-radius: 8px;
  padding: 14px 18px;
  transition: all 0.3s ease;
}

.card-item:hover {
  border-color: rgba(64, 158, 255, 0.5);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.card-index {
  background: rgba(64, 158, 255, 0.2);
  color: #409eff;
  font-weight: bold;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  min-width: 28px;
  text-align: center;
}

.card-sn {
  color: #e0e8f0;
  font-size: 14px;
  font-weight: 500;
}

.card-model {
  color: #8ba3c7;
  font-size: 12px;
}

.card-status {
  margin-left: auto;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
}

.card-status.active {
  background: rgba(245, 108, 108, 0.2);
  color: #f56c6c;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.card-body {
  margin-bottom: 10px;
}

.card-time {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #a0b4cc;
  font-size: 13px;
}

.time-arrow {
  color: #409eff;
}

.card-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.action-btn {
  padding: 5px 14px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  border: none;
  transition: all 0.3s ease;
}

.delete-btn {
  background: rgba(245, 108, 108, 0.15);
  color: #f56c6c;
  border: 1px solid rgba(245, 108, 108, 0.3);
}

.delete-btn:hover {
  background: rgba(245, 108, 108, 0.3);
  transform: scale(1.05);
}

.replay-btn {
  background: rgba(103, 194, 58, 0.15);
  color: #67c23a;
  border: 1px solid rgba(103, 194, 58, 0.3);
}

.replay-btn:hover {
  background: rgba(103, 194, 58, 0.3);
  transform: scale(1.05);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(64, 158, 255, 0.1);
}

.pagination button {
  background: rgba(64, 158, 255, 0.15);
  color: #409eff;
  border: 1px solid rgba(64, 158, 255, 0.3);
  border-radius: 4px;
  padding: 4px 14px;
  font-size: 12px;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination span {
  color: #8ba3c7;
  font-size: 13px;
}

.empty-state,
.loading-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #606266;
  font-size: 14px;
}
</style>
