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

/* Element Plus Date Picker 全局样式 - 最强优先级 */
.date-picker-input .el-input__wrapper,
.date-picker-input .el-input__wrapper *,
.date-picker-input.el-date-editor .el-input__wrapper,
.date-picker-input.el-date-editor .el-input__wrapper * {
  padding: 6px 8px !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 4px !important;
  background-color: rgba(6, 71, 117, 0.8) !important;
  background: rgba(6, 71, 117, 0.8) !important;
  box-shadow: none !important;
}

.date-picker-input .el-input__inner,
.date-picker-input .el-input__inner * {
  color: #ffffff !important;
  background: transparent !important;
  background-color: transparent !important;
}

.date-picker-input .el-input__inner::placeholder {
  color: rgba(255, 255, 255, 0.5) !important;
}

/* 最直接的方式 - 覆盖所有 Element Plus popper 下拉菜单 */
.el-popper,
.el-popper[data-popper-class*="custom-date-picker"],
.el-popper[class*="custom-date-picker"],
body > .el-popper,
body > div[class*="el-popper"],
body > div[class*="el-picker"] {
  background: rgba(6, 71, 117, 0.95) !important;
  background-color: rgba(6, 71, 117, 0.95) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
}

.el-picker-panel,
.el-picker-panel *,
.el-picker-panel *::before,
.el-picker-panel *::after {
  background: transparent !important;
  background-color: transparent !important;
  color: #ffffff !important;
}

.el-picker-panel {
  border: none !important;
}

.el-date-picker__header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.el-date-picker__header-label {
  color: #ffffff !important;
}

.el-picker-panel__icon-btn {
  color: rgba(255, 255, 255, 0.8) !important;
}

.el-date-table th {
  color: rgba(255, 255, 255, 0.6) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.el-date-table td {
  color: #ffffff !important;
}

.el-date-table td.available:hover {
  background: rgba(255, 255, 255, 0.15) !important;
  background-color: rgba(255, 255, 255, 0.15) !important;
}

.el-date-table td.today .el-date-table-cell__text {
  color: #1890ff !important;
  font-weight: bold !important;
}

.el-date-table td.current:not(.disabled) .el-date-table-cell__text {
  background: #1890ff !important;
  background-color: #1890ff !important;
  color: #ffffff !important;
}

.el-date-table-cell__text {
  color: #ffffff !important;
}

.el-time-panel {
  background: rgba(6, 71, 117, 0.95) !important;
  background-color: rgba(6, 71, 117, 0.95) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.el-time-spinner__item {
  color: rgba(255, 255, 255, 0.6) !important;
}

.el-time-spinner__item:hover:not(.disabled):not(.active) {
  color: #ffffff !important;
  background: rgba(255, 255, 255, 0.15) !important;
  background-color: rgba(255, 255, 255, 0.15) !important;
}

.el-time-spinner__item.active:not(.disabled) {
  color: #ffffff !important;
  font-weight: bold !important;
  background: rgba(24, 144, 255, 0.3) !important;
  background-color: rgba(24, 144, 255, 0.3) !important;
}

.el-picker-panel__footer {
  border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.el-button {
  background: rgba(6, 71, 117, 0.8) !important;
  background-color: rgba(6, 71, 117, 0.8) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
  color: #ffffff !important;
}

.el-button--primary {
  background: #1890ff !important;
  background-color: #1890ff !important;
  border-color: #1890ff !important;
  color: #ffffff !important;
}

.el-popper__arrow {
  background: rgba(6, 71, 117, 0.95) !important;
  background-color: rgba(6, 71, 117, 0.95) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
}
</style>
