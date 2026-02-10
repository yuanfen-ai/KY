-- KY 项目数据库初始化脚本
-- 创建时间: 2024

-- 创建数据库
CREATE DATABASE IF NOT EXISTS ky_project CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ky_project;

-- 设备信息表
CREATE TABLE IF NOT EXISTS devices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  device_id VARCHAR(64) UNIQUE NOT NULL COMMENT '设备唯一标识',
  device_name VARCHAR(128) NOT NULL COMMENT '设备名称',
  device_type VARCHAR(32) NOT NULL COMMENT '设备类型',
  tcp_host VARCHAR(64) NOT NULL COMMENT '设备TCP地址',
  tcp_port INT NOT NULL COMMENT '设备TCP端口',
  status ENUM('online', 'offline', 'error') DEFAULT 'offline' COMMENT '设备状态',
  last_heartbeat DATETIME COMMENT '最后心跳时间',
  metadata JSON COMMENT '设备元数据',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_device_id (device_id),
  INDEX idx_status (status),
  INDEX idx_device_type (device_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='设备信息表';

-- 指令记录表
CREATE TABLE IF NOT EXISTS command_records (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  session_id VARCHAR(64) NOT NULL COMMENT '前端会话ID',
  device_id VARCHAR(64) NOT NULL COMMENT '设备ID',
  command_type VARCHAR(32) NOT NULL COMMENT '指令类型',
  command_payload JSON COMMENT '指令内容',
  status ENUM('pending', 'sent', 'success', 'failed', 'timeout') DEFAULT 'pending' COMMENT '指令状态',
  response JSON COMMENT '设备响应',
  error_message VARCHAR(512) COMMENT '错误信息',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_session_id (session_id),
  INDEX idx_device_id (device_id),
  INDEX idx_created_at (created_at),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='指令记录表';

-- 设备数据表
CREATE TABLE IF NOT EXISTS device_data (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  device_id VARCHAR(64) NOT NULL COMMENT '设备ID',
  data_type VARCHAR(32) NOT NULL COMMENT '数据类型',
  data_value JSON NOT NULL COMMENT '数据内容',
  received_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '接收时间',
  INDEX idx_device_id (device_id),
  INDEX idx_received_at (received_at),
  INDEX idx_data_type (data_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='设备数据表';

-- 告警记录表
CREATE TABLE IF NOT EXISTS alerts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  device_id VARCHAR(64) NOT NULL COMMENT '设备ID',
  alert_type VARCHAR(32) NOT NULL COMMENT '告警类型',
  alert_level ENUM('info', 'warning', 'error', 'critical') NOT NULL COMMENT '告警级别',
  message TEXT NOT NULL COMMENT '告警内容',
  metadata JSON COMMENT '额外信息',
  resolved BOOLEAN DEFAULT FALSE COMMENT '是否已解决',
  resolved_at DATETIME COMMENT '解决时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_device_id (device_id),
  INDEX idx_created_at (created_at),
  INDEX idx_resolved (resolved),
  INDEX idx_alert_level (alert_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='告警记录表';

-- 会话表
CREATE TABLE IF NOT EXISTS sessions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  session_id VARCHAR(64) UNIQUE NOT NULL COMMENT '会话ID',
  user_id VARCHAR(64) COMMENT '用户ID',
  connected_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '连接时间',
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后活动时间',
  ip_address VARCHAR(45) COMMENT 'IP地址',
  status ENUM('active', 'disconnected') DEFAULT 'active' COMMENT '会话状态',
  INDEX idx_session_id (session_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='会话表';

-- 插入测试设备
INSERT INTO devices (device_id, device_name, device_type, tcp_host, tcp_port, status, metadata) VALUES
('DEV-001', '温度传感器-1', 'sensor', '192.168.1.101', 8080, 'offline', '{"location": "Factory A", "version": "1.0.0"}'),
('DEV-002', '温度传感器-2', 'sensor', '192.168.1.102', 8080, 'offline', '{"location": "Factory A", "version": "1.0.0"}'),
('DEV-003', '控制器-1', 'controller', '192.168.1.103', 8080, 'offline', '{"location": "Factory B", "version": "1.1.0"}')
ON DUPLICATE KEY UPDATE device_name=device_name;
