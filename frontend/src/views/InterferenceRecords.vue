<template>
  <PageTemplate title="干扰操作记录" back-path="/main">
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
            <th>ID编号</th>
            <th>开启频段/GHz</th>
            <th>开启时间</th>
            <th>开启时长/s</th>
            <th>经纬度</th>
            <th>操作账号</th>
            <th>删除</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in paginatedRecords" :key="record.id">
            <td>{{ record.id }}</td>
            <td>{{ record.frequency }}</td>
            <td>{{ record.startTime }}</td>
            <td>{{ record.duration }}</td>
            <td>{{ record.location }}</td>
            <td>{{ record.account }}</td>
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
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import PageTemplate from '@/components/PageTemplate.vue';
import DateTimePicker from '@/components/DateTimePicker.vue';
import Pagination from '@/components/Pagination.vue';
import { PAGINATION_CONFIG } from '@/config/index';

const router = useRouter();

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

// 模拟数据 - 扩展到25条以便测试分页
const allRecords = ref([
  { id: '001', frequency: '0.8;2.5;5.8', startTime: '2026.03.09 17:49:45', duration: '60', location: '104.0891287;30.39640', account: 'lisi' },
  { id: '002', frequency: '0.8;2.5;5.8', startTime: '2026.03.09 17:49:45', duration: '60', location: '104.0891287;30.39640', account: 'lisi' },
  { id: '003', frequency: '0.8;2.5;5.8', startTime: '2026.03.09 17:49:45', duration: '60', location: '104.0891287;30.39640', account: 'lisi' },
  { id: '004', frequency: '0.8;2.5;5.8', startTime: '2026.03.09 17:49:45', duration: '60', location: '104.0891287;30.39640', account: 'lisi' },
  { id: '005', frequency: '0.8;2.5;5.8', startTime: '2026.03.09 17:49:45', duration: '60', location: '104.0891287;30.39640', account: 'lisi' },
  { id: '006', frequency: '0.8;2.5;5.8', startTime: '2026.03.09 17:50:00', duration: '60', location: '104.0891287;30.39640', account: 'wang' },
  { id: '007', frequency: '0.8;2.5;5.8', startTime: '2026.03.09 17:50:00', duration: '60', location: '104.0891287;30.39640', account: 'wang' },
  { id: '008', frequency: '0.8;2.5;5.8', startTime: '2026.03.09 17:50:00', duration: '60', location: '104.0891287;30.39640', account: 'wang' },
  { id: '009', frequency: '0.8;2.5;5.8', startTime: '2026.03.09 17:50:00', duration: '60', location: '104.0891287;30.39640', account: 'wang' },
  { id: '010', frequency: '0.8;2.5;5.8', startTime: '2026.03.09 17:50:00', duration: '60', location: '104.0891287;30.39640', account: 'wang' },
  { id: '011', frequency: '0.8;2.5;5.8', startTime: '2026.03.09 17:51:00', duration: '60', location: '104.0891287;30.39640', account: 'zhang' },
  { id: '012', frequency: '0.8;2.5;5.8', startTime: '2026.03.09 17:51:00', duration: '60', location: '104.0891287;30.39640', account: 'zhang' },
  { id: '013', frequency: '0.8;2.5;5.8', startTime: '2026.03.09 17:51:00', duration: '60', location: '104.0891287;30.39640', account: 'zhang' },
  { id: '014', frequency: '0.8;2.5;5.8', startTime: '2026.03.09 17:51:00', duration: '60', location: '104.0891287;30.39640', account: 'zhang' },
  { id: '015', frequency: '0.8;2.5;5.8', startTime: '2026.03.09 17:51:00', duration: '60', location: '104.0891287;30.39640', account: 'zhang' },
  { id: '016', frequency: '0.8;2.5;5.8', startTime: '2026.03.09 17:52:00', duration: '60', location: '104.0891287;30.39640', account: 'lisi' },
  { id: '017', frequency: '0.8;2.5;5.8', startTime: '2026.03.09 17:52:00', duration: '60', location: '104.0891287;30.39640', account: 'lisi' },
  { id: '018', frequency: '0.8;2.5;5.8', startTime: '2026.03.09 17:52:00', duration: '60', location: '104.0891287;30.39640', account: 'lisi' },
  { id: '019', frequency: '0.8;2.5;5.8', startTime: '2026.03.09 17:52:00', duration: '60', location: '104.0891287;30.39640', account: 'lisi' },
  { id: '020', frequency: '0.8;2.5;5.8', startTime: '2026.03.09 17:52:00', duration: '60', location: '104.0891287;30.39640', account: 'lisi' },
  { id: '021', frequency: '0.8;2.5;5.8', startTime: '2026.03.09 17:53:00', duration: '60', location: '104.0891287;30.39640', account: 'wang' },
  { id: '022', frequency: '0.8;2.5;5.8', startTime: '2026.03.09 17:53:00', duration: '60', location: '104.0891287;30.39640', account: 'wang' },
  { id: '023', frequency: '0.8;2.5;5.8', startTime: '2026.03.09 17:53:00', duration: '60', location: '104.0891287;30.39640', account: 'wang' },
  { id: '024', frequency: '0.8;2.5;5.8', startTime: '2026.03.09 17:53:00', duration: '60', location: '104.0891287;30.39640', account: 'wang' },
  { id: '025', frequency: '0.8;2.5;5.8', startTime: '2026.03.09 17:53:00', duration: '60', location: '104.0891287;30.39640', account: 'wang' }
]);

// 分页相关数据
const currentPage = ref(1);
const pageSize = ref(PAGINATION_CONFIG.PAGE_SIZE);

// 计算总数据条数
const totalRecords = computed(() => allRecords.value.length);

// 计算当前页显示的数据
const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return allRecords.value.slice(start, end);
});

// 分页变化处理
const handlePageChange = (page: number) => {
  console.log('[InterferenceRecords] 页码变化:', page);
};

const handleQuery = () => {
  console.log('[InterferenceRecords] 查询:', { 
    startDateTime: startDateTime.value, 
    endDateTime: endDateTime.value 
  });
  // 查询后重置到第一页
  currentPage.value = 1;
};

const handleDelete = (id: string) => {
  console.log('[InterferenceRecords] 删除记录:', id);
  allRecords.value = allRecords.value.filter(r => r.id !== id);
  
  // 如果删除后当前页没有数据且不是第一页，则跳转到前一页
  if (paginatedRecords.value.length === 0 && currentPage.value > 1) {
    currentPage.value--;
  }
};
</script>

<style scoped>
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
  background-size: cover;
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
}

/* 鼠标悬停效果 */
.query-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 15px rgba(24, 144, 255, 0.5);
}

/* 按下效果 */
.query-btn:active {
  transform: scale(0.95);
  box-shadow: 0 0 8px rgba(24, 144, 255, 0.8);
}

/* 点击波纹效果 */
.query-btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.3s ease, height 0.3s ease, opacity 0.3s ease;
  opacity: 0;
}

.query-btn:active::after {
  width: 100px;
  height: 100px;
  opacity: 0;
}

/* 数据表格区域 */
.table-area {
  flex: 1;
  overflow: auto;
  background: transparent;
}

.records-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.records-table thead {
  background: rgba(6, 71, 117, 0.4);
  position: sticky;
  top: 0;
  z-index: 10;
}

.records-table th {
  padding: 10px 8px;
  color: #ffffff;
  font-weight: 600;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
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
