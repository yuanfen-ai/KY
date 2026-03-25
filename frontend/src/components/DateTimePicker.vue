<template>
  <div class="date-picker-container">
    <el-date-picker
      :model-value="startDateTime"
      @update:model-value="handleStartChange"
      type="datetime"
      :placeholder="startPlaceholder"
      format="YYYY-MM-DD HH:mm:ss"
      value-format="YYYY-MM-DD HH:mm:ss"
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
  overflow: visible;
  z-index: 100;
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

.date-separator {
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  padding: 0 2px;
}
</style>

<style>
/* ========== 全局样式：日期选择器弹出面板 ========== */

/* 弹出面板容器 - 显示在输入框上方 */
.datetime-picker .el-picker__popper {
  position: absolute !important;
  left: 0 !important;
  bottom: 100% !important;
  top: auto !important;
  margin-bottom: 4px !important;
  transform: none !important;
  inset: auto !important;
  width: 280px !important;
  max-height: 300px !important;
  overflow: visible !important;
}

/* 面板主体 */
.datetime-picker .el-picker-panel {
  width: 100% !important;
  min-width: 280px !important;
}

/* 面板内容区域 */
.datetime-picker .el-picker-panel__body {
  padding: 6px 8px !important;
  width: 100% !important;
}

/* 头部区域 */
.datetime-picker .el-date-picker__header {
  padding: 6px 8px !important;
  margin: 0 !important;
}

/* 日期表格 */
.datetime-picker .el-date-table {
  font-size: 12px !important;
}

.datetime-picker .el-date-table td {
  padding: 1px 0 !important;
  width: 36px !important;
  height: 22px !important;
}

.datetime-picker .el-date-table td .el-date-table-cell {
  height: 20px !important;
  padding: 0 2px !important;
}

/* ========== 年份选择器关键修复 ========== */

/* 年份表格 - 固定表格布局 */
.datetime-picker .el-year-table {
  table-layout: fixed !important;
  width: 100% !important;
  min-width: 260px !important;
  border-collapse: collapse !important;
}

/* 年份单元格 - 每行4个，每个25%宽度 */
.datetime-picker .el-year-table td {
  width: 25% !important;
  padding: 6px 4px !important;
  text-align: center !important;
  box-sizing: border-box !important;
}

/* 年份单元格内容 - 核心修复：不换行 */
.datetime-picker .el-year-table td .cell {
  display: inline-block !important;
  width: auto !important;
  min-width: 50px !important;
  padding: 0 8px !important;
  text-align: center !important;
  white-space: nowrap !important;
  font-size: 13px !important;
  line-height: 28px !important;
  height: 28px !important;
}

/* ========== 月份选择器 ========== */

.datetime-picker .el-month-table {
  table-layout: fixed !important;
  width: 100% !important;
  min-width: 260px !important;
}

.datetime-picker .el-month-table td {
  width: 25% !important;
  padding: 6px 4px !important;
  text-align: center !important;
}

.datetime-picker .el-month-table td .cell {
  display: inline-block !important;
  width: auto !important;
  min-width: 44px !important;
  padding: 0 4px !important;
  text-align: center !important;
  white-space: nowrap !important;
  font-size: 12px !important;
  line-height: 28px !important;
  height: 28px !important;
}

/* ========== 时间面板 ========== */

.datetime-picker .el-time-panel {
  padding: 6px !important;
  width: 100% !important;
}

.datetime-picker .el-time-spinner__item {
  font-size: 12px !important;
  height: 28px !important;
  line-height: 28px !important;
}

/* ========== 底部按钮区 ========== */

.datetime-picker .el-picker-panel__footer {
  padding: 6px 8px !important;
  border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
  background: rgba(0, 10, 30, 0.95) !important;
}

.datetime-picker .el-picker-panel__footer .el-button {
  font-size: 12px !important;
  padding: 4px 12px !important;
  height: 28px !important;
}
</style>
