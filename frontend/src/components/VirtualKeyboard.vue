<template>
  <Teleport to="body">
    <Transition name="keyboard-slide">
      <div v-if="visible" class="virtual-keyboard" @touchstart.stop @mousedown.stop>
        <div class="keyboard-header">
          <span class="keyboard-title">虚拟键盘</span>
          <button class="keyboard-close" @click="close">关闭</button>
        </div>
        <div class="keyboard-content">
          <div class="keyboard-row">
            <button
              v-for="key in row1"
              :key="key"
              class="key-btn"
              :class="{ 'key-space': key === '空格' }"
              @click="handleKey(key)"
            >
              {{ key }}
            </button>
          </div>
          <div class="keyboard-row">
            <button
              v-for="key in row2"
              :key="key"
              class="key-btn"
              @click="handleKey(key)"
            >
              {{ key }}
            </button>
          </div>
          <div class="keyboard-row">
            <button
              v-for="key in row3"
              :key="key"
              class="key-btn"
              :class="{ 'key-space': key === '空格' }"
              @click="handleKey(key)"
            >
              {{ key }}
            </button>
          </div>
          <div class="keyboard-row">
            <button
              v-for="key in row4"
              :key="key"
              class="key-btn"
              :class="{
                'key-wide': ['ABC', '完成', '删除'].includes(key),
                'key-special': ['123', '返回'].includes(key)
              }"
              @click="handleKey(key)"
            >
              {{ key }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
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

// 字母键盘布局
const row1 = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
const row2 = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
const row3 = ['z', 'x', 'c', 'v', 'b', 'n', 'm', '删除'];
const row4 = ['123', 'ABC', '空格', '返回', '完成'];

const isNumberMode = ref(false);
const currentValue = ref('');

const numberRow1 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
const numberRow2 = ['-', '/', ':', ';', '(', ')', '$', '&', '@', '"'];
const numberRow3 = ['.', ',', '?', '!', "'", '删除'];
const numberRow4 = ['123', 'ABC', '空格', '返回', '完成'];

const handleKey = (key: string) => {
  if (key === '删除') {
    if (props.inputRef) {
      const pos = props.inputRef.selectionStart || 0;
      const val = props.inputRef.value;
      props.inputRef.value = val.slice(0, pos - 1) + val.slice(pos);
      props.inputRef.setSelectionRange(pos - 1, pos - 1);
      props.inputRef.focus();
    }
    return;
  }

  if (key === '123' || key === 'ABC') {
    isNumberMode.value = key === '123';
    return;
  }

  if (key === '返回') {
    isNumberMode.value = !isNumberMode.value;
    return;
  }

  if (key === '完成') {
    close();
    return;
  }

  if (key === '空格') {
    insertText(' ');
    return;
  }

  insertText(key);
};

const insertText = (text: string) => {
  if (props.inputRef) {
    const pos = props.inputRef.selectionStart || 0;
    const val = props.inputRef.value;
    props.inputRef.value = val.slice(0, pos) + text + val.slice(pos);
    props.inputRef.setSelectionRange(pos + text.length, pos + text.length);
    props.inputRef.focus();
  }
};

const close = () => {
  emit('update:visible', false);
  emit('close');
  if (props.inputRef) {
    props.inputRef.blur();
  }
};

watch(() => props.inputRef, (newRef) => {
  if (newRef) {
    currentValue.value = newRef.value;
  }
});
</script>

<style scoped>
.virtual-keyboard {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #2a2a3a;
  border-top: 1px solid #444;
  z-index: 9999;
  user-select: none;
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

/* 过渡动画 */
.keyboard-slide-enter-active,
.keyboard-slide-leave-active {
  transition: transform 0.3s ease;
}

.keyboard-slide-enter-from,
.keyboard-slide-leave-to {
  transform: translateY(100%);
}
</style>
