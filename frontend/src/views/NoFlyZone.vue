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
                <!-- 第一行：名称 + 修改按钮 -->
                <div class="card-row-with-action">
                  <div class="card-row-content">
                    <span class="card-label">名称:</span>
                    <input
                      v-if="editingZoneId === zone.id"
                      v-model="zone.name"
                      class="card-input"
                      @blur="finishEdit"
                    />
                    <span v-else class="card-value">{{ zone.name }}</span>
                  </div>
                  <button class="card-action-btn edit-btn" @click="handleEditZone(zone.id)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                </div>
                <!-- 第二行：经度 -->
                <div class="card-row-with-action">
                  <div class="card-row-content">
                    <span class="card-label">经度:</span>
                    <input
                      v-if="editingZoneId === zone.id"
                      v-model="zone.longitude"
                      class="card-input"
                      @blur="finishEdit"
                    />
                    <span v-else class="card-value">{{ zone.longitude }}</span>
                  </div>
                </div>
                <!-- 第三行：纬度 + 删除按钮 -->
                <div class="card-row-with-action">
                  <div class="card-row-content">
                    <span class="card-label">纬度:</span>
                    <input
                      v-if="editingZoneId === zone.id"
                      v-model="zone.latitude"
                      class="card-input"
                      @blur="finishEdit"
                    />
                    <span v-else class="card-value">{{ zone.latitude }}</span>
                  </div>
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

        <!-- 新增禁飞区弹框 -->
        <Transition name="slide">
          <div v-if="showAddPanel" class="add-panel">
            <!-- 标题栏 -->
            <div class="add-panel-header">
              <span class="add-panel-title">新增禁飞区</span>
              <button class="close-btn" @click="closeAddPanel">×</button>
            </div>
            <!-- 内容区 -->
            <div class="add-panel-body">
              <!-- 地图拾取 -->
              <div class="form-row">
                <span class="form-label">地图拾取:</span>
                <div class="map-pick-btn" :class="{ active: newZoneForm.pickedFromMap }" @click="toggleMapPick">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" stroke-width="2" fill="none"/>
                    <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2" fill="none"/>
                  </svg>
                </div>
                <span class="pick-hint">在地图上选点</span>
              </div>
              <!-- 经度 -->
              <div class="form-row">
                <span class="form-label">经度:</span>
                <div class="form-input-wrapper">
                  <input
                    v-model="newZoneForm.longitude"
                    class="form-input"
                    :class="{ 'input-error': formErrors.longitude }"
                    placeholder="请输入经度"
                    @input="validateLongitude"
                  />
                  <span v-if="formErrors.longitude" class="error-tip">{{ formErrors.longitude }}</span>
                </div>
              </div>
              <!-- 纬度 -->
              <div class="form-row">
                <span class="form-label">纬度:</span>
                <div class="form-input-wrapper">
                  <input
                    v-model="newZoneForm.latitude"
                    class="form-input"
                    :class="{ 'input-error': formErrors.latitude }"
                    placeholder="请输入纬度"
                    @input="validateLatitude"
                  />
                  <span v-if="formErrors.latitude" class="error-tip">{{ formErrors.latitude }}</span>
                </div>
              </div>
              <!-- 搜索位置 -->
              <div class="form-row">
                <span class="form-label">搜索:</span>
                <div class="search-input-wrapper">
                  <input
                    v-model="newZoneForm.searchLocation"
                    class="form-input search-input"
                    placeholder="位置信息"
                  />
                  <div class="search-icon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="11" cy="11" r="7" stroke="white" stroke-width="2"/>
                      <path d="M16 16L20 20" stroke="white" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                  </div>
                </div>
              </div>
              <!-- 禁飞区名称 -->
              <div class="form-row">
                <span class="form-label">禁飞区名称:</span>
                <div class="form-input-wrapper">
                  <input
                    v-model="newZoneForm.name"
                    class="form-input"
                    :class="{ 'input-error': formErrors.name }"
                    placeholder="请输入"
                    @input="validateName"
                  />
                  <span v-if="formErrors.name" class="error-tip">{{ formErrors.name }}</span>
                </div>
              </div>
              <!-- 按钮 -->
              <div class="form-buttons">
                <button class="btn-cancel" @click="closeAddPanel">取消</button>
                <button class="btn-confirm" @click="handleConfirmAdd">新增</button>
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
  startNoFlyZonePick,
  cancelNoFlyZonePick,
  parseLocation
} = useMap(mapIframeRef);

// ========================================
// 禁飞区相关数据
// ========================================
const showNoFlyZoneList = ref(false);
const showAddPanel = ref(false); // 新增弹窗显示状态
const editingZoneId = ref<string | null>(null); // 当前正在编辑的卡片ID
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

// 新增表单数据
const newZoneForm = ref({
  pickedFromMap: false,
  longitude: '',
  latitude: '',
  searchLocation: '',
  name: ''
});

// 当前禁飞区拾取的 devId
const currentNoFlyZoneDevId = ref<string>('');

// 表单错误状态
const formErrors = ref({
  name: '',
  longitude: '',
  latitude: ''
});

/**
 * 清除表单错误状态
 */
const clearFormErrors = () => {
  formErrors.value = { name: '', longitude: '', latitude: '' };
};

/**
 * 实时验证经度
 */
const validateLongitude = () => {
  const value = newZoneForm.value.longitude;
  if (!value || value.trim() === '') {
    formErrors.value.longitude = '';
    return;
  }
  const lon = parseFloat(value);
  if (isNaN(lon) || lon < -180 || lon > 180) {
    formErrors.value.longitude = '经度范围：-180~180';
  } else {
    formErrors.value.longitude = '';
  }
};

/**
 * 实时验证纬度
 */
const validateLatitude = () => {
  const value = newZoneForm.value.latitude;
  if (!value || value.trim() === '') {
    formErrors.value.latitude = '';
    return;
  }
  const lat = parseFloat(value);
  if (isNaN(lat) || lat < -90 || lat > 90) {
    formErrors.value.latitude = '纬度范围：-90~90';
  } else {
    formErrors.value.latitude = '';
  }
};

/**
 * 实时验证禁飞区名称
 */
const validateName = () => {
  const value = newZoneForm.value.name;
  if (!value || value.trim() === '') {
    formErrors.value.name = '';
    return;
  }
  formErrors.value.name = '';
};

/**
 * 切换地图拾取状态
 */
const toggleMapPick = () => {
  newZoneForm.value.pickedFromMap = !newZoneForm.value.pickedFromMap;
  
  if (newZoneForm.value.pickedFromMap) {
    // 启用禁飞区拾取模式
    currentNoFlyZoneDevId.value = startNoFlyZonePick() || '';
    console.log('[NoFlyZone] 启用禁飞区拾取, devId:', currentNoFlyZoneDevId.value);
  } else {
    // 取消禁飞区拾取模式
    if (currentNoFlyZoneDevId.value) {
      cancelNoFlyZonePick(currentNoFlyZoneDevId.value);
      currentNoFlyZoneDevId.value = '';
    }
    console.log('[NoFlyZone] 取消禁飞区拾取');
  }
};

/**
 * 处理地图返回的禁飞区位置
 */
const handleNoFlyZoneLocationSelected = (keyId: string, devType: number, lng: string, lat: string) => {
  console.log('[NoFlyZone] 收到禁飞区位置:', { keyId, devType, lng, lat });
  newZoneForm.value.longitude = lng;
  newZoneForm.value.latitude = lat;
  
  // 收到位置后自动取消拾取模式
  if (newZoneForm.value.pickedFromMap) {
    newZoneForm.value.pickedFromMap = false;
    if (currentNoFlyZoneDevId.value) {
      cancelNoFlyZonePick(currentNoFlyZoneDevId.value);
      currentNoFlyZoneDevId.value = '';
    }
    console.log('[NoFlyZone] 位置拾取完成，已取消拾取模式');
  }
};

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
  // 互斥：关闭新增弹窗
  showAddPanel.value = false;
  showNoFlyZoneList.value = !showNoFlyZoneList.value;
};

/**
 * 关闭禁飞区记录列表
 */
const closeNoFlyZoneList = () => {
  showNoFlyZoneList.value = false;
};

/**
 * 新增禁飞区 - 显示新增弹窗（可切换）
 */
const handleAddNoFlyZone = () => {
  console.log('[NoFlyZone] 新增禁飞区按钮点击');
  // 互斥：关闭记录列表
  showNoFlyZoneList.value = false;
  // 切换新增弹窗显示状态
  showAddPanel.value = !showAddPanel.value;
};

/**
 * 关闭新增弹窗
 */
const closeAddPanel = () => {
  showAddPanel.value = false;
  // 重置表单
  newZoneForm.value = {
    pickedFromMap: false,
    longitude: '',
    latitude: '',
    searchLocation: '',
    name: ''
  };
  // 清除错误状态
  clearFormErrors();
};

/**
 * 确认新增禁飞区 - 带验证
 */
const handleConfirmAdd = () => {
  const { name, longitude, latitude } = newZoneForm.value;
  let hasError = false;

  // 清除之前的错误
  clearFormErrors();

  // 验证禁飞区名称不能为空
  if (!name || name.trim() === '') {
    formErrors.value.name = '请输入禁飞区名称';
    hasError = true;
  }

  // 验证经度
  if (!longitude || longitude.trim() === '') {
    formErrors.value.longitude = '请输入经度';
    hasError = true;
  } else {
    const lon = parseFloat(longitude);
    if (isNaN(lon) || lon < -180 || lon > 180) {
      formErrors.value.longitude = '经度范围：-180~180';
      hasError = true;
    }
  }

  // 验证纬度
  if (!latitude || latitude.trim() === '') {
    formErrors.value.latitude = '请输入纬度';
    hasError = true;
  } else {
    const lat = parseFloat(latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      formErrors.value.latitude = '纬度范围：-90~90';
      hasError = true;
    }
  }

  // 如果有错误，不提交
  if (hasError) {
    return;
  }

  // 验证通过，添加记录
  const newZone = {
    id: Date.now().toString(),
    name: name.trim(),
    longitude: longitude.trim(),
    latitude: latitude.trim()
  };
  noFlyZones.value.unshift(newZone);
  closeAddPanel();
};

/**
 * 编辑禁飞区 - 切换编辑状态
 */
const handleEditZone = (zoneId: string) => {
  console.log('[NoFlyZone] 编辑禁飞区:', zoneId);
  if (editingZoneId.value === zoneId) {
    // 当前正在编辑此卡片，关闭编辑状态
    editingZoneId.value = null;
  } else {
    // 开始编辑此卡片
    editingZoneId.value = zoneId;
  }
};

/**
 * 完成编辑 - 失去焦点时调用
 */
const finishEdit = () => {
  editingZoneId.value = null;
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
    },
    // 禁飞区位置选择回调
    selectDraggableDevLoc: handleNoFlyZoneLocationSelected
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
  border-radius: 16px; /* 与Main.vue一致 */
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
  top: 8px; /* 状态栏下方 */
  left: 0;
  right: 0;
  z-index: 10;
  background: rgba(6, 71, 117, 0.8);
  height: 40px;
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
  font-size: 14px;
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
  top: 52px; /* 位于标题栏下方（标题栏top:8px + height:40px + 间距4px） */
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
  background-size: 100% 100%;
  padding: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.list-panel-title {
  color: #ffffff;
  font-size: 16px;
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
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

/* 内容区 */
.list-panel-body {
  width: 216px; /* 与标题栏宽度一致 */
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
  width: 200px; /* 与内容区宽度一致（216px - 8px*2 padding） */
  background: rgba(6, 71, 117, 0.8);
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 8px;
  box-sizing: border-box;
}

.noflyzone-card:last-child {
  margin-bottom: 0;
}

/* 带操作按钮的行 */
.card-row-with-action {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.card-row-with-action:last-child {
  margin-bottom: 0;
}

.card-row-content {
  flex: 1;
  display: flex;
  align-items: center;
  min-height: 20px;
}

.card-label {
  color: rgba(255, 255, 255, 0.8);
  margin-right: 4px;
  white-space: nowrap;
}

.card-value {
  color: #ffffff;
}

.card-input {
  flex: 1;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 2px;
  padding: 2px 4px;
  color: #ffffff;
  font-size: 14px;
  line-height: 1.4;
  outline: none;
}

.card-input:focus {
  border-color: #ffffff;
  background: rgba(255, 255, 255, 0.3);
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
  flex-shrink: 0;
}

.card-action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

/* ========================================
   新增禁飞区弹框
   ======================================== */
.add-panel {
  position: absolute;
  top: 52px; /* 位于标题栏下方 */
  right: 10px;
  width: 216px; /* 与记录列表弹框一致 */
  bottom: 0; /* 延伸到底部 */
  z-index: 25; /* 比记录列表更高 */
  display: flex;
  flex-direction: column;
  background: url('/backgrounds/斜弹框背景图.png') no-repeat center center;
  background-size: cover;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  overflow: hidden; /* 防止内容溢出 */
}

/* 标题栏 */
.add-panel-header {
  width: 100%;
  height: 32px;
  background: url('/backgrounds/小标题样式3 拷贝 2.png') no-repeat center center;
  background-size: 100% 100%;
  padding: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  border-radius: 4px 4px 0 0;
}

.add-panel-title {
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  padding-left: 10px;
}

.add-panel-header .close-btn {
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

.add-panel-header .close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

/* 内容区 */
.add-panel-body {
  width: 100%;
  flex: 1;
  padding: 8px;
  overflow-y: auto;
  overflow-x: hidden; /* 隐藏水平溢出 */
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  scrollbar-width: none;
  -ms-overflow-style: none;
  box-sizing: border-box;
}

.add-panel-body::-webkit-scrollbar {
  display: none;
}

/* 表单行 */
.form-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-label {
  color: #ffffff;
  font-size: 14px;
  white-space: nowrap;
  flex-shrink: 0;
  padding-right: 4px;
}

.form-input-wrapper {
  flex: 1;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}

.form-input {
  width: 100%;
  background: rgba(6, 71, 117, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  padding: 4px 6px;
  color: #ffffff;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: rgba(255, 255, 255, 0.6);
  background: rgba(6, 71, 117, 1);
}

.form-input.input-error {
  border-color: #ff4444;
}

.form-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

/* 错误提示 */
.error-tip {
  display: block;
  color: #ff4444;
  font-size: 10px;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 地图拾取按钮 */
.map-pick-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(6, 71, 117, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #666666;
  flex-shrink: 0;
}

.map-pick-btn:hover {
  border-color: rgba(255, 255, 255, 0.5);
}

.map-pick-btn.active {
  background: rgba(0, 120, 200, 0.6);
  border-color: rgba(0, 150, 255, 0.5);
  color: #ffffff;
}

.pick-hint {
  font-size: 12px;
  color: #999999;
  margin-left: 6px;
  white-space: nowrap;
}

/* 复选框 */
.checkbox-wrapper {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.checkbox {
  width: 16px;
  height: 16px;
  background: rgba(6, 71, 117, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  margin-right: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.checkbox.active {
  background: rgba(0, 120, 200, 0.8);
  border-color: rgba(0, 150, 255, 0.5);
}

.checkbox.active::after {
  content: '✓';
  color: #ffffff;
  font-size: 11px;
}

.checkbox-text {
  color: #999999;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 搜索输入框 */
.search-input-wrapper {
  flex: 1;
  min-width: 0;
  max-width: 100%;
  position: relative;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.search-input {
  padding-right: 26px;
}

.search-icon {
  position: absolute;
  right: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 按钮区域 */
.form-buttons {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  height: 32px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #ffffff;
  background: url('/backgrounds/按钮2.png') no-repeat center center;
  background-size: 100% 100%;
}

.btn-cancel:hover,
.btn-confirm:hover {
  opacity: 0.9;
  transform: scale(1.02);
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
