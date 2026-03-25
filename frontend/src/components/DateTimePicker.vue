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
/* 弹出面板定位 */
.datetime-picker-popper.el-popper {
  position: absolute !important;
  left: 0 !important;
  top: 100% !important;
  bottom: auto !important;
  margin-top: 4px !important;
  transform: none !important;
  inset: auto !important;
  width: 320px !important;
  max-height: none !important;
}

/* 面板主体 */
.datetime-picker-popper .el-picker-panel {
  width: 100% !important;
}

/* 面板内容区域 */
.datetime-picker-popper .el-picker-panel__body {
  padding: 6px !important;
}

/* 顶部时间输入区域 */
.datetime-picker-popper .el-date-picker__time-header {
  display: flex !important;
  flex-wrap: nowrap !important;
  justify-content: space-between !important;
  align-items: center !important;
  gap: 6px !important;
  padding: 6px !important;
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
  padding: 0 4px !important;
}

.datetime-picker-popper .el-date-picker__editor-wrap .el-input__inner {
  font-size: 12px !important;
  text-align: center !important;
}

/* 年份选择器 - 紧凑布局，不换行 */
.datetime-picker-popper .el-year-table {
  table-layout: fixed !important;
  width: 100% !important;
  border-collapse: collapse !important;
  border-spacing: 0 !important;
}

.datetime-picker-popper .el-year-table td {
  width: 25% !important;
  height: 32px !important;
  padding: 0 !important;
  margin: 0 !important;
  text-align: center !important;
  vertical-align: middle !important;
  border: none !important;
}

/* 年份单元格容器 */
.datetime-picker-popper .el-year-table td .el-date-table-cell {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  height: 28px !important;
  padding: 0 !important;
  box-sizing: border-box !important;
}

/* 年份文字 - 关键：强制不换行 */
.datetime-picker-popper .el-year-table td .el-date-table-cell__text {
  display: inline-block !important;
  white-space: nowrap !important;
  word-break: keep-all !important;
  font-size: 14px !important;
  line-height: 28px !important;
  padding: 0 4px !important;
}

/* 月份选择器 - 紧凑布局，不换行 */
.datetime-picker-popper .el-month-table {
  table-layout: fixed !important;
  width: 100% !important;
  border-collapse: collapse !important;
  border-spacing: 0 !important;
}

.datetime-picker-popper .el-month-table td {
  width: 25% !important;
  height: 32px !important;
  padding: 0 !important;
  margin: 0 !important;
  text-align: center !important;
  vertical-align: middle !important;
  border: none !important;
}

/* 月份单元格容器 */
.datetime-picker-popper .el-month-table td .el-date-table-cell {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  height: 28px !important;
  padding: 0 !important;
  box-sizing: border-box !important;
}

/* 月份文字 - 关键：强制不换行 */
.datetime-picker-popper .el-month-table td .el-date-table-cell__text {
  display: inline-block !important;
  white-space: nowrap !important;
  word-break: keep-all !important;
  font-size: 14px !important;
  line-height: 28px !important;
  padding: 0 4px !important;
}

/* 日期表格 */
.datetime-picker-popper .el-date-table {
  table-layout: fixed !important;
  width: 100% !important;
  font-size: 13px !important;
  border-collapse: collapse !important;
  border-spacing: 0 !important;
}

.datetime-picker-popper .el-date-table th {
  padding: 4px 0 !important;
  font-size: 13px !important;
  line-height: 20px !important;
}

.datetime-picker-popper .el-date-table td {
  padding: 0 !important;
  height: 26px !important;
}

.datetime-picker-popper .el-date-table td .el-date-table-cell {
  height: 24px !important;
  padding: 0 !important;
}

/* 时间面板 */
.datetime-picker-popper .el-time-panel {
  padding: 6px !important;
  width: 100% !important;
}

.datetime-picker-popper .el-time-spinner__item {
  font-size: 13px !important;
  height: 26px !important;
  line-height: 26px !important;
}

/* 底部按钮区 */
.datetime-picker-popper .el-picker-panel__footer {
  padding: 6px !important;
}

.datetime-picker-popper .el-picker-panel__footer .el-button {
  font-size: 13px !important;
  padding: 5px 12px !important;
  height: 26px !important;
}
</style>
