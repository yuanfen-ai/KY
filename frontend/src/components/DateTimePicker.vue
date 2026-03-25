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

<!-- 全局样式覆盖日期选择器面板 -->
<style>
/* 自定义日期选择器面板样式 */
.custom-date-picker {
  padding: 6px !important;
}

/* 年月选择面板表格 - 缩小单元格间距 */
.custom-date-picker .el-month-table,
.custom-date-picker .el-year-table {
  margin: 4px 0 !important;
}

/* 年月单元格 - 增加宽度防止换行，缩小间距 */
.custom-date-picker .el-month-table td,
.custom-date-picker .el-year-table td {
  padding: 4px 0 !important;
}

/* 年月单元格内容 - 不换行 */
.custom-date-picker .el-month-table td .cell,
.custom-date-picker .el-year-table td .cell {
  font-size: 12px !important;
  white-space: nowrap !important;
  display: inline-block !important;
}
</style>
