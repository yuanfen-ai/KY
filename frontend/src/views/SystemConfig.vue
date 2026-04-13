<template>
  <PageTemplate>
    <!-- 标题栏 -->
    <div class="header-bar">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <span class="back-icon">←</span>
        </button>
      </div>
      <div class="header-title">系统配置</div>
      <div class="header-right"></div>
    </div>

    <!-- 配置内容区域 -->
    <div class="config-content">
      <!-- 核心配置区 -->
      <div class="config-section">
        <!-- 左列 -->
        <div class="config-column">
          <div class="config-item">
            <span class="config-label">设备IP:</span>
            <input
              ref="deviceIpRef"
              v-model="configData.deviceIp"
              type="text"
              class="config-input"
              placeholder="请输入设备IP"
              @focus="handleInputFocus(deviceIpRef)"
            />
          </div>
          <div class="config-item">
            <span class="config-label">平台IP:</span>
            <input
              ref="platformIpRef"
              v-model="configData.platformIp"
              type="text"
              class="config-input"
              placeholder="请输入平台IP"
              @focus="handleInputFocus(platformIpRef)"
            />
          </div>
        </div>
        <!-- 右列 -->
        <div class="config-column">
          <div class="config-item">
            <span class="config-label">设备端口:</span>
            <input
              ref="devicePortRef"
              v-model="configData.devicePort"
              type="text"
              class="config-input"
              placeholder="请输入设备端口"
              @focus="handleInputFocus(devicePortRef)"
            />
          </div>
          <div class="config-item">
            <span class="config-label">平台端口:</span>
            <input
              ref="platformPortRef"
              v-model="configData.platformPort"
              type="text"
              class="config-input"
              placeholder="请输入平台端口"
              @focus="handleInputFocus(platformPortRef)"
            />
          </div>
        </div>
      </div>

      <!-- 功能状态区 -->
      <div class="status-section">
        <div class="status-row">
          <div class="status-item">
            <span class="status-label">设备定位:</span>
            <button 
              class="toggle-switch" 
              :class="{ active: configData.deviceLocationEnabled }"
              @click="toggleDeviceLocation"
            >
              <span class="toggle-knob"></span>
            </button>
          </div>
          <div class="status-item">
            <span class="status-label">地图在线:</span>
            <button 
              class="toggle-switch" 
              :class="{ active: mapStatus.online }"
              @click="toggleMapStatus"
            >
              <span class="toggle-knob"></span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部确定按钮 -->
    <div class="footer-bar">
      <button class="confirm-btn" @click="handleConfirm">确定</button>
    </div>

    <!-- 虚拟键盘 -->
    <div class="keyboard-wrapper" :class="{ 'keyboard-visible': isKeyboardVisible }">
      <VirtualKeyboard
        v-if="isKeyboardVisible"
        :input-ref="currentInputRef"
        @close="handleKeyboardClose"
      />
    </div>
  </PageTemplate>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import PageTemplate from '@/components/PageTemplate.vue';
import VirtualKeyboard from '@/components/VirtualKeyboard.vue';

// 虚拟键盘相关
const isKeyboardVisible = ref(false);
const currentInputRef = ref<HTMLInputElement | null>(null);
const deviceIpRef = ref<HTMLInputElement | null>(null);
const platformIpRef = ref<HTMLInputElement | null>(null);
const devicePortRef = ref<HTMLInputElement | null>(null);
const platformPortRef = ref<HTMLInputElement | null>(null);

const handleInputFocus = (inputRef: HTMLInputElement | null) => {
  if (inputRef) {
    currentInputRef.value = inputRef;
    isKeyboardVisible.value = true;
  }
};

const handleKeyboardClose = () => {
  isKeyboardVisible.value = false;
};

// 配置数据
const configData = reactive({
  deviceIp: '192.168.1.100',
  platformIp: '1.14.100.199',
  devicePort: '8888',
  platformPort: '8050',
  deviceLocationEnabled: true
});

// 地图状态
const mapStatus = reactive({
  online: true
});

const router = useRouter();

// 返回上一页
const goBack = () => {
  router.push('/main');
};

// 切换设备定位
const toggleDeviceLocation = () => {
  configData.deviceLocationEnabled = !configData.deviceLocationEnabled;
};

// 切换地图在线状态
const toggleMapStatus = () => {
  mapStatus.online = !mapStatus.online;
};

// 确认配置
const handleConfirm = () => {
  console.log('[SystemConfig] 提交配置:', configData);
  ElMessage.success('配置保存成功');
};
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
  width: 60px;
}

/* 配置内容区域 */
.config-content {
  flex: 1;
  padding: 16px;
  overflow: auto;
}

/* 核心配置区 */
.config-section {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.config-column {
  flex: 1;
}

.config-item {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.config-label {
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  min-width: 70px;
  flex-shrink: 0;
}

.config-input {
  flex: 1;
  height: 32px;
  padding: 0 10px;
  background: rgba(6, 71, 117, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  color: #ffffff;
  font-size: 13px;
  outline: none;
}

.config-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.config-input:focus {
  border-color: rgba(100, 200, 255, 0.6);
  background: rgba(6, 71, 117, 0.8);
}

/* 功能状态区 */
.status-section {
  margin-bottom: 20px;
}

.status-row {
  display: flex;
  gap: 40px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-label {
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
}

/* 开关样式 */
.toggle-switch {
  position: relative;
  width: 48px;
  height: 26px;
  background: rgba(100, 100, 100, 0.5);
  border: none;
  border-radius: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.toggle-switch.active {
  background: rgba(100, 200, 255, 0.6);
}

.toggle-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  background: #ffffff;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.toggle-switch.active .toggle-knob {
  left: 25px;
}

/* 地图状态信息 */
/* 底部确定按钮 */
.footer-bar {
  padding: 16px;
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}

.confirm-btn {
  height: 28px;
  width: auto;
  min-width: 80px;
  padding: 0 24px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #ffffff;
  background: url('/backgrounds/按钮2.png') no-repeat center center;
  background-size: 100% 100%;
}

.confirm-btn:hover {
  opacity: 0.9;
  transform: scale(1.02);
}

/* 虚拟键盘容器 */
.keyboard-wrapper {
  flex-shrink: 0;
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.25s ease-out;
  position: relative;
  z-index: 10001;
}

.keyboard-wrapper.keyboard-visible {
  max-height: 320px;
  overflow: visible;
}

.keyboard-wrapper :deep(.virtual-keyboard) {
  position: relative;
  z-index: 10001;
}
</style>
