<template>
  <div class="records-page-wrapper">
    <div class="records-container">
      <!-- 顶部状态栏 -->
      <div class="status-bar">
        <div class="device-name">手持式察打一体枪</div>
        <div class="status-items">
          <div class="status-item">
            <span class="icon">📶</span>
            <span>4G/5G</span>
          </div>
          <div class="status-item">
            <span class="time">{{ currentTime }}</span>
          </div>
          <div class="status-item">
            <span class="icon">🔋</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="content-area">
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
          <div class="date-input-group">
            <el-date-picker
              v-model="startDate"
              type="datetime"
              placeholder="选择开始时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              class="date-picker-input"
              popper-class="custom-date-picker"
            />
            <span class="date-separator">-</span>
            <el-date-picker
              v-model="endDate"
              type="datetime"
              placeholder="选择结束时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              class="date-picker-input"
              popper-class="custom-date-picker"
            />
          </div>
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
              <tr v-for="record in records" :key="record.id">
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

const router = useRouter();

const currentTime = ref('');
let timeInterval: number | null = null;

// 查询筛选 - 默认值
const getTodayStartTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day} 00:00:00`;
};

const getTodayEndTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day} 23:59:59`;
};

const startDate = ref(getTodayStartTime());
const endDate = ref(getTodayEndTime());

// 模拟数据
const records = ref([
  { id: '001', frequency: '0.8;2.5;5.8', startTime: '2026.03.09 17:49:45', duration: '60', location: '104.0891287;30.39640', account: 'lisi' },
  { id: '002', frequency: '0.8;2.5;5.8', startTime: '2026.03.09 17:49:45', duration: '60', location: '104.0891287;30.39640', account: 'lisi' },
  { id: '003', frequency: '0.8;2.5;5.8', startTime: '2026.03.09 17:49:45', duration: '60', location: '104.0891287;30.39640', account: 'lisi' },
  { id: '004', frequency: '0.8;2.5;5.8', startTime: '2026.03.09 17:49:45', duration: '60', location: '104.0891287;30.39640', account: 'lisi' },
  { id: '005', frequency: '0.8;2.5;5.8', startTime: '2026.03.09 17:49:45', duration: '60', location: '104.0891287;30.39640', account: 'lisi' }
]);

const updateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  currentTime.value = `${year}.${month}.${day} ${hours}:${minutes}`;
};

const goBack = () => {
  router.push('/main');
};

const handleQuery = () => {
  console.log('[InterferenceRecords] 查询:', { startDate: startDate.value, endDate: endDate.value });
};

const handleDelete = (id: string) => {
  console.log('[InterferenceRecords] 删除记录:', id);
  records.value = records.value.filter(r => r.id !== id);
};

onMounted(() => {
  console.log('[InterferenceRecords] 组件挂载');
  updateTime();
  timeInterval = window.setInterval(updateTime, 1000);
});

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval);
  }
});
</script>

<style scoped>
/* 页面包装器 */
.records-page-wrapper {
  width: 100vw;
  height: 100vh;
  background: #0f0f1a;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  overflow: hidden;
}

/* 主容器 - 16:10比例 */
.records-container {
  aspect-ratio: 16 / 10;
  width: 100%;
  max-width: 800px;
  max-height: 500px;
  height: auto;
  background: #1a1a2e;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}

/* 顶部状态栏 */
.status-bar {
  background: rgba(3, 22, 50, 0.8);
  height: 24px;
  padding: 0 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(42, 42, 62, 0.5);
  flex-shrink: 0;
}

.device-name {
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
}

.status-items {
  display: flex;
  gap: 16px;
  align-items: center;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #ffffff;
  font-size: 12px;
}

.status-item .icon {
  font-size: 14px;
}

.status-item .time {
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

/* 内容区域 */
.content-area {
  flex: 1;
  background: #031632;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* 顶部标题栏 */
.header-bar {
  background: rgba(6, 71, 117, 0.8);
  height: 40px;
  padding: 0 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
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
  font-size: 20px;
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
  padding: 12px 16px;
  background: transparent;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.filter-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  flex-shrink: 0;
}

.date-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.date-picker-input {
  width: 180px;
}

.date-picker-input :deep(.el-input__wrapper) {
  padding: 6px 8px !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 4px !important;
  background: rgba(6, 71, 117, 0.8) !important;
  box-shadow: none !important;
}

.date-picker-input :deep(.el-input__wrapper):hover {
  border-color: rgba(255, 255, 255, 0.5) !important;
  background: rgba(6, 71, 117, 0.85) !important;
}

.date-picker-input :deep(.el-input__wrapper.is-focus) {
  border-color: rgba(255, 255, 255, 0.6) !important;
  background: rgba(6, 71, 117, 1) !important;
}

.date-picker-input :deep(.el-input__inner) {
  color: #ffffff !important;
  background: transparent !important;
}

.date-picker-input :deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.5) !important;
}

.date-picker-input :deep(.el-input__prefix),
.date-picker-input :deep(.el-input__suffix) {
  color: rgba(255, 255, 255, 0.8) !important;
}

.date-picker-input :deep(.el-date-editor) {
  background: rgba(6, 71, 117, 0.8) !important;
}

.date-separator {
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
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

<style>
/* Element Plus Date Picker 自定义下拉面板样式 */
.custom-date-picker {
  background: rgba(6, 71, 117, 0.95) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
}

.custom-date-picker .el-picker-panel {
  background: transparent !important;
  border: none !important;
  color: #ffffff !important;
}

/* 日期选择器头部 */
.custom-date-picker .el-date-picker__header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
}

.custom-date-picker .el-date-picker__header-label {
  color: #ffffff !important;
}

.custom-date-picker .el-date-picker__header-label:hover {
  color: rgba(255, 255, 255, 0.8) !important;
}

.custom-date-picker .el-picker-panel__icon-btn {
  color: rgba(255, 255, 255, 0.8) !important;
}

.custom-date-picker .el-picker-panel__icon-btn:hover {
  color: #ffffff !important;
}

/* 日期表格 */
.custom-date-picker .el-date-table th {
  color: rgba(255, 255, 255, 0.6) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
  background: transparent !important;
}

.custom-date-picker .el-date-table td {
  color: #ffffff !important;
}

.custom-date-picker .el-date-table td.available:hover {
  background: rgba(255, 255, 255, 0.15) !important;
}

.custom-date-picker .el-date-table td.today .el-date-table-cell__text {
  color: #1890ff !important;
  font-weight: bold !important;
}

.custom-date-picker .el-date-table td.current:not(.disabled) .el-date-table-cell__text {
  background: #1890ff !important;
  color: #ffffff !important;
}

.custom-date-picker .el-date-table-cell__text {
  color: #ffffff !important;
}

.custom-date-picker .el-picker-panel__content {
  color: #ffffff !important;
}

/* 时间选择器部分 */
.custom-date-picker .el-time-panel {
  background: rgba(6, 71, 117, 0.95) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 4px !important;
}

.custom-date-picker .el-time-spinner {
  background: transparent !important;
}

.custom-date-picker .el-time-spinner__wrapper {
  background: transparent !important;
}

.custom-date-picker .el-time-spinner__list {
  background: transparent !important;
}

.custom-date-picker .el-time-spinner__item {
  color: rgba(255, 255, 255, 0.6) !important;
  background: transparent !important;
}

.custom-date-picker .el-time-spinner__item:hover:not(.disabled):not(.active) {
  color: #ffffff !important;
  background: rgba(255, 255, 255, 0.15) !important;
}

.custom-date-picker .el-time-spinner__item.active:not(.disabled) {
  color: #ffffff !important;
  font-weight: bold !important;
  background: rgba(24, 144, 255, 0.3) !important;
}

.custom-date-picker .el-time-panel__content {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
  background: transparent !important;
}

.custom-date-picker .el-time-panel__header {
  background: transparent !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
}

.custom-date-picker .el-time-panel__footer {
  border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
  background: transparent !important;
}

/* 面板底部按钮 */
.custom-date-picker .el-picker-panel__footer {
  border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
  background: transparent !important;
}

.custom-date-picker .el-button {
  background: rgba(6, 71, 117, 0.8) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
  color: #ffffff !important;
}

.custom-date-picker .el-button:hover {
  background: rgba(6, 71, 117, 1) !important;
  border-color: rgba(255, 255, 255, 0.4) !important;
}

.custom-date-picker .el-button--primary {
  background: #1890ff !important;
  border-color: #1890ff !important;
  color: #ffffff !important;
}

.custom-date-picker .el-button--primary:hover {
  background: #40a9ff !important;
  border-color: #40a9ff !important;
}

/* 确保所有子元素都有正确的背景 */
.custom-date-picker * {
  background-color: transparent !important;
}

.custom-date-picker .el-popper__arrow {
  background: rgba(6, 71, 117, 0.95) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
}
</style>
