<template>
  <PageTemplate>
    <!-- 标题栏 -->
    <div class="header-bar">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <span class="back-icon">←</span>
        </button>
      </div>
      <div class="header-title">干扰操作记录</div>
      <div class="header-right"></div>
    </div>

    <!-- 查询筛选区域 -->
    <div class="filter-area">
      <div class="filter-label">日期选择</div>
      <DateTimePicker
        v-model:start-date-time="startDateTime"
        v-model:end-date-time="endDateTime"
        start-placeholder="选择开始时间"
        end-placeholder="选择结束时间"
      />
      <button class="query-btn" @click="handleQuery">查询</button>
    </div>

    <!-- 数据表格区域 -->
    <div class="table-area">
      <table class="records-table">
        <thead>
          <tr>
            <th>序号</th>
            <th>开启频段/GHz</th>
            <th>开启时间</th>
            <th>开启时长/s</th>
            <th>经纬度</th>
            <th>操作账号</th>
            <th>删除</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(record, index) in paginatedRecords" :key="record.id">
            <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td>{{ record.statestr }}</td>
            <td>{{ formatDisplayTime(record.startTime) }}</td>
            <td>{{ record.duration }}</td>
            <td>{{ record.lng }}; {{ record.lat }}</td>
            <td>{{ record.username }}</td>
            <td>
              <button class="delete-btn" @click="handleDelete(record.id)">
                🗑️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页导航 -->
    <Pagination
      v-model:current-page="currentPage"
      :total-records="totalRecords"
      :page-size="pageSize"
      @page-change="handlePageChange"
    />
  </PageTemplate>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import PageTemplate from '@/components/PageTemplate.vue';
import DateTimePicker from '@/components/DateTimePicker.vue';
import Pagination from '@/components/Pagination.vue';
import { PAGINATION_CONFIG } from '@/config/index';
import { messageHandler, MessageCode } from '@/utils/MessageHandler';
import { showTopToast } from '@/utils/toastMessage';
import { formatDisplayTime } from '@/utils/timeUtils';
import type { InterferenceRecordItem } from '@/models/models';

const router = useRouter();

// 返回上一页
const goBack = () => {
  router.push('/main');
};

// 查询筛选 - 默认值
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

// 干扰操作记录数据
const allRecords = ref<InterferenceRecordItem[]>([]);

// 分页相关数据
const currentPage = ref(1);
const pageSize = ref(PAGINATION_CONFIG.PAGE_SIZE);
const totalRecords = ref(0);

// 计算当前页显示的数据
const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return allRecords.value.slice(start, end);
});

// 分页变化处理
const handlePageChange = (page: number) => {
  console.log('[InterferenceRecords] 页码变化:', page);
  currentPage.value = page;
};

// 查询干扰操作记录
const queryRecords = (page?: number) => {
  const pageNum = page ?? currentPage.value;
  const requestData = {
    startTime: startDateTime.value,
    endTime: endDateTime.value,
    page: pageNum,
    pageSize: pageSize.value
  };
  messageHandler.send(MessageCode.INTERFERENCE_RECORD_QUERY, requestData, 'db');
  console.log('[InterferenceRecords] 查询请求已发送:', requestData);
};

const handleQuery = () => {
  console.log('[InterferenceRecords] 查询:', {
    startDateTime: startDateTime.value,
    endDateTime: endDateTime.value
  });
  currentPage.value = 1;
  queryRecords(1);
};

// 删除干扰操作记录
const handleDelete = (id: number) => {
  console.log('[InterferenceRecords] 删除记录:', id);
  const deleteData = {
    id: id
  };
  messageHandler.send(MessageCode.INTERFERENCE_RECORD_DELETE, deleteData, 'db');
  console.log('[InterferenceRecords] 删除请求已发送:', deleteData);
};

// ========================================
// 干扰操作记录消息处理器
// ========================================

// 查询响应处理
const handleInterferenceRecordQueryResponse = (data: any) => {
  console.log('[InterferenceRecords] 查询响应:', data);

  if (!data) {
    console.error('[InterferenceRecords] 查询响应数据为空');
    return;
  }

  if (data.success) {
    totalRecords.value = data.total || 0;
    currentPage.value = data.page || 1;
    allRecords.value = (data.data || []).map((item: any) => ({
      id: item.id,
      statestr: item.statestr || '',
      duration: item.duration || 0,
      startTime: item.startTime || '',
      lng: item.lng || 0,
      lat: item.lat || 0,
      username: item.username || ''
    }));
  } else {
    showTopToast(data.message || '查询失败');
  }
};

// 删除响应处理
const handleInterferenceRecordDeleteResponse = (data: any) => {
  console.log('[InterferenceRecords] 删除响应:', data);

  if (!data) {
    console.error('[InterferenceRecords] 删除响应数据为空');
    return;
  }

  if (data.success) {
    showTopToast(data.message || '删除成功');
    // 删除成功后重新查询当前页
    queryRecords();
  } else {
    showTopToast(data.message || '删除失败');
  }
};

// ========================================
// 组件挂载/卸载时注册/注销消息处理器
// ========================================
onMounted(() => {
  // 注册干扰操作记录消息处理器
  messageHandler.setInterferenceRecordHandlers({
    onInterferenceRecordQueryResponse: handleInterferenceRecordQueryResponse,
    onInterferenceRecordDeleteResponse: handleInterferenceRecordDeleteResponse
  });
  console.log('[InterferenceRecords] 干扰操作记录消息处理器已注册');

  // 初始加载记录列表
  queryRecords(1);
});

onUnmounted(() => {
  // 注销干扰操作记录消息处理器
  messageHandler.setInterferenceRecordHandlers({});
  console.log('[InterferenceRecords] 干扰操作记录消息处理器已注销');
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
  gap: 10px;
  padding: 12px 16px;
  background: transparent;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
  flex-wrap: nowrap;
}

.filter-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  flex-shrink: 0;
  white-space: nowrap;
}

.date-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.date-input-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
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

/* 鼠标悬停效果 */
.query-btn:hover {
  box-shadow: 0 0 15px rgba(24, 144, 255, 0.5);
}

/* 按下效果 */
.query-btn:active {
  box-shadow: 0 0 8px rgba(24, 144, 255, 0.8);
  opacity: 0.9;
}

/* 数据表格区域 */
.table-area {
  flex: 1;
  overflow: auto;
  background: transparent;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

.records-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
}

.records-table thead {
  background: rgba(6, 71, 117, 0.4);
}

.records-table th {
  padding: 10px 8px;
  color: #ffffff;
  font-weight: 600;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(6, 71, 117, 0.95);
}

.records-table td {
  padding: 10px 8px;
  color: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.records-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.05);
}

.delete-btn {
  background: transparent;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  transition: all 0.2s ease;
}

.delete-btn:hover {
  transform: scale(1.1);
}
</style>

<style>
/* 隐藏滚动条 - 非scoped确保生效 */
.interference-records .table-area::-webkit-scrollbar {
  width: 0 !important;
  display: none !important;
}
</style>
