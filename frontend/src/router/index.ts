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
  },
  {
    path: '/nofly',
    name: 'NoFlyZone',
    component: () => import('../views/NoFlyZone.vue'),
    meta: {
      title: '禁飞区设置 - 手持察打一体设备',
      requiresAuth: true
    }
  },
  {
    path: '/interference-records',
    name: 'InterferenceRecords',
    component: () => import('../views/InterferenceRecords.vue'),
    meta: {
      title: '干扰操作记录 - 手持察打一体设备',
      requiresAuth: true
    }
  },
  {
    path: '/alarm-records',
    name: 'AlarmRecords',
    component: () => import('../views/AlarmRecords.vue'),
    meta: {
      title: '告警记录 - 手持察打一体设备',
      requiresAuth: true
    }
  },
  {
    path: '/deception-records',
    name: 'DeceptionRecords',
    component: () => import('../views/DeceptionRecords.vue'),
    meta: {
      title: '诱骗操作记录 - 手持察打一体设备',
      requiresAuth: true
    }
  },
  {
    path: '/blackwhitelist-config',
    name: 'BlackWhiteListConfig',
    component: () => import('../views/BlackWhiteListConfig.vue'),
    meta: {
      title: '黑白名单配置 - 手持察打一体设备',
      requiresAuth: true
    }
  },
  {
    path: '/detection-records',
    name: 'DetectionRecords',
    component: () => import('../views/DetectionRecords.vue'),
    meta: {
      title: '侦测操作记录 - 手持察打一体设备',
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
  console.log('[Router] 路由跳转:', to.path);

  // 设置页面标题
  document.title = to.meta.title as string || '手持察打一体设备';

  // 登录页始终允许访问
  if (to.path === '/login') {
    console.log('[Router] 访问登录页，允许访问');
    next();
    return;
  }

  // 检查登录状态
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  console.log('[Router] 登录状态:', isLoggedIn);

  if (to.meta.requiresAuth && !isLoggedIn) {
    // 需要登录但未登录，跳转到登录页
    console.log('[Router] 需要登录但未登录，跳转到登录页');
    next('/login');
  } else {
    console.log('[Router] 允许访问:', to.path);
    next();
  }
});

console.log('[Router] 路由配置完成');

export default router;
