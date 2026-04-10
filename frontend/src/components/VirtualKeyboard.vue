<template>
  <div v-if="visible" class="virtual-keyboard" @touchstart.stop @mousedown.stop>
    <div class="keyboard-header">
      <span class="keyboard-title">{{ isNumberMode ? '数字/符号' : (isUpperCase ? '大写字母' : '小写字母') }}</span>
      <button class="keyboard-close" @click="close">关闭</button>
    </div>
    <div class="keyboard-content">
      <!-- 字母键盘 -->
      <template v-if="!isNumberMode">
        <div class="keyboard-row">
          <button
            v-for="key in (isUpperCase ? upperRow1 : row1)"
            :key="'a-' + key"
            class="key-btn"
            @click="handleKey(key)"
          >
            {{ key }}
          </button>
        </div>
        <div class="keyboard-row">
          <button
            v-for="key in (isUpperCase ? upperRow2 : row2)"
            :key="'a-' + key"
            class="key-btn"
            @click="handleKey(key)"
          >
            {{ key }}
          </button>
        </div>
        <div class="keyboard-row">
          <button
            v-for="key in (isUpperCase ? upperRow3 : row3)"
            :key="'a-' + key"
            class="key-btn"
            :class="{ 'key-wide': key === '删除' }"
            @click="handleKey(key)"
          >
            {{ key }}
          </button>
        </div>
        <div class="keyboard-row">
          <button class="key-btn" @click="handleKey('123')">123</button>
          <button class="key-btn key-case" @click="handleKey('大小写')">{{ isUpperCase ? 'abc' : 'ABC' }}</button>
          <button class="key-btn key-space" @click="handleKey('空格')">空格</button>
          <button class="key-btn key-wide" @click="handleKey('完成')">完成</button>
        </div>
      </template>

      <!-- 数字键盘 -->
      <template v-else>
        <div class="keyboard-row">
          <button
            v-for="key in numRow1"
            :key="'n-' + key"
            class="key-btn"
            @click="handleKey(key)"
          >
            {{ key }}
          </button>
        </div>
        <div class="keyboard-row">
          <button
            v-for="key in numRow2"
            :key="'n-' + key"
            class="key-btn"
            @click="handleKey(key)"
          >
            {{ key }}
          </button>
        </div>
        <div class="keyboard-row">
          <button
            v-for="key in numRow3"
            :key="'n-' + key"
            class="key-btn"
            :class="{ 'key-wide': key === '删除' || key === '空格' }"
            @click="handleKey(key)"
          >
            {{ key }}
          </button>
        </div>
        <div class="keyboard-row">
          <button class="key-btn" @click="handleKey('123')">123</button>
          <button class="key-btn key-case" @click="handleKey('abc')">abc</button>
          <button class="key-btn key-space" @click="handleKey('空格')">空格</button>
          <button class="key-btn key-wide" @click="handleKey('完成')">完成</button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  visible: boolean;
  inputRef: HTMLInputElement | null;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'input', value: string): void;
  (e: 'close'): void;
}>();

// 小写字母键盘布局
const row1 = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
const row2 = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
const row3 = ['z', 'x', 'c', 'v', 'b', 'n', 'm', '删除'];

// 大写字母键盘布局
const upperRow1 = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
const upperRow2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
const upperRow3 = ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '删除'];

// 数字键盘布局
const numRow1 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
const numRow2 = ['-', '/', ':', ';', '(', ')', '$', '&', '@', '"'];
const numRow3 = ['.', ',', '?', '!', "'", '删除', '空格'];

// 键盘模式
const isNumberMode = ref(false);
const isUpperCase = ref(false);

/**
 * 处理按键
 */
const handleKey = (key: string) => {
  // 切换到数字模式
  if (key === '123') {
    isNumberMode.value = true;
    return;
  }

  // 从数字模式切换回字母模式（小写）
  if (key === 'abc') {
    isNumberMode.value = false;
    isUpperCase.value = false;
    return;
  }

  // 大小写切换
  if (key === '大小写') {
    isUpperCase.value = !isUpperCase.value;
    return;
  }

  // 删除键
  if (key === '删除') {
    if (props.inputRef) {
      const pos = props.inputRef.selectionStart || 0;
      const val = props.inputRef.value;
      if (pos > 0) {
        props.inputRef.value = val.slice(0, pos - 1) + val.slice(pos);
        props.inputRef.setSelectionRange(pos - 1, pos - 1);
        props.inputRef.dispatchEvent(new Event('input', { bubbles: true }));
      }
      props.inputRef.focus();
    }
    return;
  }

  // 完成键
  if (key === '完成') {
    close();
    return;
  }

  // 空格键
  if (key === '空格') {
    insertText(' ');
    return;
  }

  // 普通字母或数字
  insertText(key);
};

/**
 * 插入文本
 */
const insertText = (text: string) => {
  if (props.inputRef) {
    const pos = props.inputRef.selectionStart || 0;
    const val = props.inputRef.value;
    props.inputRef.value = val.slice(0, pos) + text + val.slice(pos);
    props.inputRef.setSelectionRange(pos + text.length, pos + text.length);
    props.inputRef.dispatchEvent(new Event('input', { bubbles: true }));
    props.inputRef.focus();
  }
};

/**
 * 关闭键盘
 */
const close = () => {
  emit('update:visible', false);
  emit('close');
  if (props.inputRef) {
    props.inputRef.blur();
  }
};

// 监听 visible 变化，重置键盘模式
watch(() => props.visible, (newVal) => {
  if (newVal) {
    isNumberMode.value = false;
    isUpperCase.value = false;
  }
});
</script>

<style scoped>
.virtual-keyboard {
  width: 100%;
  background: #2a2a3a;
  border-top: 1px solid #444;
  user-select: none;
  flex-shrink: 0;
}

.keyboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #1a1a2a;
  border-bottom: 1px solid #444;
}

.keyboard-title {
  color: #888;
  font-size: 12px;
}

.keyboard-close {
  background: #444;
  border: none;
  color: #fff;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.keyboard-close:hover {
  background: #555;
}

.keyboard-content {
  padding: 8px 4px;
}

.keyboard-row {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

.keyboard-row:last-child {
  margin-bottom: 0;
}

.key-btn {
  min-width: 32px;
  height: 44px;
  margin: 0 2px;
  background: #3a3a4a;
  border: 1px solid #555;
  border-radius: 6px;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s ease;
}

.key-btn:active {
  background: #555;
  transform: scale(0.95);
}

.key-btn.key-space {
  min-width: 120px;
}

.key-btn.key-wide {
  min-width: 60px;
  background: #4a4a5a;
}

.key-btn.key-special {
  background: #2a5a8a;
}

.key-btn.key-case {
  background: #3a3a4a;
  min-width: 50px;
}
</style>
