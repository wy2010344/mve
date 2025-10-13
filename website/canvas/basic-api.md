# 基础 API

Canvas 渲染系统的核心 API。

## renderCanvas

创建 Canvas 渲染容器。

```typescript
renderCanvas(
  canvas: HTMLCanvasElement,
  children: (parent: { canvas: HTMLCanvasElement }) => void,
  options?: {
    /**
     * 比如将全局坐标移到中心
     * ctx.translate(width/2,height/2)
     */
    beforeDraw?(ctx: CanvasRenderingContext2D): void
    afterDraw?(ctx: CanvasRenderingContext2D): void
  }
)
```

**基础用法**：

```typescript
const canvas = document.createElement('canvas')
canvas.width = 400
canvas.height = 300

renderCanvas(canvas, ({ canvas }) => {
  // 在这里绘制内容
})
```

## hookDraw

基础绘制节点。

```typescript
hookDraw({
  x: ValueOrGet<number>,
  y: ValueOrGet<number>,
  withPath?: boolean,
  draw?(arg: DrawArg): void,
  children?(): void,
  skipDraw?(): boolean,
  // 事件处理...
})
```

**两种绘制模式**：

```typescript
// 直接绘制模式
hookDraw({
  x: 50,
  y: 50,
  draw({ ctx }) {
    ctx.fillStyle = '#3498db'
    ctx.fillRect(0, 0, 100, 100)
  }
})

// Path2D 模式（支持事件）
hookDraw({
  x: 50,
  y: 50,
  withPath: true,
  draw({ ctx, path }) {
    path.rect(0, 0, 100, 100)
    hookFill('#3498db')
  },
  onClick(e) {
    console.log('点击位置:', e.x, e.y)
  }
})
```

## hookDrawRect

矩形节点，支持布局系统。

```typescript
hookDrawRect({
  // 位置和尺寸
  x?: ValueOrGet<number>,
  y?: ValueOrGet<number>,
  width?: ValueOrGet<number>,
  height?: ValueOrGet<number>,
  
  // 内边距
  padding?: ValueOrGet<number>,
  paddingLeft?: ValueOrGet<number>,
  paddingRight?: ValueOrGet<number>,
  paddingTop?: ValueOrGet<number>,
  paddingBottom?: ValueOrGet<number>,
  
  // 布局
  layout?(): LayoutConfig,
  alignSelf?: AlignSelfFun,
  
  // 绘制
  draw?(arg: DrawArgRect): void,
  skipDraw?(rect: LayoutNode): boolean,
  
  children?(): void
})
```

**基础用法**：

```typescript
hookDrawRect({
  x: 100,
  y: 100,
  width: 200,
  height: 150,
  padding: 10,
  draw({ path }) {
    hookAddRect() // 添加矩形路径
    hookFill('#e74c3c')
  }
})
```

**布局容器**：

```typescript
hookDrawRect({
  width: 300,
  height: 200,
  layout() {
    return simpleFlex({
      direction: 'x',
      gap: 10,
      alignItems: 'center'
    })
  },
  children() {
    hookDrawRect({ width: 50, height: 50 })
    hookDrawRect({ width: 50, height: 50 })
    hookDrawRect({ width: 50, height: 50 })
  }
})
```

## hookDrawText

文本节点，自动测量尺寸，是渲染带文本内容节点的最佳选择。

```typescript
hookDrawText({
  x?: ValueOrGet<number>,
  y?: ValueOrGet<number>,
  config: ValueOrGet<{
    text: string
    fontSize?: string
    fontFamily?: string
    fontWeight?: string
    fillStyle?: string
  }>,
  padding?: ValueOrGet<number>,
  draw?(arg: DrawArgText): void,
  // 其他 hookDrawRect 属性...
})
```

**基础用法**：

```typescript
hookDrawText({
  x: 100,
  y: 100,
  config: {
    text: 'Hello Canvas',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  draw({ draw }) {
    draw({ style: '#333' }) // 绘制文本
  }
})
```

**响应式文本节点**：

```typescript
const position = createSignal({ x: 100, y: 100 })
const label = createSignal('可拖拽节点')

hookDrawText({
  x: () => position.get().x,
  y: () => position.get().y,
  padding: 10,
  config: () => ({
    text: label.get(),
    fontSize: '14px'
  }),
  draw({ path, draw }) {
    hookAddRect(8) // 背景圆角矩形
    hookFill('#3498db')
    hookStroke(1, '#2980b9')
    draw({ style: '#fff' }) // 白色文字
  },
  onPointerDown(e) {
    // 实现拖拽功能
    const initPos = position.get()
    pointerMove({
      onMove(moveE) {
        const diffX = moveE.pageX - e.original.pageX
        const diffY = moveE.pageY - e.original.pageY
        position.set({
          x: initPos.x + diffX,
          y: initPos.y + diffY
        })
      }
    })
  }
})
```

## 辅助函数

### hookAddRect

在当前矩形节点中添加矩形路径。

```typescript
// 添加整个矩形
hookAddRect()

// 添加圆角矩形
hookAddRect(8) // 统一圆角
hookAddRect({ tl: 8, tr: 8 }) // 指定圆角

// 添加内容区域矩形（排除 padding）
hookAddInnerRect()
```

### hookCurrentRect

获取当前矩形节点。

```typescript
hookDrawRect({
  draw() {
    const rect = hookCurrentRect()
    const width = rect.axis.x.size()
    const height = rect.axis.y.size()
  }
})
```