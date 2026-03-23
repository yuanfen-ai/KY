import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

// 地图服务注入脚本
const CALLBACK_INJECT_SCRIPT = `
<script>
(function() {
  var callbackMethods = ['loadComplete', 'selectOther', 'selectRight_ClickOther', 'onLocationSelected', 'mouseLocation', 'selectDraggableDevLoc'];
  window.callbackObj = window.callbackObj || {};
  callbackMethods.forEach(function(methodName) {
    if (!window.callbackObj[methodName]) {
      window.callbackObj[methodName] = function() {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({
            type: 'CALLBACK_' + methodName,
            args: Array.from(arguments)
          }, '*');
        }
      };
    }
  });
  window.addEventListener('message', function(event) {
    var data = event.data;
    if (data && data.type === 'INIT_CALLBACK' && data.methods) {
      data.methods.forEach(function(methodName) {
        if (!window.callbackObj[methodName]) {
          window.callbackObj[methodName] = function() {
            window.parent.postMessage({
              type: 'CALLBACK_' + methodName,
              args: Array.from(arguments)
            }, '*');
          };
        }
      });
    }
  });
  window.addEventListener('load', function() {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'MAP_LOADED' }, '*');
    }
  });
})();
</script>
`;

// 地图代理目标地址
const MAP_TARGET = process.env.MAP_TARGET || 'http://1.14.100.199:8888';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  
  return {
    plugins: [
      vue({
        script: {
          defineModel: true
        }
      }),
      // 开发模式下注入脚本到地图HTML
      isDev && {
        name: 'map-script-inject',
        configureServer(server) {
          server.middlewares.use('/map-service', (req, res, next) => {
            const fetchUrl = `${MAP_TARGET}${req.url || ''}`;
            
            fetch(fetchUrl)
              .then(response => {
                const contentType = response.headers.get('content-type') || '';
                const url = req.url || '';
                
                const isHtmlFile = url.endsWith('.html') || url.endsWith('.htm') || url === '' || url.endsWith('/');
                const isHtmlContentType = contentType.includes('text/html');
                
                if (isHtmlFile && isHtmlContentType) {
                  return response.text().then(body => {
                    body = body.replace(/<head[^>]*>/i, '<head>' + CALLBACK_INJECT_SCRIPT);
                    console.log('[MapProxy] 已注入 callbackObj 脚本到:', url);
                    
                    res.setHeader('Content-Type', 'text/html; charset=utf-8');
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.end(body);
                  });
                } else {
                  // 非 HTML 文件，直接透传
                  res.setHeader('Access-Control-Allow-Origin', '*');
                  response.headers.forEach((value, key) => {
                    res.setHeader(key, value);
                  });
                  return response.arrayBuffer().then(buffer => {
                    res.end(Buffer.from(buffer));
                  });
                }
              })
              .catch(err => {
                console.error('[MapProxy] 代理错误:', err.message);
                res.statusCode = 502;
                res.end('Proxy Error: ' + err.message);
              });
          });
        }
      }
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    base: '/',
    server: {
      port: 5000,
      host: true,
      strictPort: true,
      hmr: {
        path: '/hmr'
      },
      watch: {
        usePolling: true,
        interval: 1000
      },
      proxy: {
        '/ws': {
          target: process.env.WS_TARGET || 'ws://1.14.100.199:8050',
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
    optimizeDeps: {
      exclude: [],
      include: []
    },
    clearScreen: false
  };
});
