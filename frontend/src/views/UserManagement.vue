<template>
  <PageTemplate>
    <!-- 标题栏 -->
    <div class="header-bar">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          <span class="back-icon">←</span>
        </button>
      </div>
      <div class="header-title">用户管理</div>
      <div class="header-right"></div>
    </div>

    <!-- 查询筛选区域 -->
    <div class="filter-area">
      <div class="filter-item">
        <label class="filter-label">账号:</label>
        <input
          ref="accountInputRef"
          v-model="filters.account"
          type="text"
          class="filter-input"
          placeholder="请输入账号"
          @focus="handleInputFocus(accountInputRef)"
        />
      </div>
      <div class="filter-item">
        <label class="filter-label">电话:</label>
        <input
          ref="phoneInputRef"
          v-model="filters.phone"
          type="text"
          class="filter-input"
          placeholder="请输入电话"
          @focus="handleInputFocus(phoneInputRef)"
        />
      </div>
      <div class="filter-buttons">
        <button class="filter-btn add-btn" @click="openAddDialog">新增</button>
        <button class="filter-btn query-btn" @click="handleQuery">查询</button>
      </div>
    </div>

    <!-- 数据表格区域 -->
    <div class="table-area">
      <table class="records-table">
        <thead>
          <tr>
            <th>账号</th>
            <th>姓名</th>
            <th>电话</th>
            <th>性别</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in paginatedRecords" :key="record.id">
            <td>{{ record.account }}</td>
            <td>{{ record.name }}</td>
            <td>{{ record.phone }}</td>
            <td>{{ record.gender === 0 ? '女' : record.gender === 1 ? '男' : '-' }}</td>
            <td>
              <button class="op-btn edit-btn" @click="handleEdit(record)" title="编辑">✏️</button>
              <button v-if="record.account !== 'admin'" class="op-btn delete-btn" @click="handleDelete(record.id)" title="删除">🗑️</button>
              <span v-else class="op-btn-disabled" title="禁止删除">🗑️</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页导航 -->
    <Pagination
      v-model:current-page="currentPage"
      :total-records="totalRecords"
      :page-size="pageSize"
      @page-change="handlePageChange"
    />

    <!-- 虚拟键盘容器 -->
    <div class="keyboard-wrapper" :class="{ 'keyboard-visible': isKeyboardVisible }">
      <VirtualKeyboard
        v-model:visible="isKeyboardVisible"
        :input-ref="currentInputRef"
        @close="handleKeyboardClose"
      />
    </div>

    <!-- 新增/编辑悬浮窗 -->
    <Transition name="slide">
      <PanelTemplate
        v-if="showDialog"
        :title="dialogMode === 'add' ? '新增用户' : '编辑用户'"
        @close="closeDialog"
        class="nofly-panel"
      >
        <div class="add-form">
          <div class="form-row">
            <span class="form-label">账号:</span>
            <div class="form-input-wrapper">
              <input
                ref="dialogAccountRef"
                v-model="formData.account"
                type="text"
                class="form-input"
                :class="{ 'input-disabled': formData.account === 'admin' }"
                placeholder="请输入账号"
                :disabled="formData.account === 'admin'"
                @focus="formData.account !== 'admin' && handleInputFocus(dialogAccountRef)"
              />
            </div>
          </div>
          <div class="form-row">
            <span class="form-label">姓名:</span>
            <div class="form-input-wrapper">
              <input
                ref="dialogNameRef"
                v-model="formData.name"
                type="text"
                class="form-input"
                placeholder="请输入姓名"
                @focus="handleInputFocus(dialogNameRef)"
              />
            </div>
          </div>
          <div class="form-row">
            <span class="form-label">电话:</span>
            <div class="form-input-wrapper">
              <input
                ref="dialogPhoneRef"
                v-model="formData.phone"
                type="text"
                class="form-input"
                placeholder="请输入电话"
                @focus="handleInputFocus(dialogPhoneRef)"
              />
            </div>
          </div>
          <div class="form-row">
            <span class="form-label">密码:</span>
            <div class="form-input-wrapper">
              <input
                ref="dialogPasswordRef"
                v-model="formData.password"
                :type="showPassword ? 'text' : 'password'"
                class="form-input"
                placeholder="请输入密码"
                @focus="handleInputFocus(dialogPasswordRef)"
              />
              <button type="button" class="toggle-password" @click="togglePasswordVisibility">
                {{ showPassword ? '👁️' : '👁️‍🗨️' }}
              </button>
            </div>
          </div>
          <div class="form-row">
            <span class="form-label">性别:</span>
            <div class="form-input-wrapper">
              <select v-model="formData.gender" class="form-select">
                <option :value="0">女</option>
                <option :value="1">男</option>
              </select>
            </div>
          </div>
          <div class="form-buttons">
            <button class="btn-cancel" @click="closeDialog">取消</button>
            <button class="btn-confirm" @click="submitForm">确认</button>
          </div>
        </div>
      </PanelTemplate>
    </Transition>
  </PageTemplate>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import PageTemplate from '@/components/PageTemplate.vue';
import PanelTemplate from '@/components/PanelTemplate.vue';
import Pagination from '@/components/Pagination.vue';
import VirtualKeyboard from '@/components/VirtualKeyboard.vue';
import { PAGINATION_CONFIG } from '@/config/index';
import { messageHandler, MessageCode } from '@/utils/MessageHandler';

const router = useRouter();

// ========================================
// 用户管理消息处理器
// ========================================

// 查询用户
const queryUsers = (page?: number) => {
  const pageNum = page ?? currentPage.value;
  const requestData = {
    username: filters.value.account || undefined,
    phone: filters.value.phone || undefined,
    page: pageNum,
    pageSize: pageSize.value
  };
  messageHandler.send(MessageCode.USER_QUERY, requestData, 'db');
};

// 新增用户响应处理
const handleUserAddResponse = (data: any) => {
  console.log('[UserManagement] 新增用户响应:', data);
  
  if (!data) {
    console.error('[UserManagement] 新增用户响应数据为空');
    ElMessage.error('新增用户响应数据为空');
    return;
  }
  
  if (data.success) {
    ElMessage.success(data.message || '新增成功');
    closeDialog();
    queryUsers();
  } else {
    ElMessage.error(data.message || '新增失败');
  }
};

// 修改用户响应处理
const handleUserUpdateResponse = (data: any) => {
  console.log('[UserManagement] 修改用户响应:', data);
  
  if (!data) {
    console.error('[UserManagement] 修改用户响应数据为空');
    ElMessage.error('修改用户响应数据为空');
    return;
  }
  
  if (data.success) {
    ElMessage.success(data.message || '修改成功');
    closeDialog();
    queryUsers();
  } else {
    ElMessage.error(data.message || '修改失败');
  }
};

// 删除用户响应处理
const handleUserDeleteResponse = (data: any) => {
  console.log('[UserManagement] 删除用户响应:', data);
  
  if (!data) {
    console.error('[UserManagement] 删除用户响应数据为空');
    ElMessage.error('删除用户响应数据为空');
    return;
  }
  
  if (data.success) {
    ElMessage.success(data.message || '删除成功');
    queryUsers();
  } else {
    ElMessage.error(data.message || '删除失败');
  }
};

// 查询用户响应处理
const handleUserQueryResponse = (data: any) => {
  console.log('[UserManagement] 查询用户响应:', data);
  
  if (!data) {
    console.error('[UserManagement] 查询用户响应数据为空');
    ElMessage.error('查询用户响应数据为空');
    return;
  }
  
  if (data.success) {
    const list = data.data || [];
    const total = data.total || 0;
    const page = data.page || 1;
    
    console.log('[UserManagement] 解析数据:', { list, total, page });
    
    // 更新分页状态
    totalRecords.value = total;
    currentPage.value = page;
    
    // 转换数据格式以适配前端显示（username -> account）
    const newRecords = list.map((item: any) => ({
      id: item.id.toString(),
      account: item.username,
      name: item.name,
      phone: item.phone,
      gender: item.gender,
      password: item.password || ''
    }));
    
    console.log('[UserManagement] 更新后的数据:', newRecords);
    allRecords.value = newRecords;
    console.log('[UserManagement] allRecords.value 长度:', allRecords.value.length);
    
    console.log(`[UserManagement] 查询成功，共 ${total} 条记录，当前第 ${page} 页`);
  } else {
    ElMessage.error(data.message || '查询失败');
  }
};

// 返回上一页
const goBack = () => {
  router.push('/main');
};

// 虚拟键盘相关
const isKeyboardVisible = ref(false);
const currentInputRef = ref<HTMLInputElement | null>(null);
const accountInputRef = ref<HTMLInputElement | null>(null);
const phoneInputRef = ref<HTMLInputElement | null>(null);
const dialogAccountRef = ref<HTMLInputElement | null>(null);
const dialogNameRef = ref<HTMLInputElement | null>(null);
const dialogPhoneRef = ref<HTMLInputElement | null>(null);
const dialogPasswordRef = ref<HTMLInputElement | null>(null);
const showPassword = ref(false);
const preventKeyboardOpen = ref(false);

const handleInputFocus = (inputRef: HTMLInputElement | null) => {
  if (preventKeyboardOpen.value) {
    preventKeyboardOpen.value = false;
    return;
  }
  if (inputRef) {
    currentInputRef.value = inputRef;
    isKeyboardVisible.value = true;
  }
};

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
  preventKeyboardOpen.value = true;
  setTimeout(() => {
    preventKeyboardOpen.value = false;
  }, 300);
};

const handleKeyboardClose = () => {
  isKeyboardVisible.value = false;
};

// 查询筛选
const filters = ref({
  account: '',
  phone: ''
});

// 用户列表数据
const allRecords = ref<any[]>([]);

// 分页相关数据
const currentPage = ref(1);
const pageSize = ref(PAGINATION_CONFIG.PAGE_SIZE);
const totalRecords = ref(0);

// 计算当前页显示的数据（后端返回的data已经是当前页数据，不需要前端再分页）
const paginatedRecords = computed(() => {
  return allRecords.value;
});

// 分页页码变化
const handlePageChange = (page: number) => {
  console.log('[UserManagement] 页码变化:', page);
  currentPage.value = page;
  queryUsers(page);
};

// 查询处理
const handleQuery = () => {
  console.log('[UserManagement] 查询:', filters.value);
  currentPage.value = 1;
  queryUsers(1);
};

// 删除处理
const handleDelete = (id: string) => {
  console.log('[UserManagement] 删除记录:', id);
  
  const requestData = {
    id: parseInt(id)
  };
  
  // 发送删除请求，响应通过处理器回调处理
  messageHandler.send(MessageCode.USER_DELETE, requestData, 'db');
  console.log('[UserManagement] 删除请求已发送，等待响应...');
};

// 弹窗相关
const showDialog = ref(false);
const dialogMode = ref<'add' | 'edit'>('add');

const formData = ref({
  id: 0,
  account: '',
  name: '',
  phone: '',
  password: '',
  gender: 0
});

const openAddDialog = () => {
  dialogMode.value = 'add';
  formData.value = {
    id: 0,
    account: '',
    name: '',
    phone: '',
    password: '',
    gender: 0
  };
  showDialog.value = true;
  isKeyboardVisible.value = false;
};

const handleEdit = (record: any) => {
  dialogMode.value = 'edit';
  formData.value = {
    id: record.id,
    account: record.account,
    name: record.name,
    phone: record.phone,
    password: record.password || '',
    gender: record.gender ?? 0
  };
  showDialog.value = true;
  isKeyboardVisible.value = false;
};

const closeDialog = () => {
  showDialog.value = false;
  isKeyboardVisible.value = false;
};

const submitForm = () => {
  if (!formData.value.account) {
    ElMessage.warning('请输入账号');
    return;
  }
  if (!formData.value.name) {
    ElMessage.warning('请输入姓名');
    return;
  }
  if (!formData.value.phone) {
    ElMessage.warning('请输入电话');
    return;
  }
  if (!formData.value.password) {
    ElMessage.warning('请输入密码');
    return;
  }

  const requestData = {
    username: formData.value.account,
    name: formData.value.name,
    phone: formData.value.phone,
    password: formData.value.password,
    gender: formData.value.gender
  };
  
  if (dialogMode.value === 'add') {
    // 新增用户
    messageHandler.send(MessageCode.USER_ADD, requestData, 'db');
    console.log('[UserManagement] 新增用户请求已发送，等待响应...');
  } else {
    // 修改用户
    messageHandler.send(MessageCode.USER_UPDATE, { ...requestData, id: parseInt(formData.value.id) }, 'db');
    console.log('[UserManagement] 修改用户请求已发送，等待响应...');
  }
};

// ========================================
// 组件挂载/卸载时注册/注销消息处理器
// ========================================
onMounted(() => {
  // 注册用户管理消息处理器
  messageHandler.setUserHandlers({
    onUserAddResponse: handleUserAddResponse,
    onUserUpdateResponse: handleUserUpdateResponse,
    onUserDeleteResponse: handleUserDeleteResponse,
    onUserQueryResponse: handleUserQueryResponse
  });
  console.log('[UserManagement] 用户管理消息处理器已注册');
  
  // 初始加载用户列表
  queryUsers();
});

onUnmounted(() => {
  // 注销用户管理消息处理器
  messageHandler.setUserHandlers({});
  console.log('[UserManagement] 用户管理消息处理器已注销');
});
</script>

<style scoped>
/* 弹窗 - 起始点从顶部开始，与禁飞区弹窗高度一致 */
.nofly-panel.panel-template {
  top: 0 !important;
}

/* 标题栏 */
.header-bar {
  background: rgba(6, 71, 117, 0.8);
  height: 40px;
  padding: 0 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-left {
  width: 60px;
}

.back-btn {
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 24px;
  cursor: pointer;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.back-icon {
  font-size: 30px;
}

.header-title {
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  flex: 1;
}

.header-right {
  width: 60px;
}

/* 查询筛选区域 */
.filter-area {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: transparent;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  flex-shrink: 0;
  white-space: nowrap;
}

.filter-input {
  width: 100px;
  height: 28px;
  padding: 0 8px;
  background: rgba(6, 71, 117, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  color: #ffffff;
  font-size: 12px;
}

.filter-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.filter-input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.6);
  background: rgba(6, 71, 117, 1);
}

.filter-buttons {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.filter-btn {
  height: 28px;
  padding: 0 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #ffffff;
  background: url('/backgrounds/按钮2.png') no-repeat center center;
  background-size: 100% 100%;
}

.filter-btn:hover {
  opacity: 0.9;
  transform: scale(1.02);
}

/* 数据表格区域 */
.table-area {
  flex: 1;
  overflow: auto;
  background: transparent;
}

.records-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.records-table thead {
  background: rgba(6, 71, 117, 0.4);
  position: sticky;
  top: 0;
  z-index: 10;
}

.records-table th {
  padding: 10px 8px;
  color: #ffffff;
  font-weight: 600;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.records-table td {
  padding: 10px 8px;
  color: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.records-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.05);
}

.op-btn {
  padding: 4px 6px;
  margin: 0 2px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.op-btn:hover {
  transform: scale(1.2);
}

.edit-btn:hover {
  filter: brightness(1.2);
}

.delete-btn:hover {
  filter: brightness(1.2);
}

.op-btn-disabled {
  padding: 4px 6px;
  margin: 0 2px;
  background: transparent;
  border: none;
  font-size: 14px;
  opacity: 0.3;
  cursor: not-allowed;
}

.input-disabled {
  background-color: #3a5a70 !important;
  color: #999 !important;
  cursor: not-allowed;
}

.toggle-password {
  position: absolute;
  right: 8px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  transition: all 0.2s ease;
  z-index: 20;
}

.toggle-password:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
}

/* 虚拟键盘容器 */
.keyboard-wrapper {
  flex-shrink: 0;
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.25s ease-out;
  position: relative;
  z-index: 10001;
}

.keyboard-wrapper.keyboard-visible {
  max-height: 320px;
  overflow: visible;
}

.keyboard-wrapper :deep(.virtual-keyboard) {
  position: relative;
  z-index: 10001;
}

/* 新增/编辑表单 - 与黑白名单新增样式一致 */
.add-form {
  display: flex;
  flex-direction: column;
  padding: 10px;
}

.form-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 8px;
  width: 100%;
  box-sizing: border-box;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-label {
  color: #ffffff;
  font-size: 12px;
  white-space: nowrap;
  flex-shrink: 0;
  padding-right: 4px;
  line-height: 28px;
}

.form-input-wrapper {
  flex: 1;
  min-width: 0;
  position: relative;
}

.form-input,
.form-select {
  width: 100%;
  min-width: 0;
  height: 28px;
  background: rgba(6, 71, 117, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  padding: 4px 6px;
  color: #ffffff;
  font-size: 12px;
  outline: none;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus {
  border-color: rgba(255, 255, 255, 0.6);
  background: rgba(6, 71, 117, 1);
}

.form-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.form-select {
  cursor: pointer;
}

.form-value {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  line-height: 28px;
}

/* 按钮区域 - 与黑白名单新增样式一致 */
.form-buttons {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  height: 32px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #ffffff;
  background: url('/backgrounds/按钮2.png') no-repeat center center;
  background-size: 100% 100%;
}

.btn-cancel:hover,
.btn-confirm:hover {
  opacity: 0.9;
  transform: scale(1.02);
}

/* 过渡动画 - 从右至左滑动 */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
