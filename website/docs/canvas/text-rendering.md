# 文本渲染

Canvas 系统提供了强大的文本渲染功能。

## hookDrawText

单行文本渲染，自动测量尺寸。

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
  height?: number, // 可选，默认根据字体计算
  // 其他 hookDrawRect 属性...
})
```

**基础用法**：

```typescript
hookDrawText({
  config: {
    text: 'Hello Canvas!',
    fontSize: '24px',
    fontFamily: 'Arial',
    fillStyle: '#2c3e50',
  }
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
  })
})
```

## hookDrawTextWrap

自动换行文本渲染。

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
  width: ValueOrGet<number>, // 必需，用于计算换行
  // 其他 hookDrawRect 属性...
})
```

**自动换行示例**：

```typescript
hookDrawTextWrap({
  width: 200,
  config: {
    text: '这是一段很长的文本，会自动换行显示在指定的宽度内。',
    maxLines: 3,
    fontSize: '16px',
    lineHeight: 1.5,
  }
})
```

## 文本选择和编辑

`hookDrawTextWrap` 支持文本选择功能：

```typescript
const selectStart = createSignal(0)
const selectEnd = createSignal(5)

const textNode = hookDrawTextWrap({
  width: 300,
  config: { text: '可选择的文本内容' },
  draw(e) {
    e.draw() // 绘制文本
    
    // 绘制选择区域
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

## 文本测量

获取文本的测量信息：

```typescript
const textNode = hookDrawText({
  config: { text: 'Hello' }
})

// 获取测量结果
const measure = textNode.measureOut()
console.log(measure.measure.width) // 文本宽度
console.log(measure.height) // 行高
```

## 自定义绘制

```typescript
hookDrawText({
  config: { text: 'Custom Text' },
  draw(e) {
    // 自定义绘制逻辑
    e.draw({ 
      x: 10, // 偏移
      style: '#ff0000' // 自定义颜色
    })
  }
})
```