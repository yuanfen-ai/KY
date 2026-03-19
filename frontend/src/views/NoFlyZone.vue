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
            <button class="header-action-btn">
              <span class="action-icon">
                <!-- 禁止飞行图标 - 线体飞机 + 斜线 -->
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <!-- 飞机轮廓 - 简约线条 -->
                  <path d="M12 2L12 6M12 6L8 8.5M12 6L16 8.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 6L12 18" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                  <path d="M12 18L6 21M12 18L18 21" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M8 11L12 9L16 11" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M7 14L12 12L17 14" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <!-- 禁止斜线 - 圆环对角线 -->
                  <circle cx="12" cy="12" r="9" stroke="white" stroke-width="1.5" fill="none"/>
                  <line x1="5" y1="5" x2="19" y2="19" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
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
// 地图相关变量和状态
// ========================================
const mapIframe = ref<HTMLIFrameElement | null>(null);
const mapServiceUrl = MAP_CONFIG.ENABLED ? MAP_CONFIG.MAP_URL : '';
const isMapReady = ref(false);
const mapLoadError = ref(false);

console.log('[NoFlyZone] 地图服务配置:', {
  enabled: MAP_CONFIG.ENABLED,
  url: mapServiceUrl
});

// ========================================
// 禁飞区设置相关
// ========================================
const longitude = ref('');
const latitude = ref('');

// 返回上一页
const goBack = () => {
  router.push('/main');
};

// 新增禁飞区
const handleAddNoFlyZone = () => {
  console.log('[NoFlyZone] 新增禁飞区按钮点击');
  // TODO: 实现新增禁飞区逻辑
};

// 完成按钮
const handleComplete = () => {
  console.log('[NoFlyZone] 完成按钮点击');
  // TODO: 保存禁飞区设置
  // 返回主界面
  router.push('/main');
};

// ========================================
// 地图事件处理
// ========================================

/**
 * 地图回调事件处理对象
 * 
 * 回调方法说明：
 * - loadComplete: 地图加载完成
 * - selectOther: 地图空白区域左键点击
 * - selectRight_ClickOther: 地图空白区域右键点击
 * - onLocationSelected: 位置选择回调
 * - mouseLocation: 鼠标位置变化，参数格式 "经度 xxx°，纬度 xxx°"
 */
const createMapCallbackObj = () => ({
  /**
   * 地图加载完成回调
   */
  loadComplete: () => {
    console.log('[NoFlyZone] 地图回调: loadComplete - 地图加载完成');
    // 地图加载完成后的处理逻辑（如有需要）
  },
  
  /**
   * 地图空白区域左键点击事件
   */
  selectOther: () => {
    console.log('[NoFlyZone] 地图回调: selectOther - 空白区域左键点击');
  },
  
  /**
   * 地图空白区域右键点击事件
   */
  selectRight_ClickOther: () => {
    console.log('[NoFlyZone] 地图回调: selectRight_ClickOther - 空白区域右键点击');
  },
  
  /**
   * 位置选择回调
   */
  onLocationSelected: (data: any) => {
    console.log('[NoFlyZone] 地图回调: onLocationSelected', data);
    if (data) {
      longitude.value = data.longitude?.toString() || '';
      latitude.value = data.latitude?.toString() || '';
    }
  },
  
  /**
   * 鼠标位置变化回调
   * @param locationStr 位置字符串，格式: "经度 xxx°，纬度 xxx°"
   */
  mouseLocation: (locationStr: string) => {
    console.log('[NoFlyZone] 地图回调: mouseLocation -', locationStr);
    handleMouseLocation(locationStr);
  }
});

/**
 * 处理鼠标位置变化
 * @param locationStr 位置字符串，格式: "经度 xxx°，纬度 xxx°"
 */
const handleMouseLocation = (locationStr: string) => {
  // 解析经纬度（格式：经度 108.566844°，纬度 23.655744°）
  try {
    const lonMatch = locationStr.match(/经度\s*([\d.]+)°/);
    const latMatch = locationStr.match(/纬度\s*([\d.]+)°/);
    
    if (lonMatch && latMatch) {
      const lon = parseFloat(lonMatch[1]);
      const lat = parseFloat(latMatch[1]);
      console.log('[NoFlyZone] 解析坐标 - 经度:', lon, '纬度:', lat);
      // 可在此处更新界面显示或进行其他处理
    }
  } catch (e) {
    console.warn('[NoFlyZone] 解析坐标失败:', e);
  }
};

/**
 * 主动触发地图事件的方法集合
 */
const mapActions = {
  /**
   * 初始化地图
   */
  init: (iframeWindow: any) => {
    console.log('[NoFlyZone] 地图操作: 初始化地图');
    iframeWindow.postMessage({
      type: 'INIT',
      source: 'nofly-zone'
    }, '*');
    
    if (typeof iframeWindow.initView_3d === 'function') {
      iframeWindow.initView_3d();
      isMapReady.value = true;
      console.log('[NoFlyZone] 地图初始化函数 initView_3d 调用成功');
    } else {
      console.warn('[NoFlyZone] 地图初始化函数 initView_3d 不存在');
    }
  },
  
  /**
   * 启用地图拾取模式
   */
  startPickLocation: (iframeWindow: any) => {
    console.log('[NoFlyZone] 地图操作: 启用拾取模式');
    iframeWindow.postMessage({
      type: 'START_PICK_LOCATION',
      source: 'nofly-zone'
    }, '*');
  }
};

/**
 * 地图拾取按钮
 */
const handleMapPick = () => {
  console.log('[NoFlyZone] 地图拾取按钮点击');
  
  if (!isMapReady.value || !mapIframe.value?.contentWindow) {
    console.warn('[NoFlyZone] 地图未就绪');
    return;
  }
  
  mapActions.startPickLocation(mapIframe.value.contentWindow);
};

/**
 * 地图iframe加载完成回调
 */
const onMapIframeLoad = () => {
  console.log('[NoFlyZone] 地图iframe加载完成');
  mapLoadError.value = false;
  
  if (!mapIframe.value) {
    console.warn('[NoFlyZone] 地图iframe引用为空');
    return;
  }

  // 监听来自地图的消息
  window.addEventListener('message', handleMapPostMessage);
  console.log('[NoFlyZone] 已注册地图消息监听');

  // 延迟初始化，确保iframe内的JS完全加载
  setTimeout(() => {
    try {
      const iframeWindow = mapIframe.value?.contentWindow as any;
      if (!iframeWindow) {
        console.warn('[NoFlyZone] 无法获取iframe的contentWindow');
        return;
      }
      
      console.log('[NoFlyZone] 发送初始化回调消息到地图...');
      
      // 通过 postMessage 初始化回调（跨域安全）
      // 注册所有回调方法
      iframeWindow.postMessage({
        type: 'INIT_CALLBACK',
        methods: ['loadComplete', 'selectOther', 'selectRight_ClickOther', 'onLocationSelected', 'mouseLocation']
      }, '*');
      
      // 初始化地图
      mapActions.init(iframeWindow);
      
      // 重试机制
      setTimeout(() => {
        const win = mapIframe.value?.contentWindow as any;
        if (win && typeof win.initView_3d !== 'function') {
          console.log('[NoFlyZone] 重试初始化地图...');
          mapActions.init(win);
        }
      }, MAP_CONFIG.INIT_RETRY_DELAY);
      
    } catch (error) {
      console.error('[NoFlyZone] 地图初始化失败:', error);
    }
  }, MAP_CONFIG.INIT_DELAY);
};

/**
 * 处理来自地图的 postMessage 消息
 * 调用 createMapCallbackObj 中定义的回调方法
 */
const handleMapPostMessage = (event: MessageEvent) => {
  const data = event.data;
  if (!data || !data.type) return;
  
  console.log('[NoFlyZone] 收到地图消息:', data.type);
  
  const callbacks = createMapCallbackObj();
  
  // 解析回调类型：CALLBACK_xxx -> xxx
  if (data.type.startsWith('CALLBACK_')) {
    const callbackName = data.type.replace('CALLBACK_', '');
    const callback = callbacks[callbackName as keyof typeof callbacks];
    
    if (typeof callback === 'function') {
      // 调用回调方法，传入参数
      const args = data.args || [];
      callback(...args);
    } else {
      console.warn('[NoFlyZone] 未定义的回调方法:', callbackName);
    }
  } else if (data.type === 'MAP_LOADED') {
    console.log('[NoFlyZone] 地图页面加载完成');
  }
};

/**
 * 地图iframe加载错误回调
 */
const onMapIframeError = () => {
  console.error('[NoFlyZone] 地图iframe加载失败');
  mapLoadError.value = true;
};

// ========================================
// 地图事件处理结束
// ========================================

onMounted(() => {
  console.log('[NoFlyZone] 组件挂载');
  console.log('[NoFlyZone] 地图服务URL:', mapServiceUrl);
  
  // 初始化时间显示
  updateTime();
  timeInterval = window.setInterval(updateTime, 1000);
});

onUnmounted(() => {
  // 移除地图消息监听
  window.removeEventListener('message', handleMapPostMessage);
  
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
  background: rgba(6, 71, 117, 0.8); /* #064775, 80%透明度 */
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
