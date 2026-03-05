import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  
  return {
    plugins: [
      vue({
        script: {
          defineModel: true
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    base: '/',
    server: {
      port: 5000,
      host: true,
      hmr: true,
      strictPort: false,
      watch: {
        usePolling: true,
        interval: 1000
      },
      proxy: {
        '/ws': {
          target: 'ws://localhost:8080',
          ws: true,
          changeOrigin: true
        }
      },
      fs: {
        strict: false
      }
    },
    build: {
      target: 'es2015',
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          entryFileNames: `assets/[name]-[hash].js`,
          chunkFileNames: `assets/[name]-[hash].js`,
          assetFileNames: `assets/[name]-[hash].[ext]`
        }
      }
    },
    cacheDir: '.vite-cache',
    // 确保 HMR 不被包含在生产构建中
    // 移除 esbuild.drop 配置，避免潜在的兼容性问题
    optimizeDeps: {
      exclude: [],
      include: []
    },
    clearScreen: false,
    // 禁用Vite的HMR客户端注入
    define: {
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_HMR_RUNTIME__: false
    }
  };
});
