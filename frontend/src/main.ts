import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import 'element-plus/dist/index.css';
import './style.css';  // 全局样式 - 在 Element Plus 之后加载以覆盖默认样式
import App from './App.vue';
import router from './router';

console.log('[Main] 开始初始化Vue应用...');

const app = createApp(App);

console.log('[Main] 注册Pinia...');
app.use(createPinia());

// 自定义中文 locale，去掉年份后面的"年"字
const customZhCn = {
  ...zhCn,
  el: {
    ...zhCn.el,
    datepicker: {
      ...zhCn.el.datepicker,
      year: '',  // 去掉年份后面的"年"字
    }
  }
};

console.log('[Main] 注册Element Plus...');
app.use(ElementPlus, { locale: customZhCn });

console.log('[Main] 注册路由...');
app.use(router);

console.log('[Main] 挂载应用到#app...');
app.mount('#app');

console.log('[Main] Vue应用初始化完成！');
