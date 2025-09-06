# Canvas 渲染系统

MVE 提供了一套完整的 Canvas 渲染系统，支持高性能的 2D 图形渲染和交互
canvas 与信号的结合,基于 canvas 的组件系统,更底层地结合信号与绘制,避免 dom 原生组件的 api 限制.

## 快速开始

```typescript
import {
  renderCanvas,
  hookDraw,
  hookDrawRect,
  hookDrawText,
  hookDrawImage,
  hookFill,
  simpleFlex,
} from 'mve-dom-helper/canvasRender'

export default function CanvasDemo() {
  renderCanvas(
    {
      width: 800,
      height: 600,
      className: 'border',
    },
    () => {
      // 在这里使用各种 hook 绘制内容
      hookDrawRect({
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        draw(ctx, n, path) {
          hookFill('#ff6b6b')
        },
      })
    }
  )
}
```

## 核心概念

### 渲染层次结构

Canvas 渲染系统采用层次化的节点结构：

- **hookDraw**: 最基础的绘制节点，只提供位置偏移
- **hookDrawRect**: 在 hookDraw 基础上增加布局和尺寸管理
- **hookDrawText**: 专门用于文本渲染的矩形节点
- **hookDrawImage**: 专门用于图片渲染的矩形节点

### 坐标系统

- 每个节点都有相对于父节点的 `x`, `y` 坐标
- 子节点的坐标是相对于父节点的
- 支持响应式的坐标计算

## API 参考

### renderCanvas

创建 Canvas 渲染容器。

```typescript
renderCanvas({
  width: ValueOrGet<number>,
  height: ValueOrGet<number>,
  className?: string,
  // 其他 canvas 属性...
}, children: () => void, options?: {
  translateX?: ValueOrGet<number>,
  translateY?: ValueOrGet<number>,
  beforeDraw?(ctx: CanvasRenderingContext2D): void,
  afterDraw?(ctx: CanvasRenderingContext2D): void
})
```

**参数说明**：

- `width`, `height`: Canvas 的宽度和高度，支持响应式
- `children`: 渲染函数，在其中使用各种 hook
- `translateX`, `translateY`: 全局偏移量
- `beforeDraw`, `afterDraw`: 绘制前后的回调

### hookDraw

最基础的绘制节点，不参与布局系统。

```typescript
hookDraw({
  x: ValueOrGet<number>,
  y: ValueOrGet<number>,
  children?(): void,
  draw?(ctx: CanvasRenderingContext2D): void,
  // 事件处理...
})
```

**特点**：

- 只提供位置偏移，不参与布局计算
- 适合绘制简单图形或作为容器
- 支持鼠标事件处理

**示例**：

```typescript
hookDraw({
  x: 50,
  y: 50,
  draw(ctx) {
    ctx.fillStyle = '#4ecdc4'
    ctx.fillRect(0, 0, 100, 100)
  },
  onClick(e) {
    console.log('点击了方块', e.x, e.y)
  },
})
```

### hookDrawRect

带布局系统的矩形节点，是最常用的绘制节点。

```typescript
hookDrawRect({
  // 位置和尺寸
  x?: number | ((n: LayoutNode) => number),
  y?: number | ((n: LayoutNode) => number),
  width?: number | ((n: LayoutNode) => number),
  height?: number | ((n: LayoutNode) => number),

  // 内边距
  paddingLeft?: ValueOrGet<number>,
  paddingRight?: ValueOrGet<number>,
  paddingTop?: ValueOrGet<number>,
  paddingBottom?: ValueOrGet<number>,

  // 布局
  layout?(): LayoutConfig,
  alignSelf?: AlignSelfFun,
  grow?: number,

  // 绘制
  draw?(ctx: CanvasRenderingContext2D, n: LayoutNode, path: Path2D): void,
  skipDraw?(n: LayoutNode): boolean,

  // 子节点
  children?(): void,

  // 事件处理
  onClick?(e: CanvasMouseEvent): void,
  onPointerDown?(e: CanvasMouseEvent): void,
  // ... 其他事件
})
```

**布局系统**：

```typescript
hookDrawRect({
  width: 300,
  height: 200,
  layout() {
    return simpleFlex({
      direction: 'x', // 'x' | 'y'
      alignItems: 'center', // 'start' | 'center' | 'end' | 'stretch'
      directionFix: 'between', // 'start' | 'center' | 'end' | 'between'
      gap: 10,
    })
  },
  children() {
    // 子节点会按照 flex 布局排列
    hookDrawRect({ width: 50, height: 50 })
    hookDrawRect({ width: 50, height: 50 })
    hookDrawRect({ width: 50, height: 50 })
  },
})
```

**响应式尺寸**：

```typescript
const containerWidth = createSignal(400)

hookDrawRect({
  width: () => containerWidth.get(),
  height: (n) => n.axis.x.size() * 0.6, // 高度为宽度的 60%
  draw(ctx, n, path) {
    hookFill('#e74c3c')
  },
})
```

### hookDrawText

专门用于文本渲染的节点。

```typescript
hookDrawText({
  config: ValueOrGet<{
    text: string
    fontSize?: string
    fontFamily?: string
    fontWeight?: string
    fontStyle?: string
    fillStyle?: string
    strokeStyle?: string
    lineWidth?: number
  }>,

  // 尺寸控制
  width: number | Quote<number>,
  height: number | Quote<number>,

  // 绘制信息
  drawInfo: DrawTextOut | ((config) => DrawTextOut),

  // 其他 hookDrawRect 的属性...
})
```

**基础文本**：

```typescript
hookDrawText({
  config: {
    text: 'Hello Canvas!',
    fontSize: '24px',
    fontFamily: 'Arial',
    fillStyle: '#2c3e50',
  },
})
```

**响应式文本**：

```typescript
const message = createSignal('动态文本')

hookDrawText({
  config: () => ({
    text: message.get(),
    fontSize: '18px',
    fillStyle: '#3498db',
  }),
})
```

### hookDrawTextWrap

支持自动换行的文本渲染。

```typescript
hookDrawTextWrap({
  config: ValueOrGet<{
    text: string
    maxLines?: number
    lineHeight?: number
    fontSize?: string
    fontFamily?: string
    // ... 其他文本样式
  }>,

  // 容器宽度（必需，用于计算换行）
  width: number,

  // 其他属性...
})
```

**自动换行示例**：

```typescript
hookDrawTextWrap({
  config: {
    text: '这是一段很长的文本，会自动换行显示在指定的宽度内。',
    maxLines: 3,
    fontSize: '16px',
    lineHeight: 1.5,
  },
  width: 200,
  alignSelf: alignSelf('stretch'),
})
```

### hookDrawImage

图片渲染节点。

```typescript
// 直接使用 HTMLImageElement
hookDrawImage({
  image: HTMLImageElement,
  relay?: 'width' | 'height', // 按比例缩放
  // ... 其他属性
})

// 从 URL 加载图片
hookDrawUrlImage({
  src: ValueOrGet<string>,
  relay?: 'width' | 'height',
  onLoading?(): void,
  onError?(error: any): void,
  // ... 其他属性
})
```

**按比例缩放**：

```typescript
// 固定宽度，高度按比例
hookDrawUrlImage({
  src: 'https://example.com/image.jpg',
  width: 200,
  relay: 'width', // 高度会根据图片比例自动计算
})

// 固定高度，宽度按比例
hookDrawUrlImage({
  src: 'https://example.com/image.jpg',
  height: 150,
  relay: 'height', // 宽度会根据图片比例自动计算
})
```

## 绘制工具函数

### hookFill / hookStroke

用于填充和描边当前路径。

```typescript
// 在 draw 函数中使用
draw(ctx, n, path) {
  // 填充
  hookFill('#ff6b6b')

  // 描边
  hookStroke(2, '#333')
}
```

### hookClip

设置裁剪区域。

```typescript
draw(ctx, n, path) {
  hookClip() // 使用当前路径作为裁剪区域
  // 后续的绘制会被裁剪
}
```

### hookCurrentCtx / hookCurrentPath

获取当前的绘制上下文和路径。

```typescript
draw(ctx, n, path) {
  const currentCtx = hookCurrentCtx()
  const currentPath = hookCurrentPath()

  // 自定义绘制逻辑
  currentCtx.shadowBlur = 10
  currentCtx.shadowColor = '#000'
}
```

## 事件处理

Canvas 节点支持完整的鼠标和触摸事件：

```typescript
hookDrawRect({
  // ... 其他属性

  // 鼠标事件
  onClick(e: CanvasMouseEvent<MouseEvent>) {
    console.log('点击位置:', e.x, e.y)
    console.log('是否在路径内:', e.inPath)
    console.log('原始事件:', e.original)
  },

  onMouseDown(e) {
    /* ... */
  },
  onMouseUp(e) {
    /* ... */
  },

  // 指针事件
  onPointerDown(e: CanvasMouseEvent<PointerEvent>) {
    /* ... */
  },
  onPointerUp(e) {
    /* ... */
  },

  // 事件捕获
  onClickCapture(e) {
    /* 在事件冒泡前处理 */
  },
  onPointerDownCapture(e) {
    /* ... */
  },
})
```

**事件对象属性**：

- `x`, `y`: 相对于当前节点的坐标
- `inPath`: 是否在节点的路径内
- `inStroke`: 是否在节点的描边上
- `original`: 原始的 DOM 事件对象
- `node`: 触发事件的节点

## 性能优化

### skipDraw

跳过不可见节点的绘制：

```typescript
hookDrawRect({
  skipDraw(n) {
    // 如果节点在可视区域外，跳过绘制
    if (n.axis.y.position() > containerHeight) return true
    if (n.axis.y.position() + n.axis.y.size() < 0) return true
    return false
  },
  // ... 其他属性
})
```

### 虚拟滚动示例

```typescript
import { OnScroll } from 'mve-dom-helper'

const scrollY = new OnScroll('y', {
  maxScroll() {
    return totalHeight() - containerHeight()
  },
})

const container = hookDrawRect({
  width: 400,
  height: 600,
  paddingTop: () => -scrollY.get(), // 滚动偏移
  onPointerDown(e) {
    scrollY.pointerEventListner(e.original)
  },
  children() {
    data.forEach((item, i) => {
      hookDrawRect({
        skipDraw(n) {
          // 虚拟滚动：只绘制可见的项目
          const top = n.axis.y.position()
          const bottom = top + n.axis.y.size()
          return bottom < 0 || top > container.axis.y.size()
        },
        // ... 渲染项目内容
      })
    })
  },
})
```

## 完整示例

### 简单的图形绘制

```typescript
import {
  renderCanvas,
  hookDrawRect,
  hookDrawText,
  hookFill,
} from 'mve-dom-helper/canvasRender'

export default function SimpleCanvas() {
  renderCanvas(
    {
      width: 400,
      height: 300,
    },
    () => {
      // 背景
      hookDrawRect({
        x: 0,
        y: 0,
        width: 400,
        height: 300,
        draw(ctx, n, path) {
          hookFill('#f8f9fa')
        },
      })

      // 圆形
      hookDraw({
        x: 100,
        y: 100,
        draw(ctx) {
          ctx.beginPath()
          ctx.arc(0, 0, 50, 0, Math.PI * 2)
          ctx.fillStyle = '#e74c3c'
          ctx.fill()
        },
      })

      // 文本
      hookDrawText({
        x: 200,
        y: 150,
        config: {
          text: 'Hello Canvas!',
          fontSize: '24px',
          fillStyle: '#2c3e50',
        },
      })
    }
  )
}
```

### 交互式列表

```typescript
import { createSignal } from 'wy-helper'
import {
  renderCanvas,
  hookDrawRect,
  hookDrawText,
  hookFill,
  simpleFlex,
} from 'mve-dom-helper/canvasRender'

export default function InteractiveList() {
  const selectedIndex = createSignal(-1)
  const items = ['项目 1', '项目 2', '项目 3', '项目 4', '项目 5']

  renderCanvas(
    {
      width: 300,
      height: 400,
    },
    () => {
      hookDrawRect({
        width: 300,
        height: 400,
        layout() {
          return simpleFlex({
            direction: 'y',
            gap: 2,
          })
        },
        children() {
          items.forEach((item, index) => {
            hookDrawRect({
              height: 60,
              alignSelf: alignSelf('stretch'),
              draw(ctx, n, path) {
                const isSelected = selectedIndex.get() === index
                hookFill(isSelected ? '#3498db' : '#ecf0f1')
              },
              onClick() {
                selectedIndex.set(index)
              },
              children() {
                hookDrawText({
                  config: {
                    text: item,
                    fontSize: '18px',
                    fillStyle: () =>
                      selectedIndex.get() === index ? '#fff' : '#2c3e50',
                  },
                  alignSelf: alignSelf('center'),
                })
              },
            })
          })
        },
      })
    }
  )
}
```

## 重要认知与陷阱

### **DOM/SVG 混合渲染的陷阱**

在使用 `renderALayout` 与 SVG 结合时，容易犯的错误：

```typescript
// ❌ 错误：在 SVG 内部使用 DOM 元素
fsvg.svg({
  children() {
    renderALayout({
      render(button) {
        return fdom.button({
          // ❌ 不能在 SVG 内部使用 DOM 元素
          // ...
        })
      },
    })
  },
})

// ✅ 正确：在 SVG 内部使用 SVG 元素
fsvg.svg({
  children() {
    renderALayout({
      render(button) {
        return fsvg.g({
          // ✅ 使用 SVG 元素
          transform: `translate(${button.axis.x.position()}, ${button.axis.y.position()})`,
          children() {
            fsvg.rect({
              /* 背景 */
            })
            fsvg.text({
              /* 文字 */
            })
          },
        })
      },
    })
  },
})
```

### **renderALayout 的布局约束**

```typescript
// ❌ 错误：没有 layout() 时访问 size()
renderALayout({
  width: 100,
  height: 50,
  // 没有 layout() 函数
  render(node) {
    return fsvg.rect({
      width: node.axis.x.size(), // ❌ 无法访问，会报错
      height: node.axis.y.size(), // ❌ 无法访问，会报错
    })
  },
})

// ✅ 正确：使用固定值或提供 layout()
renderALayout({
  width: 100,
  height: 50,
  render(node) {
    return fsvg.rect({
      width: 100, // ✅ 使用固定值
      height: 50, // ✅ 使用固定值
    })
  },
})

// 或者提供 layout() 函数
renderALayout({
  layout() {
    return simpleFlex({ direction: 'x' })
  },
  render(node) {
    return fsvg.rect({
      width: node.axis.x.size(), // ✅ 现在可以访问
      height: node.axis.y.size(), // ✅ 现在可以访问
    })
  },
})
```

### **hookMeasureSize 的覆盖陷阱**

```typescript
// ❌ 错误：手动设置的尺寸会被覆盖
const size = hookMeasureSize()
renderALayout({
  width: 200, // ❌ 这个值会被 hookMeasureSize 覆盖
  height: 100, // ❌ 这个值会被 hookMeasureSize 覆盖
  ...size, // hookMeasureSize 的返回值会覆盖上面的设置
})

// ✅ 正确：让 hookMeasureSize 完全控制尺寸
const size = hookMeasureSize()
renderALayout({
  ...size, // 只使用 hookMeasureSize 的返回值
})
```

### **simpleFlex 参数的正确理解**

```typescript
// 主轴控制
simpleFlex({
  direction: 'x',
  directionFix: undefined, // 子元素尺寸撑起父元素主轴
  // 或
  directionFix: 'around', // 父元素尺寸确定，计算子元素间距
})

// 辅轴控制
simpleFlex({
  alignFix: false, // 父元素辅轴尺寸由子元素决定
  // 或
  alignFix: true, // 父元素辅轴尺寸确定
})
```

## 最佳实践

1. **DOM/SVG 分离**: 不要在 SVG 内部使用 DOM 元素，反之亦然
2. **布局系统理解**: 明确何时能访问 `axis.x.size()` 等属性
3. **hookMeasureSize 谨慎使用**: 只在真正需要自适应尺寸时使用
4. **simpleFlex 参数明确**: 理解 `directionFix` 和 `alignFix` 的作用
5. **若非必要，勿增实体**: 避免不必要的包装函数和抽象层
6. **合理使用 skipDraw**: 对于大量节点，使用 skipDraw 跳过不可见的绘制
7. **响应式设计**: 利用信号系统实现响应式的尺寸和样式
8. **事件处理**: 合理使用事件捕获和冒泡机制
9. **性能监控**: 对于复杂场景，注意监控渲染性能

## 调试技巧

1. **检查元素类型**: 确保在正确的容器中使用正确的元素类型
2. **验证布局访问**: 如果无法访问 `axis.x.size()`，检查是否提供了 `layout()` 函数
3. **确认尺寸来源**: 明确尺寸是由 hookMeasureSize、固定值还是布局系统提供
4. **调试渲染问题**: 使用浏览器开发者工具检查 DOM/SVG 结构是否正确

Canvas 渲染系统为复杂的 2D 图形应用提供了强大而灵活的解决方案，但需要正确理解其约束和最佳实践，才能避免常见陷阱并构建高性能的交互式图形界面。
