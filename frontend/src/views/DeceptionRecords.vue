<template>
  <PageTemplate>
    <!-- 标题栏 -->
    <div class="header-bar">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <span class="back-icon">←</span>
        </button>
      </div>
      <div class="header-title">诱骗操作记录</div>
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
            <th>ID编号</th>
            <th>诱骗模式</th>
            <th>诱骗频段</th>
            <th>目标频点/MHz</th>
            <th>开始时间</th>
            <th>持续时长/s</th>
            <th>经纬度</th>
            <th>操作账号</th>
            <th>删除</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in paginatedRecords" :key="record.id">
            <td>{{ record.id }}</td>
            <td>{{ record.mode }}</td>
            <td>{{ record.band }}</td>
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

// 模拟数据 - 诱骗操作记录
const allRecords = ref([
  { id: '001', mode: '方向欺骗', band: 'GPS/L1', frequency: '1575.42', startTime: '2026.03.09 17:49:45', duration: '120', location: '104.0891287;30.39640', account: 'admin' },
  { id: '002', mode: '禁飞区迫降', band: 'BDS/B1', frequency: '1561.098', startTime: '2026.03.09 17:50:30', duration: '90', location: '104.0891287;30.39640', account: 'admin' },
  { id: '003', mode: '方向欺骗', band: 'GPS/L1', frequency: '1575.42', startTime: '2026.03.09 17:51:15', duration: '60', location: '104.0891287;30.39640', account: 'operator1' },
  { id: '004', mode: '禁飞区迫降', band: 'GALILEO/E1', frequency: '1575.42', startTime: '2026.03.09 17:52:00', duration: '150', location: '104.0891287;30.39640', account: 'operator1' },
  { id: '005', mode: '方向欺骗', band: 'GPS/L1', frequency: '1575.42', startTime: '2026.03.09 17:53:20', duration: '45', location: '104.0891287;30.39640', account: 'operator2' },
  { id: '006', mode: '禁飞区迫降', band: 'BDS/B1', frequency: '1561.098', startTime: '2026.03.09 17:54:10', duration: '180', location: '104.0891287;30.39640', account: 'operator2' },
  { id: '007', mode: '方向欺骗', band: 'GALILEO/E1', frequency: '1575.42', startTime: '2026.03.09 17:55:00', duration: '75', location: '104.0891287;30.39640', account: 'admin' },
  { id: '008', mode: '禁飞区迫降', band: 'GPS/L1', frequency: '1575.42', startTime: '2026.03.09 17:55:45', duration: '120', location: '104.0891287;30.39640', account: 'admin' },
  { id: '009', mode: '方向欺骗', band: 'BDS/B1', frequency: '1561.098', startTime: '2026.03.09 17:56:30', duration: '90', location: '104.0891287;30.39640', account: 'operator1' },
  { id: '010', mode: '禁飞区迫降', band: 'GALILEO/E1', frequency: '1575.42', startTime: '2026.03.09 17:57:15', duration: '60', location: '104.0891287;30.39640', account: 'operator1' },
  { id: '011', mode: '方向欺骗', band: 'GPS/L1', frequency: '1575.42', startTime: '2026.03.09 17:58:00', duration: '135', location: '104.0891287;30.39640', account: 'operator2' },
  { id: '012', mode: '禁飞区迫降', band: 'BDS/B1', frequency: '1561.098', startTime: '2026.03.09 17:58:45', duration: '105', location: '104.0891287;30.39640', account: 'operator2' },
  { id: '013', mode: '方向欺骗', band: 'GPS/L1', frequency: '1575.42', startTime: '2026.03.09 17:59:30', duration: '80', location: '104.0891287;30.39640', account: 'admin' },
  { id: '014', mode: '禁飞区迫降', band: 'GALILEO/E1', frequency: '1575.42', startTime: '2026.03.09 18:00:15', duration: '95', location: '104.0891287;30.39640', account: 'admin' },
  { id: '015', mode: '方向欺骗', band: 'BDS/B1', frequency: '1561.098', startTime: '2026.03.09 18:01:00', duration: '110', location: '104.0891287;30.39640', account: 'operator1' },
  { id: '016', mode: '禁飞区迫降', band: 'GPS/L1', frequency: '1575.42', startTime: '2026.03.09 18:01:45', duration: '70', location: '104.0891287;30.39640', account: 'operator1' },
  { id: '017', mode: '方向欺骗', band: 'GALILEO/E1', frequency: '1575.42', startTime: '2026.03.09 18:02:30', duration: '125', location: '104.0891287;30.39640', account: 'operator2' },
  { id: '018', mode: '禁飞区迫降', band: 'BDS/B1', frequency: '1561.098', startTime: '2026.03.09 18:03:15', duration: '88', location: '104.0891287;30.39640', account: 'operator2' },
  { id: '019', mode: '方向欺骗', band: 'GPS/L1', frequency: '1575.42', startTime: '2026.03.09 18:04:00', duration: '100', location: '104.0891287;30.39640', account: 'admin' },
  { id: '020', mode: '禁飞区迫降', band: 'GALILEO/E1', frequency: '1575.42', startTime: '2026.03.09 18:04:45', duration: '140', location: '104.0891287;30.39640', account: 'admin' }
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
  console.log('[DeceptionRecords] 页码变化:', page);
  currentPage.value = page;
};

const handleQuery = () => {
  console.log('[DeceptionRecords] 查询:', { 
    startDateTime: startDateTime.value, 
    endDateTime: endDateTime.value 
  });
  // 查询后重置到第一页
  currentPage.value = 1;
  ElMessage.success('查询成功');
};

const handleDelete = (id: string) => {
  console.log('[DeceptionRecords] 删除记录:', id);
  allRecords.value = allRecords.value.filter(r => r.id !== id);
  ElMessage.success('删除成功');
  
  // 如果删除后当前页没有数据且不是第一页，则跳转到前一页
  if (paginatedRecords.value.length === 0 && currentPage.value > 1) {
    currentPage.value--;
  }
};
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
