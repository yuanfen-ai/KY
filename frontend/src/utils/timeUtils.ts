/**
 * 格式化时间为本地显示格式 (yyyy.MM.dd HH:mm:ss)
 * 支持ISO 8601格式(含T和Z)和常规格式(yyyy-MM-dd HH:mm:ss)
 * 自动将UTC时间转换为本地时区显示
 */
/**
 * 格式化经纬度，小数位超过6位时截取前6位
 */
export function formatCoordinate(value: number | string): string {
  if (value === undefined || value === null || value === '') return '';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);
  // 保留最多6位小数，去除末尾多余的0
  return parseFloat(num.toFixed(6)).toString();
}

export function formatDisplayTime(timeStr: string): string {
  if (!timeStr) return '';
  try {
    // ISO 8601格式（含T和Z）直接解析，其他格式替换-为/兼容
    const date = timeStr.includes('T') ? new Date(timeStr) : new Date(timeStr.replace(/-/g, '/'));
    if (isNaN(date.getTime())) {
      // 解析失败，返回原始字符串的简单替换
      return timeStr.replace(/-/g, '.').replace(/T/, ' ').replace(/\.000Z/, '');
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`;
  } catch {
    return timeStr.replace(/-/g, '.').replace(/T/, ' ').replace(/\.000Z/, '');
  }
}
