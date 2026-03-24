<template>
  <div class="pagination-area">
    <div class="pagination-info">
      共 {{ totalRecords }} 条数据
    </div>
    <div class="pagination-controls">
      <button class="pagination-btn" @click="goToFirstPage" :disabled="currentPage === 1">
        首页
      </button>
      <button class="pagination-btn" @click="goToPrevPage" :disabled="currentPage === 1">
        上一页
      </button>
      <div class="pagination-current">
        第 {{ currentPage }} 页
      </div>
      <button class="pagination-btn" @click="goToNextPage" :disabled="currentPage === totalPages">
        下一页
      </button>
      <button class="pagination-btn" @click="goToLastPage" :disabled="currentPage === totalPages">
        末页
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, withDefaults, computed } from 'vue';

interface Props {
  currentPage?: number;
  totalRecords: number;
  pageSize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  currentPage: 1,
  pageSize: 6
});

const emit = defineEmits<{
  (e: 'update:currentPage', value: number): void;
  (e: 'page-change', value: number): void;
}>();

// 计算总页数
const totalPages = computed(() => {
  return Math.ceil(props.totalRecords / props.pageSize);
});

// 分页操作方法
const goToFirstPage = () => {
  emit('update:currentPage', 1);
  emit('page-change', 1);
};

const goToPrevPage = () => {
  if (props.currentPage > 1) {
    const newPage = props.currentPage - 1;
    emit('update:currentPage', newPage);
    emit('page-change', newPage);
  }
};

const goToNextPage = () => {
  if (props.currentPage < totalPages.value) {
    const newPage = props.currentPage + 1;
    emit('update:currentPage', newPage);
    emit('page-change', newPage);
  }
};

const goToLastPage = () => {
  const lastPage = totalPages.value;
  emit('update:currentPage', lastPage);
  emit('page-change', lastPage);
};
</script>

<style scoped>
/* 分页导航区域 */
.pagination-area {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  background: rgba(6, 71, 117, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
  height: 32px;
}

.pagination-info {
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pagination-btn {
  padding: 0;
  min-width: 48px;
  height: 24px;
  background: url('/backgrounds/按钮3.png') no-repeat center center;
  background-size: 100% 100%;
  border: none;
  color: #ffffff;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  padding: 0 8px;
}

.pagination-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 0 15px rgba(24, 144, 255, 0.5);
}

.pagination-btn:active:not(:disabled) {
  transform: scale(0.95);
  box-shadow: 0 0 8px rgba(24, 144, 255, 0.8);
}

.pagination-btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.3s ease, height 0.3s ease, opacity 0.3s ease;
  opacity: 0;
}

.pagination-btn:active::after {
  width: 100px;
  height: 100px;
  opacity: 0;
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-btn:disabled:hover {
  transform: none;
  box-shadow: none;
}

.pagination-current {
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
}
</style>
