declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

interface ImportMetaEnv {
  readonly VITE_WS_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
// SecurityError修复 - 构建版本: 2026-03-03-16-30
// 已移除所有Vite HMR相关代码
// 使用纯静态文件服务器
