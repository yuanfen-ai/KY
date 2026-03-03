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
    base: './',
    server: {
      port: 5000,
      host: true,
      hmr: false,
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
      target: 'esnext',
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
    optimizeDeps: {
      exclude: [],
      include: []
    },
    clearScreen: false,
    // 禁用Vite的HMR客户端注入
    define: {
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false
    }
  };
});
