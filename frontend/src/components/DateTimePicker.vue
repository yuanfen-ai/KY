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

<!-- 全局样式覆盖日期选择器面板高度 -->
<style>
/* 自定义日期选择器面板样式 */
.custom-date-picker {
  /* 缩小整体面板内边距 */
  padding: 4px !important;
}

/* 缩小日期面板头部 - 年月选择行 */
.custom-date-picker .el-date-picker__header {
  padding: 2px 6px !important;
  margin-bottom: 2px !important;
  margin-top: 0 !important;
}

/* 缩小头部按钮 */
.custom-date-picker .el-date-picker__header-btn {
  font-size: 12px !important;
}

/* 缩小头部标题 */
.custom-date-picker .el-date-picker__header-label {
  font-size: 12px !important;
  padding: 0 2px !important;
  line-height: 1.5 !important;
}

/* 缩小星期行 */
.custom-date-picker .el-date-table th {
  padding: 1px 0 !important;
  font-size: 11px !important;
  line-height: 1.2 !important;
}

/* 缩小日期单元格 */
.custom-date-picker .el-date-table td {
  padding: 0 !important;
}

.custom-date-picker .el-date-table td .el-date-table-cell {
  height: 20px !important;
  width: 20px !important;
  line-height: 20px !important;
}

.custom-date-picker .el-date-table td .el-date-table-cell__text {
  font-size: 11px !important;
  height: 18px !important;
  width: 18px !important;
  line-height: 18px !important;
}

/* 缩小时间选择器头部 */
.custom-date-picker .el-date-picker__time-header {
  padding: 2px 6px !important;
  border-bottom: 1px solid #ebeef5 !important;
}

.custom-date-picker .el-date-picker__editor-wrap {
  width: auto !important;
}

.custom-date-picker .el-date-picker__editor-wrap .el-input__wrapper {
  padding: 0 4px !important;
}

.custom-date-picker .el-date-picker__editor-wrap .el-input__inner {
  font-size: 11px !important;
}

/* 缩小时间面板 */
.custom-date-picker .el-time-panel {
  width: 110px !important;
}

.custom-date-picker .el-time-panel__content {
  padding: 0 2px !important;
}

.custom-date-picker .el-time-spinner__item {
  font-size: 11px !important;
  height: 20px !important;
  line-height: 20px !important;
}

/* 缩小底部按钮 */
.custom-date-picker .el-picker-panel__footer {
  padding: 4px 6px !important;
  border-top: 1px solid #ebeef5 !important;
}

.custom-date-picker .el-picker-panel__link-btn {
  padding: 2px 6px !important;
  font-size: 11px !important;
}

/* 缩小年月选择面板 */
.custom-date-picker .el-month-table td .cell {
  font-size: 11px !important;
  padding: 2px !important;
}

.custom-date-picker .el-year-table td .cell {
  font-size: 11px !important;
  padding: 2px !important;
}

/* 缩小日期面板主体 */
.custom-date-picker .el-picker-panel__body {
  padding: 0 4px !important;
}

.custom-date-picker .el-picker-panel__content {
  margin: 0 !important;
  padding: 0 !important;
}

/* 缩小面板内容区域 */
.custom-date-picker .el-date-picker__content {
  padding: 0 4px !important;
  margin: 0 !important;
}
</style>
