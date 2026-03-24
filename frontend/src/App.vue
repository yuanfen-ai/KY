<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

console.log('[App] 组件开始加载...');

onMounted(() => {
  console.log('[App] onMounted 执行');

  // 设置页面标题
  document.title = '手持察打一体设备';

  console.log('[App] 页面标题已设置');
});

console.log('[App] 组件设置完成');
</script>

<style>
/* 全局样式重置 */
html {
  margin: 0;
  padding: 0;
}

body {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* Element Plus Date Picker 全局样式 */
.date-picker-input .el-input__wrapper {
  padding: 6px 8px !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 4px !important;
  background-color: rgba(6, 71, 117, 0.8) !important;
  background: rgba(6, 71, 117, 0.8) !important;
  box-shadow: none !important;
}

.date-picker-input .el-input__wrapper:hover {
  border-color: rgba(255, 255, 255, 0.5) !important;
  background-color: rgba(6, 71, 117, 0.85) !important;
  background: rgba(6, 71, 117, 0.85) !important;
}

.date-picker-input .el-input__wrapper.is-focus {
  border-color: rgba(255, 255, 255, 0.6) !important;
  background-color: rgba(6, 71, 117, 1) !important;
  background: rgba(6, 71, 117, 1) !important;
}

.date-picker-input .el-input__inner {
  color: #ffffff !important;
  background: transparent !important;
  background-color: transparent !important;
}

.date-picker-input .el-input__inner::placeholder {
  color: rgba(255, 255, 255, 0.5) !important;
}

.date-picker-input .el-input__prefix,
.date-picker-input .el-input__suffix {
  color: rgba(255, 255, 255, 0.8) !important;
}

.date-picker-input .el-date-editor {
  background: rgba(6, 71, 117, 0.8) !important;
  background-color: rgba(6, 71, 117, 0.8) !important;
}

/* Element Plus Date Picker 下拉面板样式 */
.custom-date-picker,
.custom-date-picker.el-popper {
  background: rgba(6, 71, 117, 0.95) !important;
  background-color: rgba(6, 71, 117, 0.95) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
}

.custom-date-picker .el-picker-panel,
.custom-date-picker .el-picker-panel__content {
  background: transparent !important;
  background-color: transparent !important;
  border: none !important;
  color: #ffffff !important;
}

.custom-date-picker .el-date-picker__header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
  background: transparent !important;
}

.custom-date-picker .el-date-picker__header-label {
  color: #ffffff !important;
}

.custom-date-picker .el-picker-panel__icon-btn {
  color: rgba(255, 255, 255, 0.8) !important;
}

.custom-date-picker .el-date-table th {
  color: rgba(255, 255, 255, 0.6) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
  background: transparent !important;
}

.custom-date-picker .el-date-table td {
  color: #ffffff !important;
}

.custom-date-picker .el-date-table td.available:hover {
  background: rgba(255, 255, 255, 0.15) !important;
  background-color: rgba(255, 255, 255, 0.15) !important;
}

.custom-date-picker .el-date-table td.today .el-date-table-cell__text {
  color: #1890ff !important;
  font-weight: bold !important;
}

.custom-date-picker .el-date-table td.current:not(.disabled) .el-date-table-cell__text {
  background: #1890ff !important;
  background-color: #1890ff !important;
  color: #ffffff !important;
}

.custom-date-picker .el-date-table-cell__text {
  color: #ffffff !important;
}

.custom-date-picker .el-time-panel {
  background: rgba(6, 71, 117, 0.95) !important;
  background-color: rgba(6, 71, 117, 0.95) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.custom-date-picker .el-time-spinner__item {
  color: rgba(255, 255, 255, 0.6) !important;
}

.custom-date-picker .el-time-spinner__item:hover:not(.disabled):not(.active) {
  color: #ffffff !important;
  background: rgba(255, 255, 255, 0.15) !important;
  background-color: rgba(255, 255, 255, 0.15) !important;
}

.custom-date-picker .el-time-spinner__item.active:not(.disabled) {
  color: #ffffff !important;
  font-weight: bold !important;
  background: rgba(24, 144, 255, 0.3) !important;
  background-color: rgba(24, 144, 255, 0.3) !important;
}

.custom-date-picker .el-picker-panel__footer {
  border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
  background: transparent !important;
  background-color: transparent !important;
}

.custom-date-picker .el-button {
  background: rgba(6, 71, 117, 0.8) !important;
  background-color: rgba(6, 71, 117, 0.8) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
  color: #ffffff !important;
}

.custom-date-picker .el-button--primary {
  background: #1890ff !important;
  background-color: #1890ff !important;
  border-color: #1890ff !important;
  color: #ffffff !important;
}

.custom-date-picker,
.custom-date-picker *,
.custom-date-picker *::before,
.custom-date-picker *::after {
  background-color: transparent !important;
}

.custom-date-picker {
  background-color: rgba(6, 71, 117, 0.95) !important;
}

.custom-date-picker .el-popper__arrow {
  background: rgba(6, 71, 117, 0.95) !important;
  background-color: rgba(6, 71, 117, 0.95) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
}
</style>
