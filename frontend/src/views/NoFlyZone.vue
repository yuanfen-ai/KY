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
        <button class="complete-btn" @click="handleComplete">
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
        
        <button class="map-pick-btn" @click="handleMapPick">
          <span class="pick-icon">📍</span>
          <span>地图拾取</span>
        </button>
      </div>

      <!-- 地图显示区域 -->
      <div class="map-area">
        <div class="map-container">
          <!-- 地图服务 iframe -->
          <iframe
            ref="mapIframe"
            :src="mapServiceUrl"
            class="map-iframe"
            frameborder="0"
            allowfullscreen
            @load="onMapIframeLoad"
            @error="onMapIframeError"
          ></iframe>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { MAP_CONFIG } from '@/config';

const router = useRouter();

// 地图相关
const mapIframe = ref<HTMLIFrameElement | null>(null);
const mapServiceUrl = MAP_CONFIG.ENABLED ? MAP_CONFIG.MAP_URL : '';
const isMapReady = ref(false);
const mapLoadError = ref(false);

console.log('[NoFlyZone] 地图服务配置:', {
  enabled: MAP_CONFIG.ENABLED,
  url: mapServiceUrl
});
const longitude = ref('');
const latitude = ref('');
const locationInfo = ref('');

// 返回上一页
const goBack = () => {
  router.push('/main');
};

// 完成按钮
const handleComplete = () => {
  console.log('[NoFlyZone] 完成按钮点击');
  console.log('[NoFlyZone] 位置信息:', locationInfo.value);
  console.log('[NoFlyZone] 经度:', longitude.value);
  console.log('[NoFlyZone] 纬度:', latitude.value);
  
  // TODO: 保存禁飞区设置
  
  // 返回主界面
  router.push('/main');
};

// 地图拾取按钮
const handleMapPick = () => {
  console.log('[NoFlyZone] 地图拾取按钮点击');
  
  if (!isMapReady.value || !mapIframe.value?.contentWindow) {
    console.warn('[NoFlyZone] 地图未就绪');
    return;
  }
  
  // 发送消息到地图，启用拾取模式
  mapIframe.value.contentWindow.postMessage({
    type: 'START_PICK_LOCATION',
    source: 'nofly-zone'
  }, '*');
};

// 地图iframe加载完成回调
const onMapIframeLoad = () => {
  console.log('[NoFlyZone] 地图iframe加载完成');
  mapLoadError.value = false;
  
  if (!mapIframe.value) {
    console.warn('[NoFlyZone] 地图iframe引用为空');
    return;
  }

  // 设置消息监听，接收来自地图的消息
  window.addEventListener('message', handleMapMessage);
  
  // 延迟调用初始化函数，确保iframe内的JS完全加载
  setTimeout(() => {
    try {
      const iframeWindow = mapIframe.value?.contentWindow as any;
      if (!iframeWindow) {
        console.warn('[NoFlyZone] 无法获取iframe的contentWindow');
        return;
      }
      
      console.log('[NoFlyZone] 尝试调用地图初始化函数...');
      
      // 发送初始化消息到地图
      iframeWindow.postMessage({
        type: 'INIT',
        source: 'nofly-zone'
      }, '*');
      
      // 调用地图初始化函数
      if (typeof iframeWindow.initView_3d === 'function') {
        console.log('[NoFlyZone] 调用地图初始化函数 initView_3d');
        iframeWindow.initView_3d();
        isMapReady.value = true;
      } else {
        console.warn('[NoFlyZone] 地图初始化函数 initView_3d 不存在');
        // 再次延迟重试
        setTimeout(() => {
          if (typeof iframeWindow.initView_3d === 'function') {
            console.log('[NoFlyZone] 延迟调用地图初始化函数 initView_3d');
            iframeWindow.initView_3d();
            isMapReady.value = true;
          } else {
            console.warn('[NoFlyZone] 地图初始化函数 initView_3d 仍不可用，可能需要在地图服务端检查');
          }
        }, MAP_CONFIG.INIT_RETRY_DELAY);
      }
    } catch (error) {
      console.error('[NoFlyZone] 调用地图初始化失败:', error);
    }
  }, MAP_CONFIG.INIT_DELAY);
};

// 地图iframe加载错误回调
const onMapIframeError = () => {
  console.error('[NoFlyZone] 地图iframe加载失败');
  mapLoadError.value = true;
};

// 处理来自地图的消息
const handleMapMessage = (event: MessageEvent) => {
  // 安全检查：在生产环境中应该验证origin
  // if (event.origin !== MAP_CONFIG.BASE_URL) return;
  
  const message = event.data;
  if (!message || !message.type) return;
  
  console.log('[NoFlyZone] 收到地图消息:', message);
  
  switch (message.type) {
    case 'MAP_READY':
      console.log('[NoFlyZone] 地图服务已就绪');
      isMapReady.value = true;
      break;
    case 'LOCATION_SELECTED':
      // 处理位置选择
      console.log('[NoFlyZone] 位置选择:', message.payload);
      if (message.payload) {
        longitude.value = message.payload.longitude?.toString() || '';
        latitude.value = message.payload.latitude?.toString() || '';
      }
      break;
    default:
      break;
  }
};

onMounted(() => {
  console.log('[NoFlyZone] 组件挂载');
  console.log('[NoFlyZone] 地图服务URL:', mapServiceUrl);
});

onUnmounted(() => {
  // 移除地图消息监听
  window.removeEventListener('message', handleMapMessage);
});
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
  background: rgba(3, 22, 50, 0.8);
  height: 24px;
  padding: 0 16px;
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

/* 地图iframe样式 */
.map-iframe {
  width: 100%;
  height: 100%;
  border: none;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

/* 地图占位符 */
.map-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: linear-gradient(135deg, #2d3a4a 0%, #1a2a3a 50%, #2d3a4a 100%);
  color: #666;
  z-index: 2;
}

.placeholder-icon {
  font-size: 48px;
  opacity: 0.5;
}

.placeholder-text {
  font-size: 14px;
  opacity: 0.7;
}

.placeholder-hint {
  font-size: 12px;
  opacity: 0.5;
  margin-top: 8px;
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
