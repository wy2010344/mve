# Canvas 渲染系统

MVE Canvas 是一套轻量级的 Canvas 渲染系统，结合信号系统实现响应式 2D 图形渲染。

## 快速开始

```typescript
import { renderCanvas, hookDrawRect, hookFill } from 'mve-dom-helper/canvasRender'

export default function CanvasDemo() {
  const canvas = document.createElement('canvas')
  canvas.width = 400
  canvas.height = 300
  
  renderCanvas(canvas, ({ canvas }) => {
    hookDrawRect({
      x: 50,
      y: 50,
      width: 100,
      height: 80,
      withPath: true,
      draw({ path }) {
        path.rect(0, 0, 100, 80)
        hookFill('#3498db')
      }
    })
  })
}
```

## 核心概念

### 节点类型
- **hookDraw**: 基础绘制节点，提供坐标和事件
- **hookDrawRect**: 矩形节点，支持布局系统
- **hookDrawText**: 基于hookDrawRect,在单行文本节点,由文本内容撑起宽高.
- **hookDrawTextWrap**: 基于hookDrawRect,自动换行文本节点,基于提供的宽度自动换行,撑起高度.
- **hookDrawImage**: 基于hookDrawRect,图片节点,由图片尺寸与比例撑起宽度和高度
- **hookDrawUrlImage**: 基于hookDrawImage,图片来源于url

### 绘制模式
- `withPath: false`或默认不填写: 不提供鼠标、touch事件.
- `withPath: true`: 支持事件检测,基于提供的Path2D,需要在Path2D里添加具体的路径.

## 文档导航

- [基础 API](./basic-api) - 核心渲染函数和节点类型
- [响应式数据](./responsive-data) - 信号驱动的数据模型设计
- [交互模式](./interactive-patterns) - 拖拽、选择、连接等交互模式
- [文本渲染](./text-rendering) - 文本绘制和测量
- [绘制工具](./drawing-tools) - 填充、描边、裁剪等工具
- [布局系统](./layout-system) - 响应式布局
- [事件处理](./event-handling) - 交互事件处理
- [性能优化](./performance) - 优化技巧
- [完整示例](./examples) - 实际应用示例