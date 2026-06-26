# Basic API

Core rendering functions and node types.

## renderCanvas

Creates a Canvas render container.

```typescript
renderCanvas(
  canvas: HTMLCanvasElement,
  children: (parent: { canvas: HTMLCanvasElement }) => void,
  options?: {
    beforeDraw?(ctx: CanvasRenderingContext2D): void
    afterDraw?(ctx: CanvasRenderingContext2D): void
  }
)
```

**Example**:

```typescript
const canvas = document.createElement('canvas')
canvas.width = 400
canvas.height = 300

renderCanvas(canvas, ({ canvas }) => {
  // draw content here
})
```

## hookDraw

Base draw node.

```typescript
hookDraw({
  x: ValueOrGet<number>,
  y: ValueOrGet<number>,
  withPath?: boolean,
  draw?(arg: DrawArg): void,
  children?(): void,
  skipDraw?(): boolean,
  // event handlers...
})
```

**Two draw modes**:

```typescript
// direct draw mode
hookDraw({
  x: 50,
  y: 50,
  draw({ ctx }) {
    ctx.fillStyle = '#3498db'
    ctx.fillRect(0, 0, 100, 100)
  }
})

// Path2D mode (with events)
hookDraw({
  x: 50,
  y: 50,
  withPath: true,
  draw({ ctx, path }) {
    path.rect(0, 0, 100, 100)
    hookFill('#3498db')
  },
  onClick(e) {
    console.log('click at:', e.x, e.y)
  }
})
```

## hookDrawRect

Rectangle node with layout system support.

```typescript
hookDrawRect({
  x?: ValueOrGet<number>,
  y?: ValueOrGet<number>,
  width?: ValueOrGet<number>,
  height?: ValueOrGet<number>,
  padding?: ValueOrGet<number>,
  paddingLeft?: ValueOrGet<number>,
  paddingRight?: ValueOrGet<number>,
  paddingTop?: ValueOrGet<number>,
  paddingBottom?: ValueOrGet<number>,
  layout?(): LayoutConfig,
  alignSelf?: AlignSelfFun,
  draw?(arg: DrawArgRect): void,
  skipDraw?(rect: LayoutNode): boolean,
  children?(): void
})
```

**Example**:

```typescript
hookDrawRect({
  x: 100,
  y: 100,
  width: 200,
  height: 150,
  padding: 10,
  draw({ path }) {
    hookAddRect()
    hookFill('#e74c3c')
  }
})
```

**Layout container**:

```typescript
hookDrawRect({
  width: 300,
  height: 200,
  layout() {
    return simpleFlex({ direction: 'x', gap: 10, alignItems: 'center' })
  },
  children() {
    hookDrawRect({ width: 50, height: 50 })
    hookDrawRect({ width: 50, height: 50 })
    hookDrawRect({ width: 50, height: 50 })
  }
})
```

## hookDrawText

Single-line text node, auto-measures dimensions.

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
  // other hookDrawRect properties...
})
```

**Example**:

```typescript
hookDrawText({
  x: 100,
  y: 100,
  config: { text: 'Hello Canvas', fontSize: '16px', fontWeight: 'bold' },
  draw({ draw }) {
    draw({ style: '#333' })
  }
})
```

**Reactive text node**:

```typescript
const position = createSignal({ x: 100, y: 100 })
const label = createSignal('draggable node')

hookDrawText({
  x: () => position.get().x,
  y: () => position.get().y,
  padding: 10,
  config: () => ({ text: label.get(), fontSize: '14px' }),
  draw({ path, draw }) {
    hookAddRect(8)
    hookFill('#3498db')
    hookStroke(1, '#2980b9')
    draw({ style: '#fff' })
  },
  onPointerDown(e) {
    const initPos = position.get()
    pointerMove({
      onMove(moveE) {
        const diffX = moveE.pageX - e.original.pageX
        const diffY = moveE.pageY - e.original.pageY
        position.set({ x: initPos.x + diffX, y: initPos.y + diffY })
      }
    })
  }
})
```

## Helpers

### hookAddRect

Adds a rectangle path to the current node.

```typescript
hookAddRect()              // full rectangle
hookAddRect(8)             // rounded corners
hookAddRect({ tl: 8, tr: 8 }) // specific corners
hookAddInnerRect()         // content area (excludes padding)
```

### hookCurrentRect

Gets the current rectangle node.

```typescript
hookDrawRect({
  draw() {
    const rect = hookCurrentRect()
    const width = rect.axis.x.size()
    const height = rect.axis.y.size()
  }
})
```
