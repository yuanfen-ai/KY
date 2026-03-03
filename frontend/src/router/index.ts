import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: {
      title: '登录 - 手持察打一体设备',
      requiresAuth: false
    }
  },
  {
    path: '/main',
    name: 'Main',
    component: () => import('../views/Main.vue'),
    meta: {
      title: '主界面 - 手持察打一体设备',
      requiresAuth: true
    }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 路由守卫
router.beforeEach((to, _from, next) => {
  // 设置页面标题
  document.title = to.meta.title as string || '手持察打一体设备';

  // 检查登录状态
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  if (to.meta.requiresAuth && !isLoggedIn) {
    // 需要登录但未登录，跳转到登录页
    next('/login');
  } else if (to.path === '/login' && isLoggedIn) {
    // 已登录用户访问登录页，跳转到主页
    next('/main');
  } else {
    next();
  }
});

export default router;
