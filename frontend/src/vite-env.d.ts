/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

// 运行时配置类型（config.js 注入）
interface AppConfig {
  VITE_MAP_TARGET?: string;
  VITE_WS_TARGET?: string;
}

declare global {
  interface Window {
    __APP_CONFIG__?: AppConfig;
  }
}

interface ImportMetaEnv {
  readonly VITE_MAP_TARGET?: string;
  readonly VITE_WS_TARGET?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_WS_URL?: string;
  readonly VITE_HMR?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
