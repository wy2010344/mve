# 绘制工具

Canvas 系统提供的绘制辅助函数。

## hookFill

填充当前路径。

```typescript
hookFill(style: CanvasStyle, fillRule?: CanvasFillRule)
```

**基础用法**：

```typescript
hookDraw({
  withPath: true,
  draw({ path }) {
    path.rect(0, 0, 100, 100)
    hookFill('#3498db')
  }
})
```

**渐变填充**：

```typescript
hookDraw({
  withPath: true,
  draw({ ctx, path }) {
    const gradient = ctx.createLinearGradient(0, 0, 100, 0)
    gradient.addColorStop(0, '#ff6b6b')
    gradient.addColorStop(1, '#4ecdc4')
    
    path.rect(0, 0, 100, 100)
    hookFill(gradient)
  }
})
```

## hookStroke

描边当前路径。

```typescript
hookStroke(width: number, style: CanvasStyle)
```

**基础用法**：

```typescript
hookDraw({
  withPath: true,
  draw({ path }) {
    path.rect(0, 0, 100, 100)
    hookStroke(2, '#333')
  }
})
```

**虚线描边**：

```typescript
hookDraw({
  withPath: true,
  draw({ ctx, path }) {
    ctx.setLineDash([5, 5])
    path.rect(0, 0, 100, 100)
    hookStroke(1, '#666')
  }
})
```

## hookClip

设置裁剪区域。

```typescript
hookClip(fillRule?: CanvasFillRule)
```

**圆形裁剪示例**：

```typescript
hookDraw({
  withPath: true,
  draw({ ctx, path }) {
    // 创建圆形裁剪区域
    path.arc(50, 50, 40, 0, Math.PI * 2)
    hookClip()
    
    // 后续绘制会被裁剪
    ctx.fillStyle = '#e74c3c'
    ctx.fillRect(0, 0, 100, 100)
  }
})
```

## hookCurrentCtx

获取当前绘制上下文。

```typescript
hookDraw({
  draw() {
    const ctx = hookCurrentCtx()
    
    // 设置阴影效果
    ctx.shadowBlur = 10
    ctx.shadowColor = '#000'
    ctx.shadowOffsetX = 5
    ctx.shadowOffsetY = 5
  }
})
```

## hookCurrentPath

获取当前路径对象。

```typescript
hookDraw({
  withPath: true,
  draw() {
    const path = hookCurrentPath()
    // 可以对路径进行操作
  }
})
```

## hookTranslate

临时变换坐标系。

```typescript
hookTranslate(x: number, y: number, callback: () => void)
```

**用法示例**：

```typescript
hookDraw({
  draw({ ctx }) {
    hookTranslate(50, 50, () => {
      // 在偏移后的坐标系中绘制
      ctx.fillRect(0, 0, 100, 100)
    })
    // 坐标系自动恢复
  }
})
```

## 组合使用

**带阴影的圆角矩形**：

```typescript
hookDrawRect({
  width: 150,
  height: 100,
  draw({ ctx }) {
    const currentCtx = hookCurrentCtx()
    
    // 设置阴影
    currentCtx.shadowBlur = 8
    currentCtx.shadowColor = 'rgba(0,0,0,0.3)'
    currentCtx.shadowOffsetX = 2
    currentCtx.shadowOffsetY = 2
    
    // 绘制圆角矩形
    hookAddRect(10)
    hookFill('#3498db')
    hookStroke(2, '#2980b9')
  }
})
```