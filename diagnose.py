#!/usr/bin/env python3
"""
KY 项目环境检查脚本
用于诊断 "argument of type 'NoneType' is not iterable" 错误
"""

import sys
import os
import subprocess
import json

def print_section(title):
    """打印分节标题"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def check_python():
    """检查Python环境"""
    print_section("Python 环境检查")
    print(f"Python 版本: {sys.version}")
    print(f"Python 路径: {sys.executable}")
    
    # 检查关键模块
    modules = ['json', 'os', 'subprocess', 'typing']
    for module in modules:
        try:
            __import__(module)
            print(f"✓ {module}: 已安装")
        except ImportError:
            print(f"✗ {module}: 未安装")

def check_node():
    """检查Node.js环境"""
    print_section("Node.js 环境检查")
    
    commands = [
        ('node', '--version'),
        ('npm', '--version'),
        ('pnpm', '--version')
    ]
    
    for cmd, arg in commands:
        try:
            result = subprocess.run([cmd, arg], capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                print(f"✓ {cmd}: {result.stdout.strip()}")
            else:
                print(f"✗ {cmd}: 未安装或无法执行")
        except FileNotFoundError:
            print(f"✗ {cmd}: 未安装")
        except subprocess.TimeoutExpired:
            print(f"✗ {cmd}: 执行超时")

def check_docker():
    """检查Docker环境"""
    print_section("Docker 环境检查")
    
    try:
        result = subprocess.run(['docker', '--version'], capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            print(f"✓ Docker: {result.stdout.strip()}")
            
            # 检查Docker Compose
            result = subprocess.run(['docker-compose', '--version'], capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                print(f"✓ Docker Compose: {result.stdout.strip()}")
            else:
                print(f"✗ Docker Compose: 未安装")
        else:
            print(f"✗ Docker: 未安装")
    except FileNotFoundError:
        print(f"✗ Docker: 未安装")
    except subprocess.TimeoutExpired:
        print(f"✗ Docker: 执行超时")

def check_ports():
    """检查端口占用"""
    print_section("端口占用检查")
    
    ports = {
        3000: "前端",
        5000: "后端WebSocket",
        3306: "MySQL",
        6379: "Redis",
        9000: "系统服务"
    }
    
    for port, service in ports.items():
        try:
            # 使用ss命令检查端口
            result = subprocess.run(['ss', '-tuln'], capture_output=True, text=True, timeout=5)
            if f":{port}" in result.stdout:
                print(f"✓ 端口 {port} ({service}): 被占用")
            else:
                print(f"○ 端口 {port} ({service}): 空闲")
        except:
            print(f"? 端口 {port} ({service}): 无法检查")

def check_config_files():
    """检查配置文件"""
    print_section("配置文件检查")
    
    config_files = [
        ('proxy-server/.env', '后端环境变量'),
        ('frontend/.env', '前端环境变量'),
        ('proxy-server/package.json', '后端依赖'),
        ('frontend/package.json', '前端依赖'),
    ]
    
    for filepath, description in config_files:
        if os.path.exists(filepath):
            print(f"✓ {description}: {filepath}")
            
            # 检查是否为空
            if os.path.getsize(filepath) > 0:
                print(f"  - 文件大小: {os.path.getsize(filepath)} bytes")
            else:
                print(f"  ⚠ 警告: 文件为空")
        else:
            print(f"✗ {description}: {filepath} 不存在")

def check_env_variables():
    """检查环境变量中是否有None值"""
    print_section("环境变量检查（检测None值问题）")
    
    env_file = 'proxy-server/.env'
    if os.path.exists(env_file):
        with open(env_file, 'r') as f:
            lines = f.readlines()
            
        empty_vars = []
        for line in lines:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                if not value.strip():
                    empty_vars.append(key)
        
        if empty_vars:
            print("⚠ 发现空的环境变量（可能导致None错误）:")
            for var in empty_vars:
                print(f"  - {var}")
        else:
            print("✓ 所有环境变量都有值")
    else:
        print(f"✗ {env_file} 不存在")

def check_project_structure():
    """检查项目结构"""
    print_section("项目结构检查")
    
    required_dirs = [
        'frontend/src',
        'proxy-server/src',
        'docs',
        'database',
        'logs'
    ]
    
    for dirpath in required_dirs:
        if os.path.isdir(dirpath):
            print(f"✓ 目录存在: {dirpath}")
        else:
            print(f"✗ 目录不存在: {dirpath}")

def test_none_iteration():
    """测试None迭代错误"""
    print_section("None迭代错误测试")
    
    # 测试常见的None迭代场景
    test_cases = [
        ("None in list", lambda: None in [1, 2, 3]),
        ("for loop with None", lambda: exec("for x in None: pass")),
        ("list(None)", lambda: list(None)),
    ]
    
    for name, test_func in test_cases:
        try:
            test_func()
            print(f"✓ {name}: 无错误")
        except TypeError as e:
            print(f"✗ {name}: {e}")

def main():
    """主函数"""
    print("\n" + "="*60)
    print("  KY 项目环境诊断工具")
    print("  用于排查 'NoneType' 错误")
    print("="*60)
    
    try:
        check_python()
        check_node()
        check_docker()
        check_ports()
        check_config_files()
        check_env_variables()
        check_project_structure()
        test_none_iteration()
        
        print_section("诊断完成")
        print("如果发现问题，请参考:")
        print("  - docs/05-启动问题排查.md")
        print("  - QUICKSTART.md")
        print("\n")
        
    except KeyboardInterrupt:
        print("\n\n诊断已取消")
        sys.exit(1)
    except Exception as e:
        print(f"\n诊断过程中发生错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
