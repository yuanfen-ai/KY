<template>
  <div class="panel-template">
    <!-- 标题栏 -->
    <div class="panel-header">
      <span class="panel-title">{{ title }}</span>
      <button v-if="showCloseBtn" class="close-btn" @click="handleClose">×</button>
    </div>
    <!-- 内容区域 -->
    <div class="panel-body">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string;
  showCloseBtn?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: '面板标题',
  showCloseBtn: true
});

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const handleClose = () => {
  emit('close');
};
</script>

<style scoped>
/* 面板模板容器 */
.panel-template {
  position: absolute;
  top: 44px;
  right: 10px;
  width: 216px;
  bottom: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  background: url('/backgrounds/斜弹框背景图.png') no-repeat center center;
  background-size: cover;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

/* 标题栏 */
.panel-header {
  width: 100%;
  height: 32px;
  background: url('/backgrounds/小标题样式3 拷贝 2.png') no-repeat center center;
  background-size: 100% 100%;
  padding: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.panel-title {
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  padding-left: 10px;
}

.close-btn {
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 18px;
  cursor: pointer;
  padding: 0 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* 内容区 */
.panel-body {
  width: 100%;
  flex: 1;
  padding: 8px;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  /* 隐藏滚动条但保持功能 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

.panel-body::-webkit-scrollbar {
  display: none; /* Chrome/Safari/Opera */
}
</style>
