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
      :popper-options="popperOptions"
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
      :popper-options="popperOptions"
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

// Popper 配置 - 控制弹出面板位置
const popperOptions = {
  placement: 'bottom-start' as const,
  strategy: 'absolute' as const,
  modifiers: [
    {
      name: 'preventOverflow',
      options: {
        boundary: 'viewport',
        padding: 8
      }
    },
    {
      name: 'flip',
      options: {
        fallbackPlacements: ['bottom-start', 'bottom-end', 'top-start', 'top-end'],
        padding: 8
      }
    }
  ]
};

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

.datetime-picker :deep(.el-date-editor) {
  position: relative;
}

/* 弹出面板定位样式 */
.datetime-picker :deep(.el-picker__popper) {
  position: absolute !important;
  left: 0 !important;
  top: 100% !important;
  margin-top: 4px !important;
  z-index: 2000 !important;
}

.date-separator {
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  padding: 0 2px;
}
</style>

<!-- 全局样式覆盖日期选择器面板 -->
<style>
/* 自定义日期选择器面板样式 - 确保整体宽度足够 */
.custom-date-picker {
  padding: 6px !important;
  min-width: 320px !important;
  max-width: 350px !important;
}

/* 面板主体 - datetime类型会有日期和时间两列 */
.custom-date-picker.el-picker-panel {
  min-width: 320px !important;
}

.custom-date-picker .el-picker-panel__body-wrapper {
  min-width: 100% !important;
}

.custom-date-picker .el-picker-panel__body {
  padding: 6px !important;
  display: flex !important;
  flex-direction: row !important;
  min-width: 100% !important;
}

/* 日期面板 */
.custom-date-picker .el-picker-panel__content {
  margin: 0 !important;
  padding: 0 !important;
  width: auto !important;
  min-width: 230px !important;
  float: none !important;
}

/* 日期内容区域 */
.custom-date-picker .el-date-picker__content {
  padding: 4px !important;
  margin: 0 !important;
  width: 230px !important;
  box-sizing: border-box !important;
  float: none !important;
}

/* 日期面板头部 - 年月选择行 */
.custom-date-picker .el-date-picker__header {
  padding: 6px 10px !important;
  margin-bottom: 4px !important;
  margin-top: 0 !important;
  height: auto !important;
}

/* 头部按钮 */
.custom-date-picker .el-date-picker__header-btn {
  font-size: 13px !important;
}

/* 头部标题 */
.custom-date-picker .el-date-picker__header-label {
  font-size: 14px !important;
  padding: 0 6px !important;
  line-height: 1.5 !important;
}

/* 星期行 */
.custom-date-picker .el-date-table th {
  padding: 2px 0 !important;
  font-size: 12px !important;
  line-height: 1.4 !important;
}

/* 日期单元格 */
.custom-date-picker .el-date-table td {
  padding: 1px !important;
}

.custom-date-picker .el-date-table td .el-date-table-cell {
  height: 24px !important;
  width: 24px !important;
  line-height: 24px !important;
}

.custom-date-picker .el-date-table td .el-date-table-cell__text {
  font-size: 12px !important;
  height: 22px !important;
  width: 22px !important;
  line-height: 22px !important;
}

/* 时间选择器头部 */
.custom-date-picker .el-date-picker__time-header {
  padding: 6px 10px !important;
  border-bottom: 1px solid #ebeef5 !important;
}

.custom-date-picker .el-date-picker__editor-wrap {
  width: auto !important;
}

.custom-date-picker .el-date-picker__editor-wrap .el-input__wrapper {
  padding: 0 8px !important;
}

.custom-date-picker .el-date-picker__editor-wrap .el-input__inner {
  font-size: 12px !important;
}

/* 时间面板侧边栏 */
.custom-date-picker .el-picker-panel__sidebar {
  width: 90px !important;
  padding: 6px !important;
  border-left: 1px solid #ebeef5 !important;
}

.custom-date-picker .el-picker-panel__shortcut {
  font-size: 12px !important;
  padding: 4px 8px !important;
}

/* 时间面板 */
.custom-date-picker .el-time-panel {
  width: 100px !important;
}

.custom-date-picker .el-time-panel__content {
  padding: 4px !important;
}

.custom-date-picker .el-time-spinner__item {
  font-size: 12px !important;
  height: 24px !important;
  line-height: 24px !important;
}

/* 底部按钮 */
.custom-date-picker .el-picker-panel__footer {
  padding: 6px 10px !important;
  border-top: 1px solid #ebeef5 !important;
}

.custom-date-picker .el-picker-panel__link-btn {
  padding: 4px 10px !important;
  font-size: 12px !important;
}

/* 年月选择面板 - 确保正确布局 */
.custom-date-picker .el-month-table,
.custom-date-picker .el-year-table {
  width: 100% !important;
  margin: 4px 0 !important;
  border-collapse: separate !important;
  border-spacing: 4px !important;
  table-layout: fixed !important;
}

.custom-date-picker .el-month-table td,
.custom-date-picker .el-year-table td {
  text-align: center !important;
  padding: 4px 2px !important;
  cursor: pointer !important;
}

.custom-date-picker .el-month-table td .cell,
.custom-date-picker .el-year-table td .cell {
  font-size: 12px !important;
  display: block !important;
  text-align: center !important;
  line-height: 1.6 !important;
  width: 100% !important;
}
</style>
