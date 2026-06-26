# Text Rendering

The Canvas system provides text rendering with auto-measurement and word wrap.

## hookDrawText

Single-line text rendering with auto-size.

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
  height?: number,
  // other hookDrawRect properties...
})
```

**Basic usage**:

```typescript
hookDrawText({
  config: { text: 'Hello Canvas!', fontSize: '24px', fontFamily: 'Arial', fillStyle: '#2c3e50' }
})
```

**Reactive text**:

```typescript
const message = createSignal('dynamic text')

hookDrawText({
  config: () => ({ text: message.get(), fontSize: '18px', fillStyle: '#3498db' })
})
```

## hookDrawTextWrap

Word-wrap text rendering.

```typescript
hookDrawTextWrap({
  config: ValueOrGet<{
    text: string
    maxLines?: number
    lineHeight?: number
    fontSize?: string
    fontFamily?: string
  }>,
  width: ValueOrGet<number>,
  // other hookDrawRect properties...
})
```

**Word wrap example**:

```typescript
hookDrawTextWrap({
  width: 200,
  config: { text: 'A long text that wraps automatically within the given width.', maxLines: 3, fontSize: '16px', lineHeight: 1.5 }
})
```

## Text Selection

`hookDrawTextWrap` supports text selection:

```typescript
const selectStart = createSignal(0)
const selectEnd = createSignal(5)

const textNode = hookDrawTextWrap({
  width: 300,
  config: { text: 'selectable text content' },
  draw(e) {
    e.draw()
    e.ctx.fillStyle = 'rgba(0, 120, 215, 0.3)'
    const helper = textNode.helper.withSelect(selectStart.get, selectEnd.get)
    helper.draw(e.ctx)
  },
  onPointerDown(e) {
    const helper = textNode.helper.withSelect(selectStart.get, selectEnd.get)
    const index = helper.getIndex(e)
    selectStart.set(index)
    selectEnd.set(index)
  }
})
```

## Text Measurement

```typescript
const textNode = hookDrawText({
  config: { text: 'Hello' }
})

const measure = textNode.measureOut()
console.log(measure.measure.width) // text width
console.log(measure.height)        // line height
```

## Custom Drawing

```typescript
hookDrawText({
  config: { text: 'Custom Text' },
  draw(e) {
    e.draw({ x: 10, style: '#ff0000' })
  }
})
```
