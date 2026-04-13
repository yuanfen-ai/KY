/**
 * 公共数据结构定义
 * 集中管理项目中所有业务相关的数据结构定义
 */

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
