# Layout System

The Canvas rendering system includes a responsive flex layout engine.

## simpleFlex

Flex layout configuration.

```typescript
simpleFlex({
  direction: 'x' | 'y',
  gap?: number,
  alignItems?: 'start' | 'center' | 'end' | 'stretch',
  directionFix?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly',
  alignFix?: boolean
})
```

## Basic Layout

**Horizontal**:

```typescript
hookDrawRect({
  width: 300, height: 100,
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

**Vertical**:

```typescript
hookDrawRect({
  width: 100, height: 300,
  layout() {
    return simpleFlex({ direction: 'y', gap: 10, alignItems: 'stretch' })
  },
  children() {
    hookDrawRect({ height: 50 })
    hookDrawRect({ height: 50 })
    hookDrawRect({ height: 50 })
  }
})
```

## Alignment

### alignItems

Controls cross-axis alignment:

```typescript
simpleFlex({ direction: 'x', alignItems: 'center' })
simpleFlex({ direction: 'x', alignItems: 'stretch' })
```

### directionFix

Controls main-axis distribution:

```typescript
simpleFlex({ direction: 'x', directionFix: 'between' })
simpleFlex({ direction: 'x', directionFix: 'center' })
simpleFlex({ direction: 'x', directionFix: 'evenly' })
```

## alignSelf

Per-child alignment override:

```typescript
hookDrawRect({
  layout() { return simpleFlex({ direction: 'x' }) },
  children() {
    hookDrawRect({ width: 50, height: 50, alignSelf: alignSelf('center') })
    hookDrawRect({ width: 50, height: 50, alignSelf: alignSelf('end') })
  }
})
```

## Responsive Layout

**Dynamic sizes**:

```typescript
const containerWidth = createSignal(400)

hookDrawRect({
  width: () => containerWidth.get(),
  height: 200,
  layout() {
    return simpleFlex({ direction: 'x', gap: () => containerWidth.get() > 300 ? 20 : 10 })
  }
})
```

**Content auto-sizing**:

```typescript
hookDrawRect({
  height: 100,
  layout() { return simpleFlex({ direction: 'x', gap: 10 }) },
  children() {
    hookDrawText({ config: { text: 'auto width' } })
    hookDrawText({ config: { text: 'text' } })
  }
})
```

## Nested Layout

```typescript
hookDrawRect({
  width: 400, height: 300,
  layout() { return simpleFlex({ direction: 'y', gap: 10 }) },
  children() {
    hookDrawRect({
      height: 50, alignSelf: alignSelf('stretch'),
      layout() { return simpleFlex({ direction: 'x', alignItems: 'center', directionFix: 'between' }) },
      children() {
        hookDrawText({ config: { text: 'title' } })
        hookDrawText({ config: { text: 'action' } })
      }
    })
    hookDrawRect({
      alignSelf: alignSelf('stretch'), grow: 1,
      layout() { return simpleFlex({ direction: 'x', gap: 20 }) },
      children() {
        hookDrawRect({ width: 200 })
        hookDrawRect({ grow: 1 })
      }
    })
  }
})
```

## Debugging

Use borders to visualize layout:

```typescript
hookDrawRect({
  layout() { return simpleFlex({ direction: 'x', gap: 10 }) },
  draw() { hookAddRect(); hookStroke(1, '#ddd') },
  children() {
    hookDrawRect({
      width: 50, height: 50,
      draw() { hookAddRect(); hookFill('#f0f0f0'); hookStroke(1, '#ccc') }
    })
  }
})
```
