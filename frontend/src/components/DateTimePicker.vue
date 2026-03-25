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
      popper-class="datetime-picker-popper"
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
      popper-class="datetime-picker-popper"
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

.date-separator {
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  padding: 0 2px;
}
</style>

<style>
/* ========== 弹出面板定位 ========== */

/* 强制定位弹出面板在输入框上方 */
.datetime-picker-popper.el-popper {
  position: absolute !important;
  left: 0 !important;
  bottom: 100% !important;
  top: auto !important;
  right: auto !important;
  margin-bottom: 8px !important;
  margin-top: 0 !important;
  transform: none !important;
  inset: auto !important;
  width: 290px !important;
  max-height: 340px !important;
  overflow: visible !important;
}

/* 面板主体 */
.datetime-picker-popper .el-picker-panel {
  width: 290px !important;
  min-width: 290px !important;
}

/* 面板内容区域 */
.datetime-picker-popper .el-picker-panel__body {
  padding: 8px !important;
}

/* 头部区域 */
.datetime-picker-popper .el-date-picker__header {
  padding: 8px 10px !important;
  margin: 0 !important;
}

/* ========== 年份选择器关键修复 ========== */

/* 年份表格 - 固定表格布局 */
.datetime-picker-popper .el-year-table {
  table-layout: fixed !important;
  width: 270px !important;
  border-collapse: separate !important;
  border-spacing: 2px !important;
}

/* 年份单元格 - 每行4个，固定宽度 */
.datetime-picker-popper .el-year-table td {
  width: 65px !important;
  min-width: 65px !important;
  max-width: 65px !important;
  height: 40px !important;
  padding: 0 !important;
  text-align: center !important;
  box-sizing: border-box !important;
  vertical-align: middle !important;
}

/* 年份单元格内容 - 核心修复：不换行 */
.datetime-picker-popper .el-year-table td .cell {
  display: inline-block !important;
  width: 60px !important;
  min-width: 60px !important;
  max-width: 60px !important;
  padding: 0 !important;
  text-align: center !important;
  white-space: nowrap !important;
  overflow: visible !important;
  font-size: 14px !important;
  font-weight: 400 !important;
  line-height: 36px !important;
  height: 36px !important;
}

/* ========== 月份选择器 ========== */

.datetime-picker-popper .el-month-table {
  table-layout: fixed !important;
  width: 270px !important;
}

.datetime-picker-popper .el-month-table td {
  width: 65px !important;
  min-width: 65px !important;
  height: 40px !important;
  padding: 0 !important;
  text-align: center !important;
}

.datetime-picker-popper .el-month-table td .cell {
  display: inline-block !important;
  width: 54px !important;
  min-width: 54px !important;
  text-align: center !important;
  white-space: nowrap !important;
  font-size: 13px !important;
  line-height: 36px !important;
  height: 36px !important;
}

/* ========== 日期表格 ========== */

.datetime-picker-popper .el-date-table {
  font-size: 12px !important;
}

.datetime-picker-popper .el-date-table td {
  padding: 2px 0 !important;
  width: 36px !important;
  height: 28px !important;
}

.datetime-picker-popper .el-date-table td .el-date-table-cell {
  height: 24px !important;
  padding: 0 2px !important;
}

/* ========== 时间面板 ========== */

.datetime-picker-popper .el-time-panel {
  padding: 8px !important;
  width: 100% !important;
}

.datetime-picker-popper .el-time-spinner__item {
  font-size: 12px !important;
  height: 28px !important;
  line-height: 28px !important;
}

/* ========== 底部按钮区 ========== */

.datetime-picker-popper .el-picker-panel__footer {
  padding: 8px 12px !important;
  border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.datetime-picker-popper .el-picker-panel__footer .el-button {
  font-size: 12px !important;
  padding: 6px 16px !important;
  height: 28px !important;
}
</style>
