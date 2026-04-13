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
            <th>序号</th>
            <th>账号</th>
            <th>姓名</th>
            <th>电话</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in paginatedRecords" :key="record.id">
            <td>{{ record.id }}</td>
            <td>{{ record.account }}</td>
            <td>{{ record.name }}</td>
            <td>{{ record.phone }}</td>
            <td>{{ record.createTime }}</td>
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
            <span class="form-label">创建时间:</span>
            <div class="form-input-wrapper">
              <span class="form-value">{{ formData.createTime }}</span>
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
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import PageTemplate from '@/components/PageTemplate.vue';
import PanelTemplate from '@/components/PanelTemplate.vue';
import Pagination from '@/components/Pagination.vue';
import VirtualKeyboard from '@/components/VirtualKeyboard.vue';
import { PAGINATION_CONFIG } from '@/config/index';

const router = useRouter();

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

// 模拟数据 - 用户列表
const allRecords = ref([
  { id: 1, account: 'admin', name: '系统管理员', phone: '13800138000', role: '管理员', createTime: '2026-01-01 10:00:00' },
  { id: 2, account: 'operator1', name: '操作员一', phone: '13900139001', role: '操作员', createTime: '2026-01-15 09:30:00' },
  { id: 3, account: 'operator2', name: '操作员二', phone: '13900139002', role: '操作员', createTime: '2026-02-01 14:20:00' },
  { id: 4, account: 'visitor1', name: '访客张三', phone: '13700137001', role: '访客', createTime: '2026-02-10 11:00:00' },
  { id: 5, account: 'maintain', name: '维护人员', phone: '13600136000', role: '操作员', createTime: '2026-02-15 16:45:00' },
  { id: 6, account: 'monitor1', name: '监控员一', phone: '13500135001', role: '操作员', createTime: '2026-02-20 08:00:00' },
  { id: 7, account: 'monitor2', name: '监控员二', phone: '13500135002', role: '操作员', createTime: '2026-02-25 10:30:00' },
  { id: 8, account: 'test001', name: '测试账号', phone: '13400134001', role: '访客', createTime: '2026-03-01 09:00:00' },
  { id: 9, account: 'operator3', name: '操作员三', phone: '13900139003', role: '操作员', createTime: '2026-03-05 13:15:00' },
  { id: 10, account: 'operator4', name: '操作员四', phone: '13900139004', role: '操作员', createTime: '2026-03-08 15:30:00' },
  { id: 11, account: 'supervisor', name: '监督员', phone: '13800138001', role: '管理员', createTime: '2026-03-09 08:30:00' },
  { id: 12, account: 'guest001', name: '临时访客', phone: '13700137002', role: '访客', createTime: '2026-03-09 10:00:00' }
]);

// 分页相关数据
const currentPage = ref(1);
const pageSize = ref(PAGINATION_CONFIG.PAGE_SIZE);

// 计算总数据条数
const totalRecords = computed(() => allRecords.value.length);

// 计算当前页显示的数据
const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return allRecords.value.slice(start, end);
});

// 分页变化处理
const handlePageChange = (page: number) => {
  console.log('[UserManagement] 页码变化:', page);
};

// 查询处理
const handleQuery = () => {
  console.log('[UserManagement] 查询:', filters.value);
  currentPage.value = 1;
  ElMessage.success('查询成功');
};

// 删除处理
const handleDelete = (id: number) => {
  const index = allRecords.value.findIndex(r => r.id === id);
  if (index !== -1) {
    allRecords.value.splice(index, 1);
    ElMessage.success('删除成功');
  }
};

// 弹窗相关
const showDialog = ref(false);
const dialogMode = ref<'add' | 'edit'>('add');

const getCurrentDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

const formData = ref({
  id: 0,
  account: '',
  name: '',
  phone: '',
  password: '',
  createTime: getCurrentDateTime()
});

const openAddDialog = () => {
  dialogMode.value = 'add';
  formData.value = {
    id: 0,
    account: '',
    name: '',
    phone: '',
    password: '',
    createTime: getCurrentDateTime()
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
    password: '',
    createTime: record.createTime
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

  if (dialogMode.value === 'add') {
    const newId = Math.max(...allRecords.value.map(r => r.id), 0) + 1;
    allRecords.value.push({
      id: newId,
      account: formData.value.account,
      name: formData.value.name,
      phone: formData.value.phone,
      createTime: formData.value.createTime
    });
    ElMessage.success('新增成功');
  } else {
    const index = allRecords.value.findIndex(r => r.id === formData.value.id);
    if (index !== -1) {
      allRecords.value[index] = {
        ...allRecords.value[index],
        account: formData.value.account,
        name: formData.value.name,
        phone: formData.value.phone
      };
    }
    ElMessage.success('编辑成功');
  }
  closeDialog();
};
</script>

<style scoped>
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
