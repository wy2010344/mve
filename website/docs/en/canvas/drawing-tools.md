# Drawing Tools

Helper functions for Canvas drawing operations.

## hookFill

Fills the current path.

```typescript
hookFill(style: CanvasStyle, fillRule?: CanvasFillRule)
```

**Solid fill**:

```typescript
hookDraw({
  withPath: true,
  draw({ path }) {
    path.rect(0, 0, 100, 100)
    hookFill('#3498db')
  }
})
```

**Gradient fill**:

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

Strokes the current path.

```typescript
hookStroke(width: number, style: CanvasStyle)
```

**Solid stroke**:

```typescript
hookDraw({
  withPath: true,
  draw({ path }) {
    path.rect(0, 0, 100, 100)
    hookStroke(2, '#333')
  }
})
```

**Dashed stroke**:

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

Sets a clipping region.

```typescript
hookClip(fillRule?: CanvasFillRule)
```

**Circular clip**:

```typescript
hookDraw({
  withPath: true,
  draw({ ctx, path }) {
    path.arc(50, 50, 40, 0, Math.PI * 2)
    hookClip()
    ctx.fillStyle = '#e74c3c'
    ctx.fillRect(0, 0, 100, 100)
  }
})
```

## hookCurrentCtx

Gets the current rendering context.

```typescript
hookDraw({
  draw() {
    const ctx = hookCurrentCtx()
    ctx.shadowBlur = 10
    ctx.shadowColor = '#000'
    ctx.shadowOffsetX = 5
    ctx.shadowOffsetY = 5
  }
})
```

## hookCurrentPath

Gets the current path object.

```typescript
hookDraw({
  withPath: true,
  draw() {
    const path = hookCurrentPath()
    // manipulate path
  }
})
```

## hookTranslate

Applies a temporary coordinate transform.

```typescript
hookTranslate(x: number, y: number, callback: () => void)
```

```typescript
hookDraw({
  draw({ ctx }) {
    hookTranslate(50, 50, () => {
      ctx.fillRect(0, 0, 100, 100)
    })
    // coordinates auto-restored
  }
})
```

## Combined Example

```typescript
hookDrawRect({
  width: 150,
  height: 100,
  draw({ ctx }) {
    const currentCtx = hookCurrentCtx()
    currentCtx.shadowBlur = 8
    currentCtx.shadowColor = 'rgba(0,0,0,0.3)'
    currentCtx.shadowOffsetX = 2
    currentCtx.shadowOffsetY = 2
    hookAddRect(10)
    hookFill('#3498db')
    hookStroke(2, '#2980b9')
  }
})
```
