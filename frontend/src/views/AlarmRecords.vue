<template>
  <PageTemplate>
    <!-- 标题栏 -->
    <div class="header-bar">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <span class="back-icon">←</span>
        </button>
      </div>
      <div class="header-title">告警记录</div>
      <div class="header-right"></div>
    </div>

    <!-- 查询筛选区域 -->
    <div class="filter-area">
      <div class="filter-item">
        <label class="filter-label">SN码</label>
        <input
          v-model="snCode"
          type="text"
          class="sn-input"
          placeholder="请输入SN码"
        />
      </div>
      <div class="filter-item">
        <label class="filter-label">生效时间</label>
        <DateTimePicker
          v-model:start-date-time="startDateTime"
          v-model:end-date-time="endDateTime"
          start-placeholder="选择开始时间"
          end-placeholder="选择结束时间"
        />
      </div>
      <button class="query-btn" @click="handleQuery">查询</button>
    </div>

    <!-- 告警卡片列表区域 -->
    <div class="records-area">
      <div class="records-grid">
        <div
          v-for="record in paginatedRecords"
          :key="record.id"
          class="alarm-card"
        >
          <!-- 卡片头部操作按钮 -->
          <div class="card-actions">
            <button class="action-btn" @click="handleViewDetail(record)" title="视频回放">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            </button>
            <button class="action-btn delete" @click="handleDelete(record.id)" title="删除">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>

          <!-- 卡片内容 -->
          <div class="card-content">
            <div class="card-row">
              <span class="card-label">SN码:</span>
              <span class="card-value">{{ record.snCode }}</span>
            </div>
            <div class="card-row">
              <span class="card-label">型号:</span>
              <span class="card-value">{{ record.model }}</span>
            </div>
            <div class="card-row">
              <span class="card-label">发现时间:</span>
              <span class="card-value">{{ record.discoveryTime }}</span>
            </div>
            <div class="card-row">
              <span class="card-label">结束时间:</span>
              <span class="card-value">{{ record.endTime }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页导航 -->
    <Pagination
      v-model:current-page="currentPage"
      :total-records="totalRecords"
      :page-size="pageSize"
      @page-change="handlePageChange"
    />

    <!-- 告警回放界面弹窗 -->
    <div v-if="showPlayback" class="playback-overlay">
      <AlarmPlayback
        :record-data="selectedRecord"
        @close="closePlayback"
      />
    </div>
  </PageTemplate>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import PageTemplate from '@/components/PageTemplate.vue';
import DateTimePicker from '@/components/DateTimePicker.vue';
import Pagination from '@/components/Pagination.vue';
import AlarmPlayback from './AlarmPlayback.vue';
import { PAGINATION_CONFIG } from '@/config/index';
import { messageHandler, MessageCode } from '@/utils/MessageHandler';
import type {
  AlarmRecordItem,
  AlarmRecordQueryData,
  AlarmRecordQueryResponseData,
  AlarmRecordDeleteData,
  AlarmRecordDeleteResponseData
} from '@/models/models';
import { showTopToast } from '@/utils/toastMessage';
import { formatDisplayTime } from '@/utils/timeUtils';

const router = useRouter();

// 返回上一页
const goBack = () => {
  router.push('/main');
};

// 告警回放界面状态
const showPlayback = ref(false);
const selectedRecord = ref<any>(null);

// 查询筛选
const snCode = ref('');
const getTodayStartDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day} 00:00:00`;
};

const getTodayEndDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day} 23:59:59`;
};

const startDateTime = ref(getTodayStartDateTime());
const endDateTime = ref(getTodayEndDateTime());

// 服务端数据
const allRecords = ref<AlarmRecordItem[]>([]);
const totalRecords = ref(0);

// 分页相关数据
const currentPage = ref(1);
const pageSize = ref(PAGINATION_CONFIG.PAGE_SIZE);

// 计算当前页显示的数据
const paginatedRecords = computed(() => {
  return allRecords.value;
});

// 分页变化处理
const handlePageChange = (page: number) => {
  console.log('[AlarmRecords] 页码变化:', page);
  currentPage.value = page;
  queryRecords();
};

// 查询告警记录
const queryRecords = () => {
  const requestData: AlarmRecordQueryData = {
    sn: snCode.value || undefined,
    startTime: startDateTime.value,
    endTime: endDateTime.value,
    page: currentPage.value,
    pageSize: pageSize.value
  };
  messageHandler.send(MessageCode.ALARM_RECORD_QUERY, requestData, 'db');
};

// 查询处理 - 发送DB116指令
const handleQuery = () => {
  console.log('[AlarmRecords] 查询:', {
    snCode: snCode.value,
    startDateTime: startDateTime.value,
    endDateTime: endDateTime.value
  });
  // 查询后重置到第一页
  currentPage.value = 1;
  queryRecords();
};

// 查看详情 - 打开回放界面（传递id用于回放查询）
const handleViewDetail = (record: any) => {
  console.log('[AlarmRecords] 打开回放界面:', record);
  selectedRecord.value = record;
  showPlayback.value = true;
};

// 关闭回放界面
const closePlayback = () => {
  console.log('[AlarmRecords] 关闭回放界面');
  showPlayback.value = false;
  selectedRecord.value = null;
};

// 删除记录 - 发送DB118指令
const handleDelete = (id: string | number) => {
  console.log('[AlarmRecords] 删除记录:', id);
  const deleteData: AlarmRecordDeleteData = { id };
  messageHandler.send(MessageCode.ALARM_RECORD_DELETE, deleteData, 'db');
};

// ========================================
// MessageHandler 回调处理
// ========================================

// 查询结果回调 (DB016)
const onAlarmRecordQueryResponse = (data: AlarmRecordQueryResponseData) => {
  if (!data.success) {
    showTopToast(data.message || '查询失败');
    return;
  }
  // 字段映射：服务端字段 → 模板显示字段
  allRecords.value = (data.data || []).map((item: any) => ({
    ...item,
    snCode: item.sn,
    discoveryTime: formatDisplayTime(item.startTime),
    endTime: formatDisplayTime(item.endTime)
  }));
  totalRecords.value = data.total || 0;
};

// 删除结果回调 (DB018)
const onAlarmRecordDeleteResponse = (data: AlarmRecordDeleteResponseData) => {
  if (data.success) {
    showTopToast(data.message || '删除成功');
    // 删除成功后重新查询刷新列表
    queryRecords();
  } else {
    showTopToast(data.message || '删除失败');
  }
};

onMounted(() => {
  // 注册处理器
  messageHandler.setAlarmRecordHandlers({
    onQueryResponse: onAlarmRecordQueryResponse,
    onDeleteResponse: onAlarmRecordDeleteResponse
  });
  // 初始加载
  queryRecords();
});

onUnmounted(() => {
  // 注销处理器
  messageHandler.setAlarmRecordHandlers({
    onQueryResponse: undefined,
    onDeleteResponse: undefined
  });
});
</script>

<style scoped>
/* 标题栏 */
.header-bar {
  background: rgba(6, 71, 117, 0.8);
  height: 40px;
  padding: 0 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-left {
  width: 60px;
}

.back-btn {
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 24px;
  cursor: pointer;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.back-icon {
  font-size: 30px;
}

.header-title {
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  flex: 1;
}

.header-right {
  width: 60px;
}

/* 查询筛选区域 */
.filter-area {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: transparent;
  flex-shrink: 0;
  flex-wrap: nowrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  flex-shrink: 0;
  white-space: nowrap;
}

.sn-input {
  width: 120px;
  height: 28px;
  padding: 0 10px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: #ffffff;
  font-size: 13px;
  outline: none;
  transition: all 0.2s ease;
}

.sn-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.sn-input:focus {
  border-color: rgba(24, 144, 255, 0.6);
  background: rgba(255, 255, 255, 0.15);
}

.query-btn {
  padding: 0;
  margin-left: auto;
  width: 48px;
  height: 24px;
  background: url('/backgrounds/按钮3.png') no-repeat center center;
  background-size: 100% 100%;
  border: none;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  border-radius: 0;
}

.query-btn:hover {
  box-shadow: 0 0 15px rgba(24, 144, 255, 0.5);
}

.query-btn:active {
  box-shadow: 0 0 8px rgba(24, 144, 255, 0.8);
  opacity: 0.9;
}

/* 告警卡片列表区域 */
.records-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 10px;
  background: transparent;
}

.records-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding-bottom: 5px;
}

/* 告警卡片 */
.alarm-card {
  background: rgba(6, 71, 117, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  padding: 10px;
  position: relative;
  transition: all 0.2s ease;
}

.alarm-card:hover {
  background: rgba(6, 71, 117, 0.5);
  border-color: rgba(24, 144, 255, 0.4);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* 卡片操作按钮 */
.card-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 6px;
}

.action-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  padding: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.8);
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.action-btn.delete:hover {
  background: rgba(255, 77, 79, 0.3);
  border-color: rgba(255, 77, 79, 0.5);
  color: #ff4d4f;
}

/* 卡片内容 */
.card-content {
  padding-top: 4px;
}

.card-row {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.card-row:last-child {
  margin-bottom: 0;
}

.card-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  min-width: 60px;
  flex-shrink: 0;
}

.card-value {
  color: #ffffff;
  font-size: 12px;
  font-weight: 500;
}

/* 回放界面弹窗遮罩层 */
.playback-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background: #0f0f1a;
}
</style>
