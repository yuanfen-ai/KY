<template>
  <div class="nofly-page-wrapper">
    <div class="nofly-container">
      <!-- 顶部状态栏 -->
      <div class="status-bar">
        <div class="device-name">手持式察打一体枪</div>
        <div class="status-items">
          <div class="status-item">
            <span class="icon">📶</span>
            <span>4G/5G</span>
          </div>
          <div class="status-item">
            <span class="time">{{ currentTime }}</span>
          </div>
          <div class="status-item">
            <span class="icon">🔋</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      <!-- 地图显示区域 -->
      <div class="map-area">
        <!-- 标题栏 - 悬浮于地图之上 -->
        <div class="header-bar">
          <div class="header-left">
            <button class="back-btn" @click="goBack">
              <span class="back-icon">←</span>
            </button>
          </div>
          <div class="header-title">禁飞区设置</div>
          <div class="header-right">
            <button class="header-action-btn" @click="handleNoFlyZoneClick">
              <span class="action-icon">
                <!-- 禁止飞行图标 - 简洁线条风格 -->
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <!-- 飞机主体 - 简洁线条 -->
                  <path d="M12 3V7" stroke="white" stroke-width="2" stroke-linecap="round"/>
                  <path d="M12 7L7 10" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 7L17 10" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 7V19" stroke="white" stroke-width="2" stroke-linecap="round"/>
                  <path d="M12 19L6 22" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 19L18 22" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M8 13L12 11L16 13" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <!-- 禁止符号 - 圆环+斜线 -->
                  <circle cx="12" cy="12" r="10" stroke="white" stroke-width="1.5" fill="none" stroke-dasharray="2 0"/>
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </span>
              <span class="action-text">禁飞区</span>
            </button>
            <button class="header-action-btn" @click="handleAddNoFlyZone">
              <span class="action-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="12" y1="5" x2="12" y2="19" stroke="white" stroke-width="2" stroke-linecap="round"/>
                  <line x1="5" y1="12" x2="19" y2="12" stroke="white" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </span>
              <span class="action-text">新增</span>
            </button>
          </div>
        </div>

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
import { createMapCallbackHandler, MapCallbackHandler, MapLocationData } from '@/utils/MapCallbackHandler';

const router = useRouter();

// ========================================
// 时间显示
// ========================================
const currentTime = ref('');
let timeInterval: number | null = null;

const updateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  currentTime.value = `${year}.${month}.${day} ${hours}:${minutes}`;
};

// ========================================
// 地图相关
// ========================================
const mapIframe = ref<HTMLIFrameElement | null>(null);
const mapServiceUrl = MAP_CONFIG.ENABLED ? MAP_CONFIG.MAP_URL : '';
const mapLoadError = ref(false);

// 地图回调处理器
let mapHandler: MapCallbackHandler | null = null;

// ========================================
// 禁飞区相关数据
// ========================================
const longitude = ref('');
const latitude = ref('');
const noFlyZones = ref<Array<{ id: string; name: string; center: { lng: number; lat: number }; radius: number }>>([]);

// ========================================
// 禁飞区功能逻辑
// ========================================

/**
 * 返回上一页
 */
const goBack = () => {
  router.push('/main');
};

/**
 * 禁飞区按钮点击
 */
const handleNoFlyZoneClick = () => {
  console.log('[NoFlyZone] 禁飞区按钮点击');
  // TODO: 显示禁飞区列表或切换到禁飞区模式
};

/**
 * 新增禁飞区
 */
const handleAddNoFlyZone = () => {
  console.log('[NoFlyZone] 新增禁飞区按钮点击');
  // TODO: 启用地图拾取模式选择位置
  if (mapHandler) {
    mapHandler.startPickLocation();
  }
};

/**
 * 完成设置
 */
const handleComplete = () => {
  console.log('[NoFlyZone] 完成按钮点击', {
    longitude: longitude.value,
    latitude: latitude.value,
    noFlyZones: noFlyZones.value
  });
  // TODO: 保存禁飞区设置到服务器
  router.push('/main');
};

/**
 * 处理位置选择回调
 */
const handleLocationSelected = (data: MapLocationData) => {
  console.log('[NoFlyZone] 位置选择回调', data);
  if (data) {
    longitude.value = data.longitude?.toString() || '';
    latitude.value = data.latitude?.toString() || '';
  }
};

// ========================================
// 地图事件处理
// ========================================

/**
 * 地图iframe加载完成
 */
const onMapIframeLoad = () => {
  console.log('[NoFlyZone] 地图iframe加载完成');

  if (!mapIframe.value) {
    console.warn('[NoFlyZone] 地图iframe引用为空');
    return;
  }

  // 创建地图回调处理器
  mapHandler = createMapCallbackHandler();

  // 设置回调方法
  mapHandler.init(mapIframe.value, {
    loadComplete: () => {
      console.log('[NoFlyZone] 地图回调: loadComplete');
    },
    selectOther: () => {
      console.log('[NoFlyZone] 地图回调: selectOther');
    },
    selectRight_ClickOther: () => {
      console.log('[NoFlyZone] 地图回调: selectRight_ClickOther');
    },
    onLocationSelected: handleLocationSelected,
    mouseLocation: (locationStr: string) => {
      console.log('[NoFlyZone] 鼠标位置:', locationStr);
    }
  });

  // 延迟初始化
  setTimeout(() => {
    if (mapHandler) {
      mapHandler.initializeWithRetry();
    }
  }, MAP_CONFIG.INIT_DELAY);
};

/**
 * 地图iframe加载错误
 */
const onMapIframeError = () => {
  console.error('[NoFlyZone] 地图iframe加载失败');
  mapLoadError.value = true;
};

// ========================================
// 生命周期
// ========================================

onMounted(() => {
  console.log('[NoFlyZone] 组件挂载');

  // 初始化时间显示
  updateTime();
  timeInterval = window.setInterval(updateTime, 1000);
});

onUnmounted(() => {
  // 销毁地图回调处理器
  if (mapHandler) {
    mapHandler.destroy();
    mapHandler = null;
  }

  // 清除定时器
  if (timeInterval) {
    clearInterval(timeInterval);
  }
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

/* 顶部状态栏 */
.status-bar {
  background: rgba(3, 22, 50, 0.8);
  height: 24px;
  padding: 0 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(42, 42, 62, 0.5);
  flex-shrink: 0;
}

.device-name {
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
}

.status-items {
  display: flex;
  gap: 16px;
  align-items: center;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #ffffff;
  font-size: 12px;
}

.status-item .icon {
  font-size: 14px;
}

.status-item .time {
  font-family: 'Courier New', monospace;
  font-size: 13px;
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
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
}

/* 顶部右侧按钮组 */
.header-action-btn {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.header-action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.header-action-btn .action-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-action-btn .action-text {
  font-weight: 500;
}

/* 地图区域 */
.map-area {
  flex: 1;
  overflow: hidden;
}

/* 顶部标题栏 - 悬浮于地图之上 */
.header-bar {
  position: absolute;
  top: 32px;
  left: 0;
  right: 0;
  z-index: 10;
  background: rgba(6, 71, 117, 0.8);
  height: 24px;
  padding: 0 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
</style>
