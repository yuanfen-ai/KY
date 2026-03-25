<template>
  <div class="date-picker-container">
    <el-date-picker
      :model-value="startDateTime"
      @update:model-value="handleStartChange"
      type="datetime"
      :placeholder="startPlaceholder"
      format="YYYY-MM-DD HH:mm:ss"
      value-format="YYYY-MM-DD HH:mm:ss"
      popper-class="custom-date-picker"
      class="datetime-picker"
      :teleported="false"
    />
    <span class="date-separator">{{ separator }}</span>
    <el-date-picker
      :model-value="endDateTime"
      @update:model-value="handleEndChange"
      type="datetime"
      :placeholder="endPlaceholder"
      format="YYYY-MM-DD HH:mm:ss"
      value-format="YYYY-MM-DD HH:mm:ss"
      popper-class="custom-date-picker"
      class="datetime-picker"
      :teleported="false"
    />
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, withDefaults } from 'vue';

interface Props {
  startDateTime?: string;
  endDateTime?: string;
  startPlaceholder?: string;
  endPlaceholder?: string;
  separator?: string;
}

const props = withDefaults(defineProps<Props>(), {
  startDateTime: '',
  endDateTime: '',
  startPlaceholder: '选择开始时间',
  endPlaceholder: '选择结束时间',
  separator: '-'
});

const emit = defineEmits<{
  (e: 'update:startDateTime', value: string): void;
  (e: 'update:endDateTime', value: string): void;
}>();

const handleStartChange = (value: string) => {
  emit('update:startDateTime', value);
};

const handleEndChange = (value: string) => {
  emit('update:endDateTime', value);
};
</script>

<style scoped>
.date-picker-container {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  position: relative;
}

.datetime-picker {
  width: 180px !important;
  position: relative;
}

.datetime-picker :deep(.el-input__wrapper) {
  width: 180px !important;
}

.datetime-picker :deep(.el-input) {
  width: 180px !important;
}

/* 弹出面板定位 - 在输入框下方显示 */
.datetime-picker :deep(.el-picker__popper) {
  position: absolute !important;
  left: 0 !important;
  top: 100% !important;
  margin-top: 4px !important;
  transform: none !important;
  inset: auto !important;
}

.date-separator {
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  padding: 0 2px;
}
</style>

<style>
/* 年份选择面板 - 设置足够宽度防止换行 */
.custom-date-picker.el-date-picker.has-sidebar {
  width: auto !important;
}

/* 年份表格单元格宽度 */
.custom-date-picker .el-year-table {
  width: 100% !important;
}

.custom-date-picker .el-year-table td {
  width: 25% !important;
}

.custom-date-picker .el-year-table td .cell {
  display: inline-block !important;
  width: 100% !important;
  text-align: center !important;
  white-space: nowrap !important;
}
</style>
