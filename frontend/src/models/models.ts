/**
 * 公共数据结构定义
 * 集中管理项目中所有业务相关的数据结构定义
 */

// ==================== 消息码定义 ====================

/**
 * 消息码枚举
 */
export enum MessageCode {
  // 心跳
  HEARTBEAT_PING = 'ping',
  HEARTBEAT_PONG = 'pong',
  
  // 设备状态上报
  DEVICE_STATUS_REPORT = '04007',
  
  // 侦测目标上报
  DETECT_TARGET_REPORT = '05001',
  
  // 定位目标上报
  LOCATION_TARGET_REPORT = '05002',
  
  // 黑白名单操作
  BLACK_WHITE_LIST_ADD = 'DB102',           // 添加黑白名单
  BLACK_WHITE_LIST_ADD_RESPONSE = 'DB002',  // 添加黑白名单响应
  BLACK_WHITE_LIST_UPDATE = 'DB103',         // 修改黑白名单
  BLACK_WHITE_LIST_UPDATE_RESPONSE = 'DB003', // 修改黑白名单响应
  BLACK_WHITE_LIST_DELETE = 'DB104',         // 删除黑白名单
  BLACK_WHITE_LIST_DELETE_RESPONSE = 'DB004', // 删除黑白名单响应
  BLACK_WHITE_LIST_QUERY = 'DB105',          // 查询黑白名单
  BLACK_WHITE_LIST_QUERY_RESPONSE = 'DB005',  // 查询黑白名单响应
  
  // 用户管理操作
  USER_ADD = 'DB106',                        // 新增用户
  USER_ADD_RESPONSE = 'DB006',              // 新增用户响应
  USER_UPDATE = 'DB107',                     // 修改用户
  USER_UPDATE_RESPONSE = 'DB007',           // 修改用户响应
  USER_DELETE = 'DB108',                     // 删除用户
  USER_DELETE_RESPONSE = 'DB008',           // 删除用户响应
  USER_QUERY = 'DB109',                      // 查询用户
  USER_QUERY_RESPONSE = 'DB009',            // 查询用户响应
}

// ==================== 设备状态相关 ====================

/**
 * 设备状态上报数据结构（消息码：04007）
 */
export interface DeviceStatusReportData {
  /** 设备ID */
  deviceId: string;
  /** 设备名称 */
  sName: string;
  /** 服务在离线状态 1-在线 0-离线 */
  iOnline: number | string;
  /**
   * 设备类型
   * - 5: 无线电侦测
   * - 3: 干扰
   * - 8: 诱骗
   */
  iType: number | string;
  /** 设备子类型 */
  iSubType: number | string;
  /** 设备在离线状态 1-在线 0-离线 */
  iLinkState: number | string;
  /** 设备开关状态 1-打开状态 2-关闭状态 */
  blWorkState: number | string;
}

/**
 * 设备状态枚举
 * - online: 在线（iOnline=1 且 iLinkState=1）
 * - offline: 离线（iOnline=0 且 iLinkState=0）
 * - abnormal: 异常（其他情况）
 */
export type DeviceStatusType = 'online' | 'offline' | 'abnormal';

/**
 * 根据设备状态数据计算设备状态类型
 * @param data 设备状态数据
 * @returns 设备状态类型
 */
export function getDeviceStatusType(data: DeviceStatusReportData): DeviceStatusType {
  // 转换为数字类型进行比较（后端可能传字符串）
  const iOnline = Number(data.iOnline);
  const iLinkState = Number(data.iLinkState);
  
  if (iOnline === 1 && iLinkState === 1) {
    return 'online';
  } else if (iOnline === 0 && iLinkState === 0) {
    return 'offline';
  } else {
    return 'abnormal';
  }
}

// ==================== 侦测目标相关 ====================

/**
 * 侦测目标上报数据结构（消息码：05001）
 */
export interface DetectTargetReportData {
  /** 设备ID */
  deviceId: string;
  /** 目标ID */
  tarid: string;
  /** 频点 */
  iFreq: number | string;
  /** 信号强度 */
  iSignalLevel: number | string;
  /** 时间 */
  sTime: string;
}

// ==================== 定位目标相关 ====================

/**
 * 定位目标上报数据结构（消息码：05002）
 */
export interface LocationTargetReportData {
  /** 设备ID */
  deviceId: string;
  /** 目标ID（SN码） */
  sID: string;
  /** 机型 */
  sAirType: string;
  /** 无人机经度 */
  dbUavLng: number | string;
  /** 无人机纬度 */
  dbUavLat: number | string;
  /** 高度 */
  dbAlt: number | string;
  /** 相对高度 */
  dbHeight: number | string;
  /** 遥控器经度 */
  dbPoliteLng: number | string;
  /** 遥控器纬度 */
  dbPoliteLat: number | string;
  /** 水平速度 */
  iSpeedH: number | string;
  /** 垂直速度 */
  iSpeedV: number | string;
  /** 无人机距离 */
  dbUAVDistance: number | string;
  /** 遥控器距离 */
  dbCtrlDistance: number | string;
  /** 频点 */
  iFreq: number | string;
  /** 目标类型 */
  iTargetType: number | string;
  /** 时间 */
  sTime: string;
  /** 列表类型 */
  iListType: number | string;
}

// ==================== 黑白名单相关 ====================

/**
 * 黑白名单数据类型
 */
export interface BlackWhiteListItem {
  /** 记录ID */
  id: number;
  /** SN码 */
  sn: string;
  /** 型号 */
  model: string;
  /** 厂商 */
  manufacturer: string;
  /** 添加时间 */
  addTime: string;
  /** 生效开始时间 */
  effectiveStartTime: string;
  /** 生效结束时间 */
  effectiveEndTime: string;
}

/**
 * 黑白名单查询条件
 */
export interface BlackWhiteListQuery {
  /** SN码（可选） */
  sn?: string;
  /** 生效开始时间（可选） */
  effectiveStartTime?: string;
  /** 生效结束时间（可选） */
  effectiveEndTime?: string;
  /** 页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
}

/**
 * 黑白名单查询结果
 */
export interface BlackWhiteListQueryResult {
  /** 总记录数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 数据列表 */
  data: BlackWhiteListItem[];
}

/**
 * 黑白名单操作请求基础字段
 */
export interface BlackWhiteListRequestBase {
  /** SN码 */
  sn: string;
  /** 型号 */
  model: string;
  /** 厂商 */
  manufacturer: string;
  /** 生效开始时间 */
  effectiveStartTime: string;
  /** 生效结束时间 */
  effectiveEndTime: string;
}

/**
 * 添加黑白名单请求数据（消息码：DB102）
 */
export interface BlackWhiteListAddRequestData extends BlackWhiteListRequestBase {
  // 无需额外字段，继承自基类
}

/**
 * 修改黑白名单请求数据（消息码：DB103）
 */
export interface BlackWhiteListUpdateRequestData extends BlackWhiteListRequestBase {
  /** 记录ID */
  id: number;
}

/**
 * 删除黑白名单请求数据（消息码：DB104）
 */
export interface BlackWhiteListDeleteRequestData {
  /** 记录ID */
  id: number;
}

/**
 * 查询黑白名单请求数据（消息码：DB105）
 */
export interface BlackWhiteListQueryRequestData extends BlackWhiteListQuery {
  // 继承自 BlackWhiteListQuery
}

/**
 * 黑白名单操作响应基础字段
 */
export interface BlackWhiteListResponseBase {
  /** 是否成功 */
  success: boolean;
  /** 消息 */
  message: string;
  /** 数据 */
  data?: any;
}

/**
 * 添加黑白名单响应数据（消息码：DB002）
 */
export interface BlackWhiteListAddResponseData extends BlackWhiteListResponseBase {
  data?: BlackWhiteListItem;
}

/**
 * 修改黑白名单响应数据（消息码：DB003）
 */
export interface BlackWhiteListUpdateResponseData extends BlackWhiteListResponseBase {
  // 无需额外字段
}

/**
 * 删除黑白名单响应数据（消息码：DB004）
 */
export interface BlackWhiteListDeleteResponseData extends BlackWhiteListResponseBase {
  // 无需额外字段
}

/**
 * 查询黑白名单响应数据（消息码：DB005）
 */
export interface BlackWhiteListQueryResponseData extends BlackWhiteListResponseBase {
  /** 总记录数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 数据列表 */
  data: BlackWhiteListItem[];
}

// ==================== 用户管理相关 ====================

/**
 * 用户数据类型
 */
export interface UserItem {
  /** 用户ID */
  id: number;
  /** 用户名 */
  username: string;
  /** 姓名 */
  name: string;
  /** 手机号 */
  phone: string;
  /** 性别 male/female */
  gender: string;
}

/**
 * 用户查询条件
 */
export interface UserQuery {
  /** 用户名（可选） */
  username?: string;
  /** 手机号（可选） */
  phone?: string;
  /** 页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
}

/**
 * 用户操作请求基础字段
 */
export interface UserRequestBase {
  /** 用户名 */
  username: string;
  /** 姓名 */
  name: string;
  /** 密码 */
  password: string;
  /** 手机号 */
  phone: string;
  /** 性别 male/female */
  gender: string;
}

/**
 * 新增用户请求数据（消息码：DB106）
 */
export interface UserAddRequestData extends UserRequestBase {
  // 继承自基类
}

/**
 * 修改用户请求数据（消息码：DB107）
 */
export interface UserUpdateRequestData extends UserRequestBase {
  /** 用户ID */
  id: number;
}

/**
 * 删除用户请求数据（消息码：DB108）
 */
export interface UserDeleteRequestData {
  /** 用户ID */
  id: number;
}

/**
 * 查询用户请求数据（消息码：DB109）
 */
export interface UserQueryRequestData extends UserQuery {
  // 继承自 UserQuery
}

/**
 * 用户操作响应基础字段
 */
export interface UserResponseBase {
  /** 是否成功 */
  success: boolean;
  /** 消息 */
  message: string;
  /** 数据 */
  data?: any;
}

/**
 * 新增用户响应数据（消息码：DB006）
 */
export interface UserAddResponseData extends UserResponseBase {
  data?: UserItem;
}

/**
 * 修改用户响应数据（消息码：DB007）
 */
export interface UserUpdateResponseData extends UserResponseBase {
  // 无需额外字段
}

/**
 * 删除用户响应数据（消息码：DB008）
 */
export interface UserDeleteResponseData extends UserResponseBase {
  // 无需额外字段
}

/**
 * 查询用户响应数据（消息码：DB009）
 */
export interface UserQueryResponseData extends UserResponseBase {
  /** 总记录数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 数据列表 */
  data: UserItem[];
}
