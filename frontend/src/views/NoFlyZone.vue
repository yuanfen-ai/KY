<template>
  <div class="nofly-page-wrapper">
    <div class="nofly-container">
      <!-- 顶部标题栏 -->
      <div class="header-bar">
        <div class="header-left">
          <button class="back-btn" @click="goBack">
            <span class="back-icon">←</span>
          </button>
        </div>
        <div class="header-title">禁飞区设置</div>
        <div class="header-right">
          <span class="nofly-label">禁飞区</span>
          <span class="nofly-icon">❄️</span>
        </div>
      </div>

      <!-- 操作区域 -->
      <div class="operation-bar">
        <button class="complete-btn">
          <span class="check-icon">✓</span>
          <span>完成</span>
        </button>
        
        <div class="search-inputs">
          <div class="input-wrapper">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              v-model="locationInfo" 
              placeholder="请输入位置信息"
              class="search-input"
            />
          </div>
          <div class="input-wrapper">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              v-model="longitude" 
              placeholder="请输入经度"
              class="search-input small"
            />
          </div>
          <div class="input-wrapper">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              v-model="latitude" 
              placeholder="请输入纬度"
              class="search-input small"
            />
          </div>
        </div>
        
        <button class="map-pick-btn">
          <span class="pick-icon">📍</span>
          <span>地图拾取</span>
        </button>
      </div>

      <!-- 地图显示区域 -->
      <div class="map-area">
        <div class="map-container">
          <!-- 地图背景 - 使用卫星图样式 -->
          <div class="map-background">
            <!-- 示例地标 -->
            <div class="map-placeholder">
              <span class="placeholder-icon">🗺️</span>
              <span class="placeholder-text">地图加载中...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// 输入框数据
const locationInfo = ref('');
const longitude = ref('');
const latitude = ref('');

// 返回上一页
const goBack = () => {
  router.push('/main');
};
</script>

<style scoped>
/* 页面包装器 */
.nofly-page-wrapper {
  width: 100vw;
  height: 100vh;
  background: #0f0f1a;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  overflow: hidden;
}

/* 主容器 - 16:10比例 */
.nofly-container {
  aspect-ratio: 16 / 10;
  width: 100%;
  max-width: 800px;
  max-height: 500px;
  height: auto;
  background: #1a1a2e;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 顶部标题栏 */
.header-bar {
  background: #0a1628;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-left {
  width: 60px;
}

.back-btn {
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 24px;
  cursor: pointer;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.back-icon {
  font-size: 20px;
}

.header-title {
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  flex: 1;
}

.header-right {
  width: 80px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}

.nofly-label {
  color: #ffffff;
  font-size: 13px;
}

.nofly-icon {
  font-size: 14px;
}

/* 操作区域 */
.operation-bar {
  background: #0d1b2a;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

/* 完成按钮 */
.complete-btn {
  background: #0a3d62;
  border: none;
  color: #ffffff;
  padding: 8px 12px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.complete-btn:hover {
  background: #0c4a75;
}

.check-icon {
  font-size: 14px;
}

/* 搜索输入框组 */
.search-inputs {
  display: flex;
  gap: 8px;
  flex: 1;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
}

.input-wrapper:first-child {
  flex: 1.5;
}

.search-icon {
  position: absolute;
  left: 8px;
  font-size: 12px;
  color: #888;
}

.search-input {
  width: 100%;
  background: #1a2a3a;
  border: 1px solid #2a3a4a;
  color: #ffffff;
  padding: 8px 8px 8px 28px;
  border-radius: 4px;
  font-size: 12px;
  outline: none;
  transition: all 0.2s ease;
}

.search-input::placeholder {
  color: #666;
}

.search-input:focus {
  border-color: #4a9eff;
  box-shadow: 0 0 4px rgba(74, 158, 255, 0.3);
}

.search-input.small {
  flex: 1;
  min-width: 80px;
}

/* 地图拾取按钮 */
.map-pick-btn {
  background: #0a3d62;
  border: none;
  color: #ffffff;
  padding: 8px 12px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.map-pick-btn:hover {
  background: #0c4a75;
}

.pick-icon {
  font-size: 14px;
}

/* 地图区域 */
.map-area {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.map-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.map-background {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #2d3a4a 0%, #1a2a3a 50%, #2d3a4a 100%);
  position: relative;
}

/* 地图占位符 */
.map-placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #666;
}

.placeholder-icon {
  font-size: 48px;
  opacity: 0.5;
}

.placeholder-text {
  font-size: 14px;
  opacity: 0.7;
}

/* 响应式适配 */
@media (max-width: 850px) {
  .nofly-container {
    max-width: 100%;
    max-height: 100%;
    border-radius: 0;
  }
}

@media (max-width: 600px) {
  .operation-bar {
    flex-wrap: wrap;
    gap: 8px;
    padding: 8px;
  }
  
  .search-inputs {
    width: 100%;
    order: 2;
  }
  
  .complete-btn,
  .map-pick-btn {
    flex: 1;
    justify-content: center;
  }
}
</style>
