<template>
  <PageTemplate>
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

    <!-- 地图显示区域 -->
    <div class="map-area">
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

      <!-- 禁飞区记录列表弹框 -->
      <Transition name="slide">
        <PanelTemplate
          v-if="showNoFlyZoneList"
          title="禁飞区记录"
          @close="closeNoFlyZoneList"
          class="nofly-panel"
        >
          <!-- 内容区域包装器，用于处理点击空白区域退出编辑模式 -->
          <div class="panel-content-wrapper" @click="handlePanelContentClick">
            <!-- 空状态 -->
            <div v-if="noFlyZones.length === 0" class="empty-state">
              <span>暂无禁飞区记录</span>
            </div>
            <!-- 卡片列表 -->
            <div
              v-for="zone in noFlyZones"
              :key="zone.id"
              class="noflyzone-card"
              @click.stop
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
        </PanelTemplate>
      </Transition>

      <!-- 新增禁飞区弹框 -->
      <Transition name="slide">
        <PanelTemplate
          v-if="showAddPanel"
          title="新增禁飞区"
          @close="closeAddPanel"
          class="nofly-panel"
        >
          <div class="add-form">
              <!-- 地图拾取 -->
              <div class="form-row">
                <span class="form-label">地图拾取:</span>
                <button 
                  class="map-pick-btn" 
                  :class="{ active: newZoneForm.pickedFromMap }" 
                  @click="toggleMapPick"
                  type="button"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" stroke-width="2" fill="none"/>
                    <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2" fill="none"/>
                  </svg>
                </button>
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
        </PanelTemplate>
      </Transition>
    </div>
  </PageTemplate>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { MAP_CONFIG } from '@/config';
import { useMap } from '@/composables/useMap';
import PageTemplate from '@/components/PageTemplate.vue';
import PanelTemplate from '@/components/PanelTemplate.vue';
import { messageHandler, MessageCode } from '@/utils/MessageHandler';

const router = useRouter();

// ========================================
// 禁飞区消息处理器
// ========================================

// 查询禁飞区
const queryNoFlyZones = () => {
  messageHandler.send(MessageCode.NO_FLY_ZONE_QUERY, {}, 'db');
};

// 新增禁飞区响应处理
const handleNoFlyZoneAddResponse = (data: any) => {
  console.log('[NoFlyZone] 新增禁飞区响应:', data);
  
  if (!data) {
    console.error('[NoFlyZone] 新增禁飞区响应数据为空');
    ElMessage.error('新增禁飞区响应数据为空');
    return;
  }
  
  if (data.success) {
    ElMessage.success(data.message || '新增成功');
    closeAddPanel();
    queryNoFlyZones();
  } else {
    ElMessage.error(data.message || '新增失败');
  }
};

// 修改禁飞区响应处理
const handleNoFlyZoneUpdateResponse = (data: any) => {
  console.log('[NoFlyZone] 修改禁飞区响应:', data);
  
  if (!data) {
    console.error('[NoFlyZone] 修改禁飞区响应数据为空');
    ElMessage.error('修改禁飞区响应数据为空');
    queryNoFlyZones(); // 刷新列表
    return;
  }
  
  if (data.success) {
    ElMessage.success(data.message || '修改成功');
    queryNoFlyZones(); // 刷新列表
  } else {
    ElMessage.error(data.message || '修改失败');
    queryNoFlyZones(); // 刷新列表，确保数据一致
  }
};

// 删除禁飞区响应处理
const handleNoFlyZoneDeleteResponse = (data: any) => {
  console.log('[NoFlyZone] 删除禁飞区响应:', data);
  
  if (!data) {
    console.error('[NoFlyZone] 删除禁飞区响应数据为空');
    ElMessage.error('删除禁飞区响应数据为空');
    queryNoFlyZones(); // 刷新列表
    return;
  }
  
  if (data.success) {
    ElMessage.success(data.message || '删除成功');
    queryNoFlyZones(); // 刷新列表
  } else {
    ElMessage.error(data.message || '删除失败');
    queryNoFlyZones(); // 刷新列表，确保数据一致
  }
};

// 查询禁飞区响应处理
const handleNoFlyZoneQueryResponse = (data: any) => {
  console.log('[NoFlyZone] 查询禁飞区响应:', data);
  
  if (!data) {
    console.error('[NoFlyZone] 查询禁飞区响应数据为空');
    ElMessage.error('查询禁飞区响应数据为空');
    return;
  }
  
  if (data.success) {
    const list = data.data || [];
    
    // 转换数据格式以适配前端显示（lng -> longitude, lat -> latitude）
    const newZones = list.map((item: any) => ({
      id: item.id.toString(),
      name: item.name,
      longitude: item.lng?.toString() || '',
      latitude: item.lat?.toString() || ''
    }));
    
    console.log('[NoFlyZone] 更新后的数据:', newZones);
    noFlyZones.value = newZones;
    console.log('[NoFlyZone] noFlyZones.value 长度:', noFlyZones.value.length);
  } else {
    ElMessage.error(data.message || '查询失败');
  }
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
}>>([]);

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
    const devId = startNoFlyZonePick();
    currentNoFlyZoneDevId.value = devId || '';
  } else {
    // 取消禁飞区拾取模式
    if (currentNoFlyZoneDevId.value) {
      cancelNoFlyZonePick(currentNoFlyZoneDevId.value);
      currentNoFlyZoneDevId.value = '';
    }
  }
};

/**
 * 停止地图拾取功能（统一入口）
 * 当地图拾取处于激活状态时，调用此函数停止拾取
 */
const stopNoFlyZonePick = () => {
  if (newZoneForm.value.pickedFromMap && currentNoFlyZoneDevId.value) {
    cancelNoFlyZonePick(currentNoFlyZoneDevId.value);
    currentNoFlyZoneDevId.value = '';
    newZoneForm.value.pickedFromMap = false;
  }
};

/**
 * 处理地图返回的禁飞区位置
 */
const handleNoFlyZoneLocationSelected = (keyId: string, devType: number, lng: string, lat: string) => {
  newZoneForm.value.longitude = lng;
  newZoneForm.value.latitude = lat;
  // 注意：收到位置后不自动取消拾取模式，保持按钮激活状态
  // 用户需再次点击按钮才会停止拾取功能
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
  // 停止地图拾取功能
  stopNoFlyZonePick();
  // 互斥：关闭新增弹窗
  showAddPanel.value = false;
  // 打开弹框时重置编辑状态
  editingZoneId.value = null;
  showNoFlyZoneList.value = !showNoFlyZoneList.value;
};

/**
 * 关闭禁飞区记录列表
 */
const closeNoFlyZoneList = () => {
  showNoFlyZoneList.value = false;
  // 关闭弹框时重置编辑状态
  editingZoneId.value = null;
};

/**
 * 新增禁飞区 - 显示新增弹窗（可切换）
 */
const handleAddNoFlyZone = () => {
  // 停止地图拾取功能
  stopNoFlyZonePick();
  // 互斥：关闭记录列表
  showNoFlyZoneList.value = false;
  // 切换新增弹窗显示状态
  showAddPanel.value = !showAddPanel.value;
};

/**
 * 关闭新增弹窗
 */
const closeAddPanel = () => {
  // 停止地图拾取功能
  stopNoFlyZonePick();
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
  // 停止地图拾取功能
  stopNoFlyZonePick();
  
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

  // 验证通过，调用接口新增禁飞区
  const requestData = {
    name: name.trim(),
    lng: parseFloat(longitude.trim()),
    lat: parseFloat(latitude.trim())
  };
  messageHandler.send(MessageCode.NO_FLY_ZONE_ADD, requestData, 'db');
  console.log('[NoFlyZone] 新增禁飞区请求已发送:', requestData);
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
  // 获取正在编辑的卡片数据
  const editingZone = noFlyZones.value.find(z => z.id === editingZoneId.value);
  if (editingZone) {
    // 调用接口更新禁飞区
    const requestData = {
      id: parseInt(editingZone.id),
      name: editingZone.name.trim(),
      lng: parseFloat(editingZone.longitude.trim()),
      lat: parseFloat(editingZone.latitude.trim())
    };
    messageHandler.send(MessageCode.NO_FLY_ZONE_UPDATE, requestData, 'db');
    console.log('[NoFlyZone] 修改禁飞区请求已发送:', requestData);
  }
  editingZoneId.value = null;
};

/**
 * 点击弹框内容区域空白处 - 退出编辑模式
 */
const handlePanelContentClick = () => {
  if (editingZoneId.value) {
    editingZoneId.value = null;
  }
};

/**
 * 删除禁飞区
 */
const handleDeleteZone = (zoneId: string) => {
  console.log('[NoFlyZone] 删除禁飞区:', zoneId);
  const requestData = {
    id: parseInt(zoneId)
  };
  messageHandler.send(MessageCode.NO_FLY_ZONE_DELETE, requestData, 'db');
  console.log('[NoFlyZone] 删除禁飞区请求已发送:', requestData);
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
        // 鼠标位置信息已移除日志输出
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
  // 注册禁飞区消息处理器
  messageHandler.setNoFlyZoneHandlers({
    onNoFlyZoneAddResponse: handleNoFlyZoneAddResponse,
    onNoFlyZoneUpdateResponse: handleNoFlyZoneUpdateResponse,
    onNoFlyZoneDeleteResponse: handleNoFlyZoneDeleteResponse,
    onNoFlyZoneQueryResponse: handleNoFlyZoneQueryResponse
  });
  console.log('[NoFlyZone] 禁飞区消息处理器已注册');
  // 初始加载禁飞区列表
  queryNoFlyZones();
});

onUnmounted(() => {
  // 注销禁飞区消息处理器
  messageHandler.setNoFlyZoneHandlers({});
  console.log('[NoFlyZone] 禁飞区消息处理器已注销');
  destroyMap();
});
</script>

<style scoped>
/* 标题栏 */
.header-bar {
  background: rgba(6, 71, 117, 0.8);
  height: 40px;
  padding: 0 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
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
  font-size: 30px;
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

/* 地图区域 */
.map-area {
  flex: 1;
  overflow: hidden;
  position: relative;
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

/* ========================================
   禁飞区记录列表弹框
   ======================================== */
/* 内容区域包装器 */
.panel-content-wrapper {
  width: 100%;
  height: 100%;
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
  min-width: 0;
  overflow: hidden;
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
  min-width: 0;
  max-width: 120px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 2px;
  padding: 2px 4px;
  color: #ffffff;
  font-size: 14px;
  line-height: 1.4;
  outline: none;
  box-sizing: border-box;
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
  padding: 0;
  font-size: inherit;
  font-weight: inherit;
  box-sizing: border-box;
}

.card-action-btn svg {
  width: 14px;
  height: 14px;
  display: block;
}

.card-action-btn svg path {
  stroke: white;
}

.card-action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

/* 编辑按钮 - 蓝色高亮 */
.card-action-btn.edit-btn:hover {
  background: rgba(64, 158, 255, 0.3);
  border-color: rgba(64, 158, 255, 0.8);
}

/* 删除按钮 - 红色高亮 */
.card-action-btn.delete-btn:hover {
  background: rgba(245, 108, 108, 0.3);
  border-color: rgba(245, 108, 108, 0.8);
}

/* ========================================
   禁飞区弹窗 - 与用户管理弹窗高度一致
   ======================================== */
/* 覆盖 PanelTemplate 的 top 值，使弹窗高度与 UserManagement 一致 */
.nofly-panel.panel-template {
  top: 40px !important;
}

/* ========================================
   新增禁飞区弹框 - 表单样式
   ======================================== */
/* 新增/编辑表单 */
.add-form {
  display: flex;
  flex-direction: column;
  padding: 10px;
}

/* 表单行 */
.form-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 8px;
  width: 100%;
  box-sizing: border-box;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-label {
  color: #ffffff;
  font-size: 12px;
  white-space: nowrap;
  flex-shrink: 0;
  padding-right: 4px;
  line-height: 28px;
}

.form-input-wrapper {
  flex: 1;
  min-width: 0;
}

.form-input {
  width: 100%;
  min-width: 0;
  background: rgba(6, 71, 117, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  padding: 4px 6px;
  color: #ffffff;
  font-size: 12px;
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
  padding: 0;
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
  overflow: hidden;
  text-overflow: ellipsis;
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

/* 弹窗居中样式 - 与新增用户保持一致 */
.centered-panel {
  position: absolute !important;
  top: 50% !important;
  left: 50% !important;
  right: auto !important;
  bottom: auto !important;
  transform: translate(-50%, -50%) !important;
  width: 280px !important;
  height: auto !important;
  max-height: 90vh !important;
  overflow-y: auto !important;
}
</style>
