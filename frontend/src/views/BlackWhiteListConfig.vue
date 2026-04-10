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
          ref="snSearchInputRef"
          v-model="snCode"
          type="text"
          class="sn-input"
          placeholder="请输入SN码"
          @focus="handleInputFocus(snSearchInputRef)"
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
                ref="snAddInputRef"
                v-model="newRecord.snCode"
                type="text"
                class="form-input"
                placeholder="请输入SN码"
                @focus="handleInputFocus(snAddInputRef)"
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
            <div class="form-input-wrapper time-picker-wrapper">
              <input
                ref="startTimeInputRef"
                v-model="newStartTime"
                type="text"
                class="form-input time-input"
                placeholder="请选择开始时间"
                @focus="showTimePicker('start')"
              />
              <TimePickerPanel
                v-if="activeTimePicker === 'start'"
                @select="handleStartTimeSelect"
                @close="closeTimePicker"
              />
            </div>
          </div>
          <div class="form-row">
            <span class="form-label">生效结束:</span>
            <div class="form-input-wrapper time-picker-wrapper">
              <input
                ref="endTimeInputRef"
                v-model="newEndTime"
                type="text"
                class="form-input time-input"
                placeholder="请选择结束时间"
                @focus="showTimePicker('end')"
              />
              <TimePickerPanel
                v-if="activeTimePicker === 'end'"
                @select="handleEndTimeSelect"
                @close="closeTimePicker"
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

    <!-- 时间选择面板组件 -->
    <div v-if="activeTimePicker" class="time-picker-overlay" @click="closeTimePicker">
      <div class="time-picker-panel" @click.stop>
        <div class="time-picker-header">
          <span>选择时间</span>
          <button class="time-picker-close" @click="closeTimePicker">×</button>
        </div>
        <div class="time-picker-body">
          <div class="time-picker-section">
            <div class="time-picker-label">年</div>
            <div class="time-picker-scroll">
              <div
                v-for="y in timePickerYears"
                :key="y"
                class="time-picker-item"
                :class="{ active: selectedYear === y }"
                @click="selectedYear = y"
              >
                {{ y }}
              </div>
            </div>
          </div>
          <div class="time-picker-section">
            <div class="time-picker-label">月</div>
            <div class="time-picker-scroll">
              <div
                v-for="m in timePickerMonths"
                :key="m"
                class="time-picker-item"
                :class="{ active: selectedMonth === m }"
                @click="selectedMonth = m"
              >
                {{ m }}
              </div>
            </div>
          </div>
          <div class="time-picker-section">
            <div class="time-picker-label">日</div>
            <div class="time-picker-scroll">
              <div
                v-for="d in timePickerDays"
                :key="d"
                class="time-picker-item"
                :class="{ active: selectedDay === d }"
                @click="selectedDay = d"
              >
                {{ d }}
              </div>
            </div>
          </div>
          <div class="time-picker-section">
            <div class="time-picker-label">时</div>
            <div class="time-picker-scroll">
              <div
                v-for="h in timePickerHours"
                :key="h"
                class="time-picker-item"
                :class="{ active: selectedHour === h }"
                @click="selectedHour = h"
              >
                {{ h }}
              </div>
            </div>
          </div>
          <div class="time-picker-section">
            <div class="time-picker-label">分</div>
            <div class="time-picker-scroll">
              <div
                v-for="min in timePickerMinutes"
                :key="min"
                class="time-picker-item"
                :class="{ active: selectedMinute === min }"
                @click="selectedMinute = min"
              >
                {{ min }}
              </div>
            </div>
          </div>
        </div>
        <div class="time-picker-footer">
          <button class="time-picker-btn cancel" @click="closeTimePicker">取消</button>
          <button class="time-picker-btn confirm" @click="confirmTimeSelection">确认</button>
        </div>
      </div>
    </div>

    <!-- 虚拟键盘容器 -->
    <div class="keyboard-wrapper" :class="{ 'keyboard-visible': isKeyboardVisible }">
      <VirtualKeyboard
        v-model:visible="isKeyboardVisible"
        :input-ref="currentInputRef"
        @close="handleKeyboardClose"
      />
    </div>
  </PageTemplate>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import PageTemplate from '@/components/PageTemplate.vue';
import PanelTemplate from '@/components/PanelTemplate.vue';
import DateTimePicker from '@/components/DateTimePicker.vue';
import Pagination from '@/components/Pagination.vue';
import VirtualKeyboard from '@/components/VirtualKeyboard.vue';
import { PAGINATION_CONFIG } from '@/config/index';

const router = useRouter();

// ========================================
// 虚拟键盘相关
// ========================================
const isKeyboardVisible = ref(false);
const currentInputRef = ref<HTMLInputElement | null>(null);
const snSearchInputRef = ref<HTMLInputElement | null>(null);
const snAddInputRef = ref<HTMLInputElement | null>(null);

const handleInputFocus = (inputRef: HTMLInputElement | null) => {
  if (inputRef) {
    currentInputRef.value = inputRef;
    isKeyboardVisible.value = true;
  }
};

const handleKeyboardClose = () => {
  isKeyboardVisible.value = false;
};

// ========================================
// 时间选择器相关
// ========================================
const activeTimePicker = ref<'start' | 'end' | null>(null);
const startTimeInputRef = ref<HTMLInputElement | null>(null);
const endTimeInputRef = ref<HTMLInputElement | null>(null);

const now = new Date();
const currentYear = now.getFullYear();

// 时间选择器数据
const selectedYear = ref(currentYear);
const selectedMonth = ref(now.getMonth() + 1);
const selectedDay = ref(now.getDate());
const selectedHour = ref(now.getHours());
const selectedMinute = ref(now.getMinutes());

const timePickerYears = computed(() => {
  const years = [];
  for (let y = currentYear - 10; y <= currentYear + 10; y++) {
    years.push(y);
  }
  return years;
});

const timePickerMonths = computed(() => {
  const months = [];
  for (let m = 1; m <= 12; m++) {
    months.push(m);
  }
  return months;
});

const timePickerDays = computed(() => {
  const days = [];
  const maxDay = new Date(selectedYear.value, selectedMonth.value, 0).getDate();
  for (let d = 1; d <= maxDay; d++) {
    days.push(d);
  }
  return days;
});

const timePickerHours = computed(() => {
  const hours = [];
  for (let h = 0; h <= 23; h++) {
    hours.push(h);
  }
  return hours;
});

const timePickerMinutes = computed(() => {
  const minutes = [];
  for (let m = 0; m <= 59; m++) {
    minutes.push(m);
  }
  return minutes;
});

const showTimePicker = (type: 'start' | 'end') => {
  activeTimePicker.value = type;
  // 如果已有值，解析显示
  const currentValue = type === 'start' ? newStartTime.value : newEndTime.value;
  if (currentValue) {
    const parts = currentValue.split(/[-: ]/);
    if (parts.length >= 5) {
      selectedYear.value = parseInt(parts[0]);
      selectedMonth.value = parseInt(parts[1]);
      selectedDay.value = parseInt(parts[2]);
      selectedHour.value = parseInt(parts[3]);
      selectedMinute.value = parseInt(parts[4]);
    }
  } else {
    // 使用当前时间
    const now = new Date();
    selectedYear.value = now.getFullYear();
    selectedMonth.value = now.getMonth() + 1;
    selectedDay.value = now.getDate();
    selectedHour.value = now.getHours();
    selectedMinute.value = now.getMinutes();
  }
};

const closeTimePicker = () => {
  activeTimePicker.value = null;
};

const formatTimeValue = () => {
  const month = String(selectedMonth.value).padStart(2, '0');
  const day = String(selectedDay.value).padStart(2, '0');
  const hour = String(selectedHour.value).padStart(2, '0');
  const minute = String(selectedMinute.value).padStart(2, '0');
  return `${selectedYear.value}-${month}-${day} ${hour}:${minute}:00`;
};

const confirmTimeSelection = () => {
  const timeValue = formatTimeValue();
  if (activeTimePicker.value === 'start') {
    newStartTime.value = timeValue;
  } else if (activeTimePicker.value === 'end') {
    newEndTime.value = timeValue;
  }
  closeTimePicker();
};

const handleStartTimeSelect = (time: string) => {
  newStartTime.value = time;
  closeTimePicker();
};

const handleEndTimeSelect = (time: string) => {
  newEndTime.value = time;
  closeTimePicker();
};

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
/* 虚拟键盘容器 - 从底部向上滑出 */
.keyboard-wrapper {
  flex-shrink: 0;
  height: 0;
  overflow: hidden;
  transition: height 0.25s ease-out;
}

.keyboard-wrapper.keyboard-visible {
  height: auto;
  overflow: visible;
}

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
  width: 100px;
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

/* 时间选择器相关样式 */
.time-picker-wrapper {
  position: relative;
  flex: 1;
}

.time-input {
  cursor: pointer;
  background: rgba(6, 71, 117, 0.8) !important;
}

.time-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.time-picker-panel {
  background: rgba(30, 50, 80, 0.95);
  border: 1px solid rgba(74, 144, 226, 0.4);
  border-radius: 6px;
  width: 320px;
  max-height: 400px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.time-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: rgba(6, 71, 117, 0.6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px 6px 0 0;
}

.time-picker-header span {
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
}

.time-picker-close {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.time-picker-close:hover {
  color: #ffffff;
}

.time-picker-body {
  display: flex;
  gap: 8px;
  padding: 10px;
  overflow: hidden;
  flex: 1;
}

.time-picker-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.time-picker-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
  text-align: center;
  margin-bottom: 6px;
}

.time-picker-scroll {
  flex: 1;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.time-picker-scroll::-webkit-scrollbar {
  width: 4px;
}

.time-picker-scroll::-webkit-scrollbar-thumb {
  background: rgba(74, 144, 226, 0.5);
  border-radius: 2px;
}

.time-picker-item {
  padding: 4px 2px;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.time-picker-item:hover {
  background: rgba(74, 144, 226, 0.3);
}

.time-picker-item.active {
  background: rgba(74, 144, 226, 0.6);
  color: #ffffff;
  font-weight: 600;
}

.time-picker-footer {
  display: flex;
  gap: 10px;
  padding: 10px 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(6, 71, 117, 0.3);
  border-radius: 0 0 6px 6px;
}

.time-picker-btn {
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

.time-picker-btn:hover {
  opacity: 0.9;
  transform: scale(1.02);
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
