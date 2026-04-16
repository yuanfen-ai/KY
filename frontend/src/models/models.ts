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

  // 禁飞区操作
  NO_FLY_ZONE_ADD = 'DB110',                  // 新增禁飞区
  NO_FLY_ZONE_ADD_RESPONSE = 'DB010',       // 新增禁飞区响应
  NO_FLY_ZONE_UPDATE = 'DB111',              // 修改禁飞区
  NO_FLY_ZONE_UPDATE_RESPONSE = 'DB011',    // 修改禁飞区响应
  NO_FLY_ZONE_DELETE = 'DB112',              // 删除禁飞区
  NO_FLY_ZONE_DELETE_RESPONSE = 'DB012',     // 删除禁飞区响应
  NO_FLY_ZONE_QUERY = 'DB113',               // 查询禁飞区
  NO_FLY_ZONE_QUERY_RESPONSE = 'DB013',     // 查询禁飞区响应

  // ========== 通知服务相关 ==========
  ADD_NOFLY_BLACKWHITE_NOTIFY = '00100',     // 添加禁飞区或黑白名单通知

  // ========== 系统配置相关 ==========
  SYSTEM_CONFIG_QUERY = 'DB114',             // 查询系统配置
  SYSTEM_CONFIG_QUERY_RESPONSE = 'DB014',    // 查询系统配置响应
  SYSTEM_CONFIG_UPDATE = 'DB115',            // 修改系统配置
  SYSTEM_CONFIG_UPDATE_RESPONSE = 'DB015',   // 修改系统配置响应

  // ========== 设备信息查询相关 ==========
  DEVICE_INFO_QUERY = 'DB125',               // 设备信息查询（侦测5/干扰3/诱骗8）
  DEVICE_INFO_QUERY_RESPONSE = 'DB025',      // 设备信息查询响应

  // ========== 操作指令相关 ==========
  RADIO_DIRECTION_SWITCH = '05101',           // 无线电开/关测向
  INTERFERENCE_SWITCH = '03101',             // 开/关干扰
  DECOY_SWITCH = '08101',                    // 开/关诱骗
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

// ==================== 禁飞区相关 ====================

/**
 * 禁飞区数据
 */
export interface NoFlyZoneItem {
  /** 禁飞区ID */
  id: number;
  /** 禁飞区名称 */
  name: string;
  /** 经度 */
  lng: number;
  /** 纬度 */
  lat: number;
}

/**
 * 新增禁飞区请求数据（消息码：DB110）
 */
export interface NoFlyZoneAddRequestData {
  /** 禁飞区名称 */
  name: string;
  /** 经度 */
  lng: number;
  /** 纬度 */
  lat: number;
}

/**
 * 修改禁飞区请求数据（消息码：DB111）
 */
export interface NoFlyZoneUpdateRequestData extends NoFlyZoneAddRequestData {
  /** 禁飞区ID */
  id: number;
}

/**
 * 删除禁飞区请求数据（消息码：DB112）
 */
export interface NoFlyZoneDeleteRequestData {
  /** 禁飞区ID */
  id: number;
}

/**
 * 查询禁飞区请求数据（消息码：DB113）
 */
export interface NoFlyZoneQueryRequestData {
  // 无需参数
}

/**
 * 禁飞区操作响应基础字段
 */
export interface NoFlyZoneResponseBase {
  /** 是否成功 */
  success: boolean;
  /** 消息 */
  message: string;
  /** 数据 */
  data?: any;
}

/**
 * 新增禁飞区响应数据（消息码：DB010）
 */
export interface NoFlyZoneAddResponseData extends NoFlyZoneResponseBase {
  data?: NoFlyZoneItem;
}

/**
 * 修改禁飞区响应数据（消息码：DB011）
 */
export interface NoFlyZoneUpdateResponseData extends NoFlyZoneResponseBase {
  // 无需额外字段
}

/**
 * 删除禁飞区响应数据（消息码：DB012）
 */
export interface NoFlyZoneDeleteResponseData extends NoFlyZoneResponseBase {
  // 无需额外字段
}

/**
 * 查询禁飞区响应数据（消息码：DB013）
 */
export interface NoFlyZoneQueryResponseData extends NoFlyZoneResponseBase {
  /** 数据列表 */
  data: NoFlyZoneItem[];
}

/**
 * 添加禁飞区或黑白名单通知数据（消息码：00100）
 */
export interface AddNoflyBlackwhiteNotifyData {
  /** 更新类型：1-黑白名单 2-禁飞区 */
  iUpdateType: number;
}

// ==================== 系统配置相关 ====================

/**
 * 系统配置数据
 */
export interface SystemConfigData {
  /** 设备IP */
  deviceIp: string;
  /** 设备端口 */
  devicePort: number;
  /** 平台IP */
  platformIp: string;
  /** 平台端口 */
  platformPort: number;
  /** 是否定位 */
  isPositioning: boolean;
  /** 是否地图离线 */
  isMapOffline: boolean;
}

/**
 * 查询系统配置响应数据（消息码：DB014）
 */
export interface SystemConfigQueryResponseData {
  /** 设备IP */
  deviceIp: string;
  /** 设备端口 */
  devicePort: number;
  /** 平台IP */
  platformIp: string;
  /** 平台端口 */
  platformPort: number;
  /** 是否定位 */
  isPositioning: boolean;
  /** 是否地图离线 */
  isMapOffline: boolean;
}

/**
 * 修改系统配置响应数据（消息码：DB015）
 */
export interface SystemConfigUpdateResponseData {
  /** 是否成功 */
  success: boolean;
  /** 响应消息 */
  message: string;
  /** 数据 */
  data: any;
}

// ==================== 设备信息查询相关 ====================

/** 设备类型枚举 */
export enum DeviceType {
  /** 干扰 */
  JAM = 3,
  /** 侦测 */
  DETECT = 5,
  /** 诱骗 */
  DECOY = 8,
}

/**
 * 设备信息项（消息码：DB025 data数组中的元素）
 */
export interface DeviceInfoItem {
  /** 设备ID */
  dev_id: string;
  /** 设备名称 */
  name: string;
  /** 设备类型：3-干扰 5-侦测 8-诱骗 */
  dev_type: number;
  /** 经度 */
  Lng: number;
  /** 纬度 */
  Lat: number;
  /** 工作距离 */
  WorkDistance: number;
  /** 设备子类型（侦测设备） */
  type?: number;
  /** 服务端IP（侦测设备） */
  serverip?: string;
  /** 服务端端口（侦测设备） */
  serverport?: number;
  /** 开启时间（干扰设备） */
  open_time?: number;
  /** 频段信息JSON字符串（干扰设备），解析后为 BandConfig 结构 */
  bandstr?: string;
  /** 卫星信号信息JSON字符串（诱骗设备），解析后为 DecoySignalConfig 结构 */
  singalstr?: string;
  /** 方向欺骗信息JSON字符串（诱骗设备），解析后为 DecoyDirectionConfig 结构 */
  directionstr?: string;
}

/**
 * 频段项（干扰设备 bandstr 解析后的数组元素）
 */
export interface BandItem {
  /** 频段名称，如 "L频段"、"S频段"、"C频段" */
  BandName: string;
  /** 频段类型：0-L频段 1-S频段 2-C频段 */
  BandType: number;
  /** 引脚列表 */
  nstPins: number[];
  /** 类型列表 */
  nstTypes: number[];
}

/**
 * 频段配置（干扰设备 bandstr 解析后的结构）
 */
export interface BandConfig {
  /** 频段列表 */
  nstBand: BandItem[];
}

/**
 * 设备信息查询请求数据（消息码：DB125）
 */
export interface DeviceInfoQueryData {
  /** 设备类型：5-侦测 3-干扰 8-诱骗 */
  dev_type: DeviceType;
}

/**
 * 设备信息查询响应数据（消息码：DB025）
 */
export interface DeviceInfoQueryResponseData {
  /** 是否成功 */
  success: boolean;
  /** 响应消息 */
  message: string;
  /** 设备信息列表 */
  data: DeviceInfoItem[];
}

// ==================== 操作指令相关 ====================

/**
 * 干扰频段开关项（开/关干扰 03101 中 nstAllBand 数组元素）
 */
export interface InterferenceBandSwitch {
  /** 频段类型 */
  iType: number;
  /** 开关状态：true-开 false-关 */
  blSwitch: boolean;
}

/**
 * 无线电开/关测向数据（消息码：05101）
 */
export interface RadioDirectionSwitchData {
  /** 设备ID */
  deviceId: string;
  /** 目标ID */
  tarid: string;
  /** 开关状态：true-开 false-关 */
  blSwitch: boolean;
}

/**
 * 开/关干扰数据（消息码：03101）
 */
export interface InterferenceSwitchData {
  /** 设备ID */
  deviceId: string;
  /** 干扰开关：true-开 false-关 */
  blSwitch: boolean;
  /** 频段开关列表 */
  nstAllBand: InterferenceBandSwitch[];
}

// ==================== 诱骗设备相关 ====================

/**
 * 诱骗卫星信号项（诱骗设备 singalstr 解析后的数组元素）
 */
export interface DecoySignalItem {
  /** 卫星类型：1-GPS 2-BDS 3-GLO 4-GALILEO */
  gnss_type: number;
  /** 卫星名称，如 "GPS"、"BDS"、"GLO"、"GALILEO" */
  signal_name: string;
}

/**
 * 卫星信号配置（诱骗设备 singalstr 解析后的结构）
 */
export interface DecoySignalConfig {
  /** 卫星信号列表 */
  signals: DecoySignalItem[];
}

/**
 * 诱骗方向项（诱骗设备 directionstr 解析后的数组元素）
 */
export interface DecoyDirectionItem {
  /** 方向度数，如 "0"、"180"、"90" */
  direction_deg: string;
  /** 方向名称，如 "正北驱离"、"正南驱离" */
  direction_name: string;
}

/**
 * 方向欺骗配置（诱骗设备 directionstr 解析后的结构）
 */
export interface DecoyDirectionConfig {
  /** 方向列表 */
  directions: DecoyDirectionItem[];
}

/**
 * 诱骗卫星开关项（开/关诱骗 08101 中 nstAllBand 数组元素）
 */
export interface DecoyBandSwitch {
  /** 卫星类型：1-GPS 2-BDS 3-GLO 4-GALILEO */
  iType: number;
  /** 开关状态：true-开 false-关 */
  blSwitch: boolean;
}

/**
 * 开/关诱骗数据（消息码：08101）
 */
export interface DecoySwitchData {
  /** 设备ID */
  deviceId: string;
  /** 诱骗开关：true-开 false-关 */
  blSwitch: boolean;
  /** 诱骗模式：1-禁飞区迫降 2-方向欺骗 */
  model: number;
  /** 禁飞区ID（mode=1时）或方向度数（mode=2时） */
  params: string;
  /** 卫星开关列表 */
  nstAllBand: DecoyBandSwitch[];
}
