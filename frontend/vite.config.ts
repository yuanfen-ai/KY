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
        },
        // 地图服务代理 - 解决HTTPS混合内容问题
        '/map-service': {
          target: 'http://1.14.100.199:8888',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/map-service/, ''),
          secure: false
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
    optimizeDeps: {
      exclude: [],
      include: []
    },
    clearScreen: false
  };
});
