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
                  <path d="M12 3V7" stroke="white" stroke-width="2" stroke-linecap="round"/>
                  <path d="M12 7L7 10" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 7L17 10" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 7V19" stroke="white" stroke-width="2" stroke-linecap="round"/>
                  <path d="M12 19L6 22" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M12 19L18 22" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M8 13L12 11L16 13" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
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
            ref="mapIframeRef"
            :src="mapServiceUrl"
            class="map-iframe"
            frameborder="0"
            allowfullscreen
            @load="onMapIframeLoad"
            @error="onMapIframeError"
          ></iframe>
        </div>

        <!-- 禁飞区记录列表弹框 -->
        <Transition name="slide">
          <div v-if="showNoFlyZoneList" class="noflyzone-list-panel">
            <!-- 标题栏 -->
            <div class="list-panel-header">
              <span class="list-panel-title">禁飞区记录</span>
              <button class="close-btn" @click="closeNoFlyZoneList">×</button>
            </div>
            <!-- 内容区 -->
            <div class="list-panel-body">
              <!-- 空状态 -->
              <div v-if="noFlyZones.length === 0" class="empty-state">
                <span>暂无禁飞区记录</span>
              </div>
              <!-- 卡片列表 -->
              <div
                v-for="zone in noFlyZones"
                :key="zone.id"
                class="noflyzone-card"
              >
                <div class="card-info">
                  <div class="card-row">
                    <span class="card-label">禁飞区名称:</span>
                    <span class="card-value">{{ zone.name }}</span>
                  </div>
                  <div class="card-row">
                    <span class="card-label">经度:</span>
                    <span class="card-value">{{ zone.longitude }}</span>
                  </div>
                  <div class="card-row">
                    <span class="card-label">纬度:</span>
                    <span class="card-value">{{ zone.latitude }}</span>
                  </div>
                </div>
                <div class="card-actions">
                  <button class="card-action-btn edit-btn" @click="handleEditZone(zone)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                  <button class="card-action-btn delete-btn" @click="handleDeleteZone(zone.id)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 6H5H21" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { MAP_CONFIG } from '@/config';
import { useMap } from '@/composables/useMap';

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
// 地图
// ========================================
const mapIframeRef = ref<HTMLIFrameElement | null>(null);
const mapServiceUrl = MAP_CONFIG.ENABLED ? MAP_CONFIG.MAP_URL : '';

const {
  initMap,
  setCallbacks,
  destroy: destroyMap,
  startPickLocation,
  parseLocation
} = useMap(mapIframeRef);

// ========================================
// 禁飞区相关数据
// ========================================
const showNoFlyZoneList = ref(false);
const noFlyZones = ref<Array<{
  id: string;
  name: string;
  longitude: string;
  latitude: string;
}>>([
  { id: '1', name: '天府机场', longitude: '104.1056782', latitude: '30.425612' },
  { id: '2', name: '双流机场', longitude: '103.9567891', latitude: '30.578423' },
  { id: '3', name: '测试区域A', longitude: '108.5668445', latitude: '23.6557445' },
  { id: '4', name: '测试区域B', longitude: '106.5671234', latitude: '29.5589234' },
  { id: '5', name: '测试区域C', longitude: '110.3456789', latitude: '25.1234567' },
  { id: '6', name: '测试区域D', longitude: '112.8765432', latitude: '28.2345678' },
  { id: '7', name: '测试区域E', longitude: '114.1234567', latitude: '22.5432109' },
  { id: '8', name: '测试区域F', longitude: '116.5678901', latitude: '31.8765432' }
]);

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
 * 禁飞区按钮点击 - 显示/隐藏记录列表
 */
const handleNoFlyZoneClick = () => {
  console.log('[NoFlyZone] 禁飞区按钮点击');
  showNoFlyZoneList.value = !showNoFlyZoneList.value;
};

/**
 * 关闭禁飞区记录列表
 */
const closeNoFlyZoneList = () => {
  showNoFlyZoneList.value = false;
};

/**
 * 新增禁飞区
 */
const handleAddNoFlyZone = () => {
  console.log('[NoFlyZone] 新增禁飞区按钮点击');
  // 启用地图拾取模式
  startPickLocation();
};

/**
 * 编辑禁飞区
 */
const handleEditZone = (zone: any) => {
  console.log('[NoFlyZone] 编辑禁飞区:', zone);
  // TODO: 实现编辑功能
};

/**
 * 删除禁飞区
 */
const handleDeleteZone = (zoneId: string) => {
  console.log('[NoFlyZone] 删除禁飞区:', zoneId);
  noFlyZones.value = noFlyZones.value.filter(z => z.id !== zoneId);
};

/**
 * 处理位置选择回调
 */
const handleLocationSelected = (data: any) => {
  console.log('[NoFlyZone] 位置选择回调', data);
  if (data) {
    // TODO: 添加新禁飞区
  }
};

// ========================================
// 地图事件处理
// ========================================

const onMapIframeLoad = () => {
  console.log('[NoFlyZone] 地图 iframe 加载完成');

  setCallbacks({
    loadComplete: () => {
      console.log('[NoFlyZone] 地图加载完成');
    },
    selectOther: () => {
      console.log('[NoFlyZone] 地图空白区域点击');
      closeNoFlyZoneList();
    },
    selectRight_ClickOther: () => {
      console.log('[NoFlyZone] 地图空白区域右键点击');
      closeNoFlyZoneList();
    },
    onLocationSelected: handleLocationSelected,
    mouseLocation: (locationStr: string) => {
      const coords = parseLocation(locationStr);
      if (coords) {
        console.log('[NoFlyZone] 鼠标位置:', coords);
      }
    }
  });

  initMap();
};

const onMapIframeError = () => {
  console.error('[NoFlyZone] 地图 iframe 加载失败');
};

// ========================================
// 生命周期
// ========================================

onMounted(() => {
  console.log('[NoFlyZone] 组件挂载');
  updateTime();
  timeInterval = window.setInterval(updateTime, 1000);
});

onUnmounted(() => {
  destroyMap();
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

/* 地图区域 */
.map-area {
  flex: 1;
  overflow: hidden;
  position: relative;
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

.map-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.map-iframe {
  width: 100%;
  height: 100%;
  border: none;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

/* ========================================
   禁飞区记录列表弹框
   ======================================== */
.noflyzone-list-panel {
  position: absolute;
  top: 60px; /* 位于标题栏下方 */
  right: 10px;
  width: 216px;
  bottom: 0; /* 延伸到底部 */
  z-index: 20;
  display: flex;
  flex-direction: column;
  background: url('/backgrounds/斜弹框背景图.png') no-repeat center center;
  background-size: cover;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* 标题栏 */
.list-panel-header {
  width: 216px;
  height: 32px;
  background: url('/backgrounds/小标题样式3 拷贝 2.png') no-repeat center center;
  background-size: cover;
  padding: 0 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.list-panel-title {
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 18px;
  cursor: pointer;
  padding: 0 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

/* 内容区 */
.list-panel-body {
  flex: 1; /* 填充剩余空间 */
  padding: 8px;
  overflow-y: scroll;
  -webkit-overflow-scrolling: touch; /* 支持触屏滚动 */
  touch-action: pan-y;
  /* 隐藏滚动条但保持功能 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

.list-panel-body::-webkit-scrollbar {
  display: none; /* Chrome/Safari/Opera */
}

/* 空状态 */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}

/* 禁飞区卡片 */
.noflyzone-card {
  background: rgba(6, 71, 117, 0.8);
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.noflyzone-card:last-child {
  margin-bottom: 0;
}

.card-info {
  flex: 1;
}

.card-row {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  font-size: 14px;
  line-height: 1.4;
}

.card-row:last-child {
  margin-bottom: 0;
}

.card-label {
  color: rgba(255, 255, 255, 0.8);
  margin-right: 4px;
  white-space: nowrap;
}

.card-value {
  color: #ffffff;
}

.card-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-left: 8px;
}

.card-action-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.card-action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

/* 过渡动画 - 从右至左滑动 */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
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
