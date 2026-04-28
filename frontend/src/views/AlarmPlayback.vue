<template>
  <div class="alarm-playback-overlay" @click.self="handleClose">
    <div class="alarm-playback-container">
      <!-- 标题栏 -->
      <div class="playback-header">
        <h3>航迹回放</h3>
        <button class="close-btn" @click="handleClose">&times;</button>
      </div>

      <!-- 回放信息 -->
      <div class="playback-info" v-if="playbackData.length > 0">
        <span>SN码：{{ playbackData[0]?.sn || '-' }}</span>
        <span>机型：{{ playbackData[0]?.model || '-' }}</span>
        <span>数据点数：{{ playbackData.length }}</span>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>正在加载回放数据...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!hasData && !isLoading" class="empty-state">
        <p>{{ errorMessage || '暂无回放数据' }}</p>
      </div>

      <!-- 回放控制面板 -->
      <div v-if="hasData && !isLoading" class="playback-controls">
        <!-- 播放/暂停按钮 -->
        <div class="control-row">
          <button :class="['play-btn', { playing: isPlaying }]" @click="togglePlay">
            {{ isPlaying ? '⏸ 暂停' : '▶ 播放' }}
          </button>
          <button class="reset-btn" @click="resetPlayback">⏹ 重置</button>
          <div class="speed-control">
            <label>速度：</label>
            <select v-model.number="playbackSpeed" @change="onSpeedChange">
              <option :value="0.5">0.5x</option>
              <option :value="1">1x</option>
              <option :value="2">2x</option>
              <option :value="4">4x</option>
            </select>
          </div>
        </div>

        <!-- 进度条 -->
        <div class="progress-section">
          <span class="time-label">{{ formatTime(currentTime) }}</span>
          <div class="progress-bar" ref="progressBarRef" @click="seekToPosition">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
            <div class="progress-thumb" :style="{ left: progressPercent + '%' }"></div>
          </div>
          <span class="time-label">{{ formatTime(totalDuration) }}</span>
        </div>

        <!-- 当前位置信息 -->
        <div class="current-position-info" v-if="currentIndex >= 0 && currentIndex < playbackData.length">
          <div class="info-grid">
            <div class="info-item">
              <span class="label">时间：</span>
              <span class="value">{{ formatDisplayTime(playbackData[currentIndex].datatime) }}</span>
            </div>
            <div class="info-item">
              <span class="label">经度：</span>
              <span class="value">{{ formatCoordinate(playbackData[currentIndex].lng) }}</span>
            </div>
            <div class="info-item">
              <span class="label">纬度：</span>
              <span class="value">{{ formatCoordinate(playbackData[currentIndex].lat) }}</span>
            </div>
            <div class="info-item">
              <span class="label">高度：</span>
              <span class="value">{{ playbackData[currentIndex].height }}m</span>
            </div>
            <div class="info-item">
              <span class="label">速度：</span>
              <span class="value">{{ playbackData[currentIndex].speed }}m/s</span>
            </div>
            <div class="info-item">
              <span class="label">方位角：</span>
              <span class="value">{{ playbackData[currentIndex].azim }}°</span>
            </div>
            <div class="info-item">
              <span class="label">俯仰角：</span>
              <span class="value">{{ playbackData[currentIndex].pitch }}°</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { messageHandler } from '@/utils/MessageHandler';
import {
  MessageCode,
  type AlarmRecordQuerySingleResponseData,
} from '@/models/models';
import { useMap } from '@/composables/useMap';
import { showTopToast } from '@/utils/toastMessage';
import { formatDisplayTime, formatCoordinate } from '@/utils/timeUtils';

const props = defineProps<{
  recordId?: string | number;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { addOrUpdateUavTarget, addOrUpdatePilotTarget } = useMap();

// 数据状态
const isLoading = ref(false);
const hasData = ref(false);
const errorMessage = ref('');
const playbackData = ref<AlarmRecordQuerySingleResponseData['data']>([]);

// 回放控制状态
const isPlaying = ref(false);
const currentIndex = ref(-1);
const playbackSpeed = ref(1); // 播放速度倍率
let playbackTimer: ReturnType<typeof setInterval> | null = null;
let lastFrameTime = 0;
let accumulatedTime = 0; // 用于变速播放的时间累积

// 时间计算（基于数据点之间的时间差）
const startTime = computed(() => {
  if (playbackData.value.length === 0) return 0;
  return new Date(playbackData.value[0].datatime).getTime();
});

const endTime = computed(() => {
  if (playbackData.value.length === 0) return 0;
  return new Date(playbackData.value[playbackData.value.length - 1].datatime).getTime();
});

const totalDuration = computed(() => {
  return endTime.value - startTime.value;
});

const currentTime = computed(() => {
  if (currentIndex.value < 0 || currentIndex.value >= playbackData.value.length) return 0;
  return new Date(playbackData.value[currentIndex.value].datatime).getTime() - startTime.value;
});

const progressPercent = computed(() => {
  if (totalDuration.value === 0) return 0;
  return Math.min(100, Math.max(0, (currentTime.value / totalDuration.value) * 100));
});

// 格式化时间显示 (mm:ss)
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// 发送单个告警记录查询
async function fetchPlaybackData() {
  if (!props.recordId) {
    errorMessage.value = '缺少航迹号';
    return;
  }

  isLoading.value = true;
  hasData.value = false;
  errorMessage.value = '';

  try {
    await messageHandler.send(
      MessageCode.ALARM_RECORD_QUERY_SINGLE,
      { id: String(props.recordId) },
      'db'
    );
  } catch (error) {
    console.error('[AlarmPlayback] 查询失败:', error);
    errorMessage.value = '查询失败，请重试';
    isLoading.value = false;
  }
}

// 处理查询反馈
function handleQueryResponse(data: AlarmRecordQuerySingleResponseData) {
  isLoading.value = false;

  if (!data.success) {
    errorMessage.value = data.message || '查询失败';
    return;
  }

  if (!data.data || data.data.length === 0) {
    errorMessage.value = '该航迹无回放数据';
    return;
  }

  // 按时间排序确保顺序正确
  playbackData.value = [...data.data].sort((a, b) =>
    new Date(a.datatime).getTime() - new Date(b.datatime).getTime()
  );
  hasData.value = true;

  // 自动开始播放
  resetPlayback();
}

// 将当前帧数据应用到地图
async function applyCurrentFrame() {
  if (currentIndex.value < 0 || currentIndex.value >= playbackData.value.length) return;

  const point = playbackData.value[currentIndex.value];
  const uniqueId = String(point.id);

  try {
    // 创建或更新无人机目标
    await addOrUpdateUavTarget({
      sID: uniqueId,
      dbUavLng: point.lng,
      dbUavLat: point.lat,
      dbHeight: point.height,
    });

    // 创建或更新飞手目标
    await addOrUpdatePilotTarget({
      sID: uniqueId,
      dbPoliteLng: point.dbPilotLng,
      dbPoliteLat: point.dbPilotLat,
    });
  } catch (error) {
    console.error('[AlarmPlayback] 地图更新失败:', error);
  }
}

// 清除地图上的回放目标
async function clearMapTargets() {
  if (!playbackData.value.length) return;

  const uniqueId = String(playbackData.value[0].id);

  try {
    const handler = useMap().handler;
    if (handler) {
      await handler.delIconMarker_3d(uniqueId);
      await handler.delControllerMarker_3d(uniqueId + '_pilot');
    }
  } catch (error) {
    console.error('[AlarmPlayback] 清除地图目标失败:', error);
  }
}

// 开始播放
function startPlayback() {
  if (playbackData.value.length === 0) return;

  isPlaying.value = true;
  lastFrameTime = performance.now();
  accumulatedTime = 0;

  // 如果还没开始，从第一帧开始
  if (currentIndex.value < 0) {
    currentIndex.value = 0;
    applyCurrentFrame();
  }

  // 使用固定30秒播放完所有数据点
  const frameInterval = 30000 / playbackData.value.length; // 每帧间隔(毫秒)

  playbackTimer = setInterval(() => {
    if (!isPlaying.value) return;

    accumulatedTime += frameInterval * playbackSpeed.value;

    // 计算应该显示哪一帧
    const targetIndex = Math.min(
      Math.floor(accumulatedTime / frameInterval),
      playbackData.value.length - 1
    );

    if (targetIndex !== currentIndex.value) {
      currentIndex.value = targetIndex;
      applyCurrentFrame();
    }

    // 播放到最后一帧后停止
    if (currentIndex.value >= playbackData.value.length - 1) {
      pausePlayback();
    }
  }, 16); // ~60fps 更新频率
}

// 暂停播放
function pausePlayback() {
  isPlaying.value = false;
  if (playbackTimer) {
    clearInterval(playbackTimer);
    playbackTimer = null;
  }
}

// 切换播放/暂停
function togglePlay() {
  if (isPlaying.value) {
    pausePlayback();
  } else {
    startPlayback();
  }
}

// 重置播放
function resetPlayback() {
  pausePlayback();
  currentIndex.value = -1;
  accumulatedTime = 0;
  clearMapTargets();
}

// 跳转到指定位置
function seekToPosition(event: MouseEvent) {
  const progressBar = event.currentTarget as HTMLElement;
  if (!progressBar) return;

  const rect = progressBar.getBoundingClientRect();
  const percent = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));

  // 根据百分比计算对应的索引
  const targetIndex = Math.round(percent * (playbackData.value.length - 1));

  if (targetIndex !== currentIndex.value) {
    const wasPlaying = isPlaying.value;
    pausePlayback();
    currentIndex.value = targetIndex;
    accumulatedTime = targetIndex * (30000 / playbackData.value.length);
    applyCurrentFrame();

    if (wasPlaying) {
      startPlayback();
    }
  }
}

// 速度变化处理
function onSpeedChange() {
  // 速度变化时不需要重置，只需让下一次定时器使用新速度即可
}

// 关闭弹窗
function handleClose() {
  pausePlayback();
  clearMapTargets();
  emit('close');
}

// 注册消息处理器
function registerHandlers() {
  messageHandler.setAlarmRecordHandlers({
    onQueryResponse: handleQueryResponse,
    onQuerySingleResponse: handleQueryResponse,
    onDeleteResponse: () => {},
  });
}

// 注销消息处理器
function unregisterHandlers() {
  messageHandler.setAlarmRecordHandlers({
    onQueryResponse: () => {},
    onQuerySingleResponse: () => {},
    onDeleteResponse: () => {},
  });
}

// 监听 recordId 变化
watch(
  () => props.recordId,
  (newVal) => {
    if (newVal) {
      resetPlayback();
      fetchPlaybackData();
    }
  },
  { immediate: true }
);

onMounted(() => {
  registerHandlers();
});

onUnmounted(() => {
  pausePlayback();
  clearMapTargets();
  unregisterHandlers();
});
</script>

<style scoped>
.alarm-playback-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.alarm-playback-container {
  width: 600px;
  max-height: 80vh;
  background: rgba(13, 22, 45, 0.95);
  border: 1px solid rgba(64, 158, 255, 0.3);
  border-radius: 12px;
  padding: 20px;
  color: #e0e8f0;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.playback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(64, 158, 255, 0.2);
}

.playback-header h3 {
  margin: 0;
  font-size: 16px;
  color: #fff;
}

.close-btn {
  background: none;
  border: none;
  color: #8899aa;
  font-size: 24px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #ff5555;
}

.playback-info {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  font-size: 12px;
  color: #aabbcc;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #667788;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(64, 158, 255, 0.2);
  border-top-color: #409eff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.playback-controls {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.play-btn,
.reset-btn {
  padding: 6px 18px;
  border: 1px solid rgba(64, 158, 255, 0.4);
  border-radius: 6px;
  background: rgba(64, 158, 255, 0.15);
  color: #409eff;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.play-btn:hover,
.reset-btn:hover {
  background: rgba(64, 158, 255, 0.25);
  border-color: #409eff;
}

.play-btn.playing {
  background: rgba(76, 175, 80, 0.2);
  border-color: rgba(76, 175, 80, 0.5);
  color: #4caf50;
}

.reset-btn {
  opacity: 0.7;
}

.speed-control {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  font-size: 12px;
  color: #99aabb;
}

.speed-control select {
  background: rgba(20, 35, 65, 0.8);
  border: 1px solid rgba(64, 158, 255, 0.3);
  border-radius: 4px;
  color: #e0e8f0;
  font-size: 12px;
  padding: 2px 6px;
  outline: none;
}

.progress-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.time-label {
  font-size: 11px;
  color: #778899;
  min-width: 36px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(64, 158, 255, 0.15);
  border-radius: 3px;
  position: relative;
  cursor: pointer;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff, #67c23a);
  border-radius: 3px;
  transition: width 0.05s linear;
}

.progress-thumb {
  width: 12px;
  height: 12px;
  background: #fff;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 4px rgba(64, 158, 255, 0.5);
  pointer-events: none;
}

.current-position-info {
  background: rgba(20, 35, 65, 0.5);
  border-radius: 8px;
  padding: 12px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.info-item .label {
  color: #778899;
  min-width: 48px;
}

.info-item .value {
  color: #e0e8f0;
  font-variant-numeric: tabular-nums;
}
</style>
