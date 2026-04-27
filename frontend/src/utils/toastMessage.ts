/**
 * 全局消息提示工具
 * 提供页面顶部 Toast 消息提示，支持自动消失
 */

/** 消息提示回调类型 */
type MessageCallback = (message: string) => void;

/** 全局消息提示监听器列表 */
const listeners: Set<MessageCallback> = new Set();

/**
 * 注册消息提示监听器
 * @param callback 消息回调函数
 * @returns 取消注册的函数
 */
export const onToastMessage = (callback: MessageCallback): (() => void) => {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
};

/**
 * 显示 Toast 消息提示（2秒后自动消失）
 * 组件中通过 onToastMessage 注册监听器接收消息，自行控制显示/隐藏
 * @param message 消息内容
 * @param duration 显示时长（毫秒），默认2000
 */
export const showTopToast = (message: string, _duration: number = 2000): void => {
  listeners.forEach(callback => {
    try {
      callback(message);
    } catch (e) {
      console.error('[ToastMessage] 回调执行失败:', e);
    }
  });
};
