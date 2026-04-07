<template>
  <PageTemplate>
    <!-- 标题栏 -->
    <div class="header-bar">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <span class="back-icon">←</span>
        </button>
      </div>
      <div class="header-title">黑白名单配置</div>
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
      <div class="button-group">
        <button class="query-btn" @click="handleQuery">查询</button>
        <button class="add-btn" @click="handleAdd">新增</button>
      </div>
    </div>

    <!-- 黑白名单卡片列表区域 -->
    <div class="records-area">
      <div class="records-grid">
        <div
          v-for="record in paginatedRecords"
          :key="record.id"
          class="bw-card"
        >
          <!-- 卡片头部操作按钮 -->
          <div class="card-actions">
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
            <div class="card-row card-row-split">
              <div class="card-row-item">
                <span class="card-label">型号:</span>
                <span class="card-value">{{ record.model }}</span>
              </div>
              <div class="card-row-item card-row-item-right">
                <span class="card-label">厂商:</span>
                <span class="card-value">{{ record.manufacturer }}</span>
              </div>
            </div>
            <div class="card-row">
              <span class="card-label">新增时间:</span>
              <span class="card-value">{{ record.addTime }}</span>
            </div>
            <div class="card-row">
              <span class="card-label">生效时间:</span>
              <span class="card-value">{{ record.effectiveTime }}</span>
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

    <!-- 新增黑白名单弹框 -->
    <Transition name="slide">
      <PanelTemplate
        v-if="showAddDialog"
        title="新增黑白名单"
        @close="closeAddDialog"
      >
        <div class="add-form">
          <div class="form-row">
            <span class="form-label">SN码:</span>
            <div class="form-input-wrapper">
              <input
                v-model="newRecord.snCode"
                type="text"
                class="form-input"
                placeholder="请输入SN码"
              />
            </div>
          </div>
          <div class="form-row">
            <span class="form-label">型号:</span>
            <div class="form-input-wrapper">
              <input
                v-model="newRecord.model"
                type="text"
                class="form-input"
                placeholder="请输入型号"
              />
            </div>
          </div>
          <div class="form-row">
            <span class="form-label">厂商:</span>
            <div class="form-input-wrapper">
              <input
                v-model="newRecord.manufacturer"
                type="text"
                class="form-input"
                placeholder="请输入厂商"
              />
            </div>
          </div>
          <div class="form-row">
            <span class="form-label">生效开始:</span>
            <div class="form-input-wrapper datetime-picker-wrapper">
              <DateTimePicker
                v-model:start-date-time="newStartTime"
                v-model:end-date-time="newEndTime"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
              />
            </div>
          </div>
          <!-- 名单类型暂时屏蔽 -->
          <!--
          <div class="form-row">
            <span class="form-label">名单类型:</span>
            <div class="form-input-wrapper">
              <select v-model="newRecord.type" class="form-select">
                <option value="black">黑名单</option>
                <option value="white">白名单</option>
              </select>
            </div>
          </div>
          -->
          <div class="form-buttons">
            <button class="btn-cancel" @click="closeAddDialog">取消</button>
            <button class="btn-confirm" @click="handleSaveAdd">保存</button>
          </div>
        </div>
      </PanelTemplate>
    </Transition>
  </PageTemplate>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import PageTemplate from '@/components/PageTemplate.vue';
import PanelTemplate from '@/components/PanelTemplate.vue';
import DateTimePicker from '@/components/DateTimePicker.vue';
import Pagination from '@/components/Pagination.vue';
import { PAGINATION_CONFIG } from '@/config/index';

const router = useRouter();

// 版本标识
const CODE_VERSION = '2024-04-07-BLACKWHITELIST-CONFIG';
console.log('[BlackWhiteListConfig] ========== 组件版本:', CODE_VERSION, '==========');

// 返回上一页
const goBack = () => {
  router.push('/main');
};

// 新增对话框状态
const showAddDialog = ref(false);
const newRecord = ref({
  snCode: '',
  model: '',
  manufacturer: '',
  type: 'black'
});

// 新增表单的时间字段
const newStartTime = ref('');
const newEndTime = ref('');

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

// 模拟黑白名单数据
const allRecords = ref([
  { id: '1', snCode: 'SN15478214', model: 'DJ-Mavic4', manufacturer: '大疆', addTime: '2026.03.04 16:58:22', effectiveTime: '2026.03.04-2026.03.08' },
  { id: '2', snCode: 'SN15478215', model: 'DJ-Mavic3', manufacturer: '大疆', addTime: '2026.03.05 10:30:15', effectiveTime: '2026.03.05-2026.03.09' },
  { id: '3', snCode: 'SN15478216', model: 'DJ-Air3', manufacturer: '大疆', addTime: '2026.03.06 14:20:30', effectiveTime: '2026.03.06-2026.03.10' },
  { id: '4', snCode: 'SN15478217', model: 'DJ-Mini4', manufacturer: '大疆', addTime: '2026.03.07 09:15:45', effectiveTime: '2026.03.07-2026.03.11' },
  { id: '5', snCode: 'SN15478218', model: 'DJ-Mavic4', manufacturer: '大疆', addTime: '2026.03.08 18:45:00', effectiveTime: '2026.03.08-2026.03.12' },
  { id: '6', snCode: 'SN15478219', model: 'DJ-Air2', manufacturer: '大疆', addTime: '2026.03.09 11:20:30', effectiveTime: '2026.03.09-2026.03.13' },
  { id: '7', snCode: 'SN15478220', model: 'DJ-Mavic2', manufacturer: '大疆', addTime: '2026.03.10 15:30:45', effectiveTime: '2026.03.10-2026.03.14' },
  { id: '8', snCode: 'SN15478221', model: 'DJ-Mini3', manufacturer: '大疆', addTime: '2026.03.11 08:45:20', effectiveTime: '2026.03.11-2026.03.15' },
  { id: '9', snCode: 'SN15478222', model: 'DJ-Air3S', manufacturer: '大疆', addTime: '2026.03.12 12:15:35', effectiveTime: '2026.03.12-2026.03.16' },
  { id: '10', snCode: 'SN15478223', model: 'DJ-Mavic4', manufacturer: '大疆', addTime: '2026.03.13 16:20:10', effectiveTime: '2026.03.13-2026.03.17' }
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
  console.log('[BlackWhiteListConfig] 页码变化:', page);
};

// 查询处理
const handleQuery = () => {
  console.log('[BlackWhiteListConfig] 查询:', {
    snCode: snCode.value,
    startDateTime: startDateTime.value,
    endDateTime: endDateTime.value
  });
  // 查询后重置到第一页
  currentPage.value = 1;
};

// 新增对话框
const handleAdd = () => {
  console.log('[BlackWhiteListConfig] 打开新增对话框');
  showAddDialog.value = true;
  // 重置表单
  newRecord.value = {
    snCode: '',
    model: '',
    manufacturer: '',
    type: 'black'
  };
  // 重置时间
  newStartTime.value = '';
  newEndTime.value = '';
};

const closeAddDialog = () => {
  console.log('[BlackWhiteListConfig] 关闭新增对话框');
  showAddDialog.value = false;
};

const handleSaveAdd = () => {
  console.log('[BlackWhiteListConfig] 保存新增:', newRecord.value);
  // 获取当前时间作为新增时间
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  const addTime = `${year}.${month}.${day} ${hour}:${minute}:${second}`;

  // 构造生效时间显示
  const effectiveTime = `${newStartTime.value}-${newEndTime.value}`;

  // 添加到列表
  allRecords.value.unshift({
    id: Date.now().toString(),
    snCode: newRecord.value.snCode,
    model: newRecord.value.model,
    manufacturer: newRecord.value.manufacturer,
    addTime: addTime,
    effectiveTime: effectiveTime
  });

  // 关闭对话框
  closeAddDialog();
  console.log('[BlackWhiteListConfig] 新增成功，当前总数:', allRecords.value.length);
};

// 删除记录
const handleDelete = (id: string) => {
  console.log('[BlackWhiteListConfig] 删除记录:', id);
  allRecords.value = allRecords.value.filter(r => r.id !== id);

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

/* 按钮组 */
.button-group {
  display: flex;
  gap: 8px;
  margin-left: auto;
  flex-shrink: 0;
}

.query-btn,
.add-btn {
  padding: 0;
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

.query-btn:hover,
.add-btn:hover {
  box-shadow: 0 0 15px rgba(24, 144, 255, 0.5);
}

.query-btn:active,
.add-btn:active {
  box-shadow: 0 0 8px rgba(24, 144, 255, 0.8);
  opacity: 0.9;
}

/* 黑白名单卡片列表区域 */
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
  gap: 12px;
  align-content: start;
}

.bw-card {
  background: rgba(6, 71, 117, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  padding: 10px;
  position: relative;
  transition: all 0.2s ease;
}

.bw-card:hover {
  background: rgba(6, 71, 117, 0.5);
  border-color: rgba(24, 144, 255, 0.4);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

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

.card-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
}

.card-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 同一行左右分列布局 */
.card-row-split {
  display: flex;
  justify-content: space-between;
  gap: 4px;
}

.card-row-item {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.card-row-item:first-child {
  justify-content: flex-start;
}

.card-row-item:last-child {
  justify-content: flex-end;
}

.card-row-item-right {
  justify-content: flex-end;
}

.card-row-item:last-child .card-label,
.card-row-item:last-child .card-value {
  text-align: left;
}

.card-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  flex-shrink: 0;
}

.card-value {
  color: rgba(255, 255, 255, 0.95);
  font-size: 13px;
  flex: 1;
  word-break: break-all;
}

/* 新增表单样式 */
.add-form {
  display: flex;
  flex-direction: column;
  padding: 10px;
}

.form-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 8px;
  width: 100%;
  box-sizing: border-box;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-label {
  color: #ffffff;
  font-size: 12px;
  white-space: nowrap;
  flex-shrink: 0;
  padding-right: 4px;
}

.form-input-wrapper {
  flex: 1;
  min-width: 0;
}

.form-input,
.form-select {
  width: 100%;
  min-width: 0;
  background: rgba(6, 71, 117, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  padding: 4px 6px;
  color: #ffffff;
  font-size: 12px;
  outline: none;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus {
  border-color: rgba(255, 255, 255, 0.6);
  background: rgba(6, 71, 117, 1);
}

.form-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.form-select {
  cursor: pointer;
}

/* 时间选择器包装器 */
.datetime-picker-wrapper {
  width: 100%;
}

.datetime-picker-wrapper :deep(.date-picker-container) {
  width: 100%;
}

.datetime-picker-wrapper :deep(.picker-wrapper) {
  width: 100%;
  flex: 1;
}

.datetime-picker-wrapper :deep(.datetime-picker) {
  width: 100% !important;
}

/* 按钮区域 */
.form-buttons {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  height: 32px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #ffffff;
  background: url('/backgrounds/按钮2.png') no-repeat center center;
  background-size: 100% 100%;
}

.btn-cancel:hover,
.btn-confirm:hover {
  opacity: 0.9;
  transform: scale(1.02);
}

/* 过渡动画 - 从右至左滑动 */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .filter-area {
    flex-wrap: wrap;
  }

  .records-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .records-grid {
    grid-template-columns: 1fr;
  }
}
</style>
