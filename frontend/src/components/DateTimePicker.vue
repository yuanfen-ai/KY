<template>
  <div class="date-picker-container">
    <div class="picker-wrapper">
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
    </div>
    <span class="date-separator">{{ separator }}</span>
    <div class="picker-wrapper">
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

.picker-wrapper {
  position: relative;
  width: 180px;
}

.datetime-picker {
  width: 180px !important;
}

.date-separator {
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  padding: 0 2px;
}
</style>

<!-- 非 scoped 样式，强制覆盖 Element Plus 默认样式 -->
<style>
/* 弹出面板定位 - 增加宽度以容纳年份选择器 */
.datetime-picker-popper.el-popper {
  position: absolute !important;
  left: 0 !important;
  top: 100% !important;
  bottom: auto !important;
  margin-top: 4px !important;
  transform: none !important;
  inset: auto !important;
  width: 360px !important;
  max-height: none !important;
}

/* 面板主体 */
.datetime-picker-popper .el-picker-panel {
  width: 100% !important;
}

/* 面板内容区域 */
.datetime-picker-popper .el-picker-panel__body {
  padding: 8px !important;
}

/* 顶部时间输入区域 */
.datetime-picker-popper .el-date-picker__time-header {
  display: flex !important;
  flex-wrap: nowrap !important;
  justify-content: space-between !important;
  align-items: center !important;
  gap: 8px !important;
  padding: 8px !important;
}

.datetime-picker-popper .el-date-picker__editor-wrap {
  flex: 1 1 auto !important;
  min-width: 0 !important;
  max-width: 50% !important;
}

.datetime-picker-popper .el-date-picker__editor-wrap .el-input {
  width: 100% !important;
}

.datetime-picker-popper .el-date-picker__editor-wrap .el-input__wrapper {
  padding: 0 6px !important;
}

.datetime-picker-popper .el-date-picker__editor-wrap .el-input__inner {
  font-size: 12px !important;
  text-align: center !important;
}

/* 年份选择器 - 增加单元格宽度和高度 */
.datetime-picker-popper .el-year-table {
  table-layout: fixed !important;
  width: 100% !important;
}

.datetime-picker-popper .el-year-table td {
  width: 85px !important;
  height: 40px !important;
  padding: 3px 4px !important;
  text-align: center !important;
  vertical-align: middle !important;
}

.datetime-picker-popper .el-year-table td .cell {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  height: 34px !important;
  padding: 0 4px !important;
  text-align: center !important;
  white-space: nowrap !important;
  overflow: visible !important;
  font-size: 14px !important;
  line-height: 34px !important;
  word-break: keep-all !important;
}

/* 月份选择器 - 增加单元格宽度和高度 */
.datetime-picker-popper .el-month-table {
  table-layout: fixed !important;
  width: 100% !important;
}

.datetime-picker-popper .el-month-table td {
  width: 85px !important;
  height: 40px !important;
  padding: 3px 4px !important;
  text-align: center !important;
  vertical-align: middle !important;
}

.datetime-picker-popper .el-month-table td .cell {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  height: 34px !important;
  padding: 0 4px !important;
  text-align: center !important;
  white-space: nowrap !important;
  overflow: visible !important;
  font-size: 14px !important;
  line-height: 34px !important;
  word-break: keep-all !important;
}

/* 日期表格 */
.datetime-picker-popper .el-date-table {
  table-layout: fixed !important;
  width: 100% !important;
  font-size: 13px !important;
}

.datetime-picker-popper .el-date-table th {
  padding: 4px 0 !important;
  font-size: 13px !important;
  line-height: 22px !important;
}

.datetime-picker-popper .el-date-table td {
  padding: 2px 0 !important;
  height: 28px !important;
}

.datetime-picker-popper .el-date-table td .el-date-table-cell {
  height: 24px !important;
  padding: 0 2px !important;
}

/* 时间面板 */
.datetime-picker-popper .el-time-panel {
  padding: 8px !important;
  width: 100% !important;
}

.datetime-picker-popper .el-time-spinner__item {
  font-size: 13px !important;
  height: 28px !important;
  line-height: 28px !important;
}

/* 底部按钮区 */
.datetime-picker-popper .el-picker-panel__footer {
  padding: 8px !important;
}

.datetime-picker-popper .el-picker-panel__footer .el-button {
  font-size: 13px !important;
  padding: 6px 16px !important;
  height: 28px !important;
}
</style>
