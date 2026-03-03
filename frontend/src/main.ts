import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue';

const app = createApp(App);

app.use(createPinia());
app.use(ElementPlus);

// 全局错误处理
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue全局错误:', err);
  console.error('错误信息:', info);
  console.error('组件实例:', instance);
};

// 捕获未处理的Promise错误
window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的Promise错误:', event.reason);
});

// 捕获全局错误
window.addEventListener('error', (event) => {
  console.error('全局错误:', event.message);
  console.error('错误堆栈:', event.error?.stack);
  console.error('错误来源:', event.filename, event.lineno, event.colno);
});

app.mount('#app');
