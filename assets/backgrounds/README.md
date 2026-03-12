# 背景图资源文件夹

本文件夹用于存放前端界面的背景图资源（如按钮背景、面板背景、装饰背景等）。

## 文件夹结构

```
assets/
├── backgrounds/          # 背景图资源（本文件夹）
│   ├── *.png           # PNG格式背景图
│   ├── *.jpg           # JPG格式背景图
│   ├── *.svg           # SVG格式背景图
│   └── ...
├── 1.png               # 其他图片资源
└── ...
```

## 使用说明

### 1. 命名规范

**推荐命名格式**：
```
[用途]_[类型]_[状态].png

示例：
btn_gold_active.png           # 按钮-金色-激活状态
btn_default.png               # 按钮-默认状态
panel_header_blue.png         # 面板-头部-蓝色
bg_gradient_gold.png          # 背景-渐变-金色
```

**命名规则**：
- 使用小写字母和下划线
- 描述用途（btn/panel/bg等）
- 包含类型和状态信息
- 避免使用中文和特殊字符

### 2. 推荐格式

| 格式 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| PNG | 支持透明背景、无损压缩 | 文件较大 | 按钮背景、不规则形状 |
| JPG | 文件小、兼容性好 | 不支持透明 | 矩形背景、大面积色彩 |
| SVG | 矢量、无限缩放、文件小 | 复杂图形渲染慢 | 简单图案、渐变 |
| WebP | 压缩率高、支持透明 | 兼容性问题（旧浏览器） | 现代浏览器项目 |

### 3. 尺寸建议

| 用途 | 推荐尺寸 | 说明 |
|------|---------|------|
| 小按钮背景 | 32x16, 48x24 | 小型按钮 |
| 中等按钮背景 | 64x32, 80x40 | 常用按钮 |
| 大按钮背景 | 128x64, 160x80 | 主要操作按钮 |
| 面板头部背景 | 320x48, 480x64 | 面板标题栏 |
| 全屏背景 | 1920x1080, 2560x1440 | 全屏装饰 |

### 4. 引用方式

**在Vue组件中引用**：
```vue
<template>
  <div>
    <!-- CSS类名方式（推荐） -->
    <button class="btn-gold-active">按钮</button>

    <!-- 内联样式方式 -->
    <div :style="{ backgroundImage: 'url(/assets/backgrounds/btn_gold_active.png)' }">
      内容
    </div>
  </div>
</template>

<style scoped>
.btn-gold-active {
  width: 100px;
  height: 40px;
  background-image: url('/assets/backgrounds/btn_gold_active.png');
  background-size: 100% 100%;
  background-repeat: no-repeat;
}
</style>
```

### 5. 性能优化

**优化建议**：
- 使用合适的图片格式（优先PNG支持透明）
- 压缩图片文件（推荐 TinyPNG 在线工具）
- 使用 CSS `background-size` 控制显示尺寸
- 考虑使用 CSS 渐变替代简单背景图
- 使用图片懒加载（大尺寸背景图）

## 注意事项

1. **版权合法性**：确保使用无版权问题或已获得授权的图片
2. **文件大小**：背景图尽量控制在 100KB 以内，避免影响加载性能
3. **透明背景**：使用 PNG 格式支持透明背景，适应不同底色
4. **版本管理**：不同状态的背景图应分别存储（如激活/默认/禁用）
5. **兼容性**：考虑老旧浏览器的兼容性（如不支持 WebP 时提供 PNG 备用）

## 文件夹组织建议

如果未来项目背景图较多，可以进一步分类：

```
backgrounds/
├── buttons/          # 按钮背景
├── panels/           # 面板背景
├── headers/          # 头部背景
├── decorations/      # 装饰背景
└── README.md         # 本说明文档
```

## 快速开始

1. 将背景图放入 `backgrounds/` 文件夹
2. 按照命名规范重命名文件
3. 在Vue组件中引用
4. 使用CSS调整显示效果

## 示例

当前文件夹已包含：
- `按钮8 拷贝 4.png` - 金色金属质感按钮背景（可作为 `btn_gold_active.png`）

**使用示例**：
```css
.filter-btn.active {
  background-image: url('/assets/backgrounds/btn_gold_active.png');
  background-size: 100% 100%;
  background-repeat: no-repeat;
}
```
