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

/* 最简单直接的样式覆盖 - 针对所有 Element Plus 日期选择器 */
.el-input__wrapper {
  background-color: rgba(6, 71, 117, 0.8) !important;
  background: rgba(6, 71, 117, 0.8) !important;
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  box-shadow: none !important;
}

.el-input__wrapper:hover {
  background-color: rgba(6, 71, 117, 0.9) !important;
  background: rgba(6, 71, 117, 0.9) !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
}

.el-input__wrapper.is-focus {
  background-color: rgba(6, 71, 117, 1) !important;
  background: rgba(6, 71, 117, 1) !important;
  border-color: rgba(255, 255, 255, 0.6) !important;
}

.el-input__inner {
  color: #ffffff !important;
}

.el-input__inner::placeholder {
  color: rgba(255, 255, 255, 0.5) !important;
}

.el-input__prefix,
.el-input__suffix {
  color: rgba(255, 255, 255, 0.8) !important;
}

/* 所有弹出层样式 */
.el-popper,
.el-picker-panel,
.custom-date-picker {
  background-color: rgba(6, 71, 117, 0.95) !important;
  background: rgba(6, 71, 117, 0.95) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: #ffffff !important;
}

/* 日期选择器内部元素文字颜色 */
.el-picker-panel *,
.el-popper * {
  color: #ffffff !important;
}

/* 日期时间选择器面板样式优化 */
.el-picker-panel__body-wrapper {
  background-color: transparent !important;
}

.el-picker-panel__body {
  background-color: transparent !important;
}

/* 日期面板和时间面板分隔线样式 */
.el-picker-panel__sidebar {
  border-right: 1px solid rgba(255, 255, 255, 0.1) !important;
  background-color: transparent !important;
}

/* 日期面板和时间面板的过渡动画 */
.el-date-picker__time-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
  background-color: transparent !important;
}

/* 时间选择面板特定样式 */
.el-time-panel {
  background-color: rgba(6, 71, 117, 0.95) !important;
  background: rgba(6, 71, 117, 0.95) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-left: none !important;
}

.el-time-spinner {
  background-color: rgba(6, 71, 117, 0.95) !important;
  background: rgba(6, 71, 117, 0.95) !important;
}

.el-time-spinner__wrapper {
  background-color: transparent !important;
}

/* 当时间面板与日期面板拼接时 */
.el-date-picker__time-header {
  padding: 8px 10px !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15) !important;
}

.el-date-picker__editor-wrap {
  margin-left: 8px !important;
}

/* 时间输入框样式 */
.el-date-picker__editor-wrap .el-input__wrapper {
  background-color: rgba(255, 255, 255, 0.1) !important;
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.el-date-picker__editor-wrap .el-input__inner {
  color: #ffffff !important;
  text-align: center !important;
}

.el-date-picker__header-label,
.el-picker-panel__icon-btn {
  color: #ffffff !important;
}

.el-date-table th,
.el-date-table td,
.el-date-table-cell__text {
  color: #ffffff !important;
}

.el-date-table td.available:hover {
  background-color: rgba(255, 255, 55, 0.15) !important;
  background: rgba(255, 255, 255, 0.15) !important;
}

.el-date-table td.current:not(.disabled) .el-date-table-cell__text {
  background-color: #1890ff !important;
  background: #1890ff !important;
  color: #ffffff !important;
}

.el-time-panel,
.el-time-spinner__item {
  color: #ffffff !important;
}

.el-time-spinner__item:hover:not(.disabled):not(.active) {
  background-color: rgba(255, 255, 255, 0.15) !important;
  background: rgba(255, 255, 255, 0.15) !important;
  color: #ffffff !important;
}

.el-time-spinner__item.active:not(.disabled) {
  color: #1890ff !important;
  font-weight: bold !important;
}

/* 底部按钮区域样式 */
.el-picker-panel__footer {
  background-color: rgba(6, 71, 117, 0.95) !important;
  background: rgba(6, 71, 117, 0.95) !important;
  border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
  padding: 8px !important;
}

.el-button {
  background-color: rgba(6, 71, 117, 0.8) !important;
  background: rgba(6, 71, 117, 0.8) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
  color: #ffffff !important;
  padding: 6px 15px !important;
  font-size: 13px !important;
}

.el-button:hover {
  background-color: rgba(6, 71, 117, 1) !important;
  background: rgba(6, 71, 117, 1) !important;
  border-color: rgba(255, 255, 255, 0.4) !important;
}

.el-button--primary {
  background-color: #1890ff !important;
  background: #1890ff !important;
  border-color: #1890ff !important;
  color: #ffffff !important;
}

.el-button--primary:hover {
  background-color: #40a9ff !important;
  background: #40a9ff !important;
  border-color: #40a9ff !important;
}

.el-button--text {
  background-color: transparent !important;
  background: transparent !important;
  border-color: transparent !important;
  color: #1890ff !important;
}

.el-button--text:hover {
  background-color: rgba(24, 144, 255, 0.1) !important;
  background: rgba(24, 144, 255, 0.1) !important;
  color: #40a9ff !important;
}

.el-popper__arrow {
  background-color: rgba(6, 71, 117, 0.95) !important;
  background: rgba(6, 71, 117, 0.95) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
}
</style>
