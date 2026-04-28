<template>
  <PageTemplate>
    <!-- 标题栏 -->
    <div class="header-bar">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <span class="back-icon">←</span>
        </button>
      </div>
      <div class="header-title">侦测操作记录</div>
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
            <th>开始时间</th>
            <th>持续时长/秒</th>
            <th>经度</th>
            <th>纬度</th>
            <th>操作账号</th>
            <th>删除</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(record, index) in records" :key="record.id">
            <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td>{{ formatDisplayTime(record.startTime) }}</td>
            <td>{{ record.duration }}</td>
            <td>{{ record.lng }}</td>
            <td>{{ record.lat }}</td>
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
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import PageTemplate from '@/components/PageTemplate.vue';
import DateTimePicker from '@/components/DateTimePicker.vue';
import Pagination from '@/components/Pagination.vue';
import { PAGINATION_CONFIG } from '@/config/index';
import { formatDisplayTime } from '@/utils/timeUtils';
import { showTopToast } from '@/utils/toastMessage';
import { messageHandler, MessageCode } from '@/utils/MessageHandler';
import type { DetectionRecordItem } from '@/models/models';

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

// 记录数据
const records = ref<DetectionRecordItem[]>([]);

// 分页相关数据
const currentPage = ref(1);
const pageSize = ref(PAGINATION_CONFIG.PAGE_SIZE);
const totalRecords = ref(0);

// 分页变化处理
const handlePageChange = (page: number) => {
  console.log('[DetectionRecords] 页码变化:', page);
  currentPage.value = page;
  sendQuery();
};

// 发送查询指令 DB123
const sendQuery = () => {
  const requestData = {
    startTime: startDateTime.value,
    endTime: endDateTime.value,
    page: currentPage.value,
    pageSize: pageSize.value
  };
  messageHandler.send(MessageCode.DETECTION_RECORD_QUERY, requestData, 'db');
  console.log('[DetectionRecords] 发送查询指令 DB123:', {
    startTime: startDateTime.value,
    endTime: endDateTime.value,
    page: currentPage.value,
    pageSize: pageSize.value
  });
};

const handleQuery = () => {
  console.log('[DetectionRecords] 查询:', {
    startDateTime: startDateTime.value,
    endDateTime: endDateTime.value
  });
  currentPage.value = 1;
  sendQuery();
};

// 发送删除指令 DB124
const handleDelete = (id: number) => {
  console.log('[DetectionRecords] 删除记录:', id);
  const deleteData = {
    id: id,
    startTime: startDateTime.value,
    endTime: endDateTime.value
  };
  messageHandler.send(MessageCode.DETECTION_RECORD_DELETE, deleteData, 'db');
};

// 注册消息处理器
onMounted(() => {
  messageHandler.setDetectionRecordHandlers({
    onDetectionRecordQueryResponse: (data: any) => {
      console.log('[DetectionRecords] 收到查询响应 DB023:', data);
      if (data.success) {
        records.value = data.data || [];
        totalRecords.value = data.total || 0;
        if (data.page) currentPage.value = data.page;
      } else {
        showTopToast(data.message || '查询失败');
      }
    },
    onDetectionRecordDeleteResponse: (data: any) => {
      console.log('[DetectionRecords] 收到删除响应 DB024:', data);
      if (data.success) {
        showTopToast('删除成功');
        // 删除成功后重新查询刷新列表
        sendQuery();
      } else {
        showTopToast(data.message || '删除失败');
      }
    }
  });

  // 初始加载
  sendQuery();
});

onUnmounted(() => {
  messageHandler.setDetectionRecordHandlers({
    onDetectionRecordQueryResponse: undefined,
    onDetectionRecordDeleteResponse: undefined
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

/* 数据表格区域 */
.table-area {
  flex: 1;
  overflow: auto;
  background: transparent;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.records-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
}

.records-table thead {
  background: rgba(6, 71, 117, 0.6);
}

.records-table th {
  color: #ffffff;
  font-weight: 500;
  padding: 8px 6px;
  text-align: center;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(6, 71, 117, 0.95);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.records-table td {
  color: rgba(255, 255, 255, 0.85);
  padding: 8px 6px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  white-space: nowrap;
}

.records-table tbody tr:hover {
  background: rgba(24, 144, 255, 0.15);
}

.delete-btn {
  background: transparent;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.delete-btn:hover {
  transform: scale(1.2);
  background: rgba(255, 77, 79, 0.2);
}
</style>

<style>
/* 隐藏滚动条 - 非 scoped */
.records-table::-webkit-scrollbar {
  width: 0 !important;
  display: none !important;
}
</style>
