# 性能优化

Canvas 渲染系统的性能优化策略。

## skipDraw 优化

`skipDraw` 是最重要的性能优化手段：

```typescript
hookDrawRect({
  skipDraw(rect) {
    // 不在可视区域内时跳过绘制
    const top = rect.axis.y.position()
    const bottom = top + rect.axis.y.size()
    return bottom < 0 || top > containerHeight
  },
  draw() {
    // 只有 skipDraw 返回 false 时才会执行
  }
})
```

## 虚拟滚动

对于大量数据的列表：

```typescript
import { OnScroll } from 'mve-dom-helper'

const data = Array.from({ length: 10000 }, (_, i) => `项目 ${i}`)
const itemHeight = 50
const containerHeight = 600

const scrollY = new OnScroll('y', {
  maxScroll() {
    return data.length * itemHeight - containerHeight
  }
})

const container = hookDrawRect({
  width: 400,
  height: containerHeight,
  paddingTop: () => -scrollY.get(),
  
  onPointerDown(e) {
    scrollY.pointerEventListner(e.original)
  },
  
  children() {
    // 只渲染可见范围的项目
    const scroll = scrollY.get()
    const startIndex = Math.floor(scroll / itemHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      data.length
    )
    
    for (let i = startIndex; i < endIndex; i++) {
      hookDrawRect({
        y: i * itemHeight,
        height: itemHeight,
        alignSelf: alignSelf('stretch'),
        
        skipDraw(rect) {
          const top = rect.axis.y.position()
          const bottom = top + rect.axis.y.size()
          return bottom < 0 || top > container.axis.y.size()
        },
        
        children() {
          hookDrawText({
            config: { text: data[i] },
            alignSelf: alignSelf('center')
          })
        }
      })
    }
  }
})
```

## 响应式优化

**缓存计算结果**：

```typescript
// ❌ 每次都重新计算
hookDrawRect({
  width: () => someComplexCalculation(),
})

// ✅ 缓存计算结果
const cachedWidth = memo(() => someComplexCalculation())

hookDrawRect({
  width: () => cachedWidth(),
})
```

**批量更新**：

```typescript
import { batch } from 'wy-helper'

// ❌ 多次触发重绘
items.forEach(item => {
  item.position.set(newPosition)
  item.color.set(newColor)
})

// ✅ 批量更新
batch(() => {
  items.forEach(item => {
    item.position.set(newPosition)
    item.color.set(newColor)
  })
})
```

## 绘制优化

**减少复杂绘制**：

```typescript
// ❌ 复杂的绘制操作
hookDrawRect({
  draw({ ctx }) {
    const gradient = ctx.createRadialGradient(...)
    ctx.shadowBlur = 20
    hookFill(gradient)
  }
})

// ✅ 缓存复杂对象
const cachedGradient = memo(() => {
  const ctx = getOneCtx()
  return ctx.createRadialGradient(...)
})

hookDrawRect({
  draw() {
    hookFill(cachedGradient())
  }
})
```

**路径复用**：

```typescript
// ✅ 复用路径对象
const circlePath = new Path2D()
circlePath.arc(50, 50, 30, 0, Math.PI * 2)

hookDraw({
  withPath: true,
  draw({ ctx }) {
    ctx.fill(circlePath)
  }
})
```

## 内存管理

**及时清理资源**：

```typescript
import { hookAddDestroy } from 'mve-core'

function ImageGallery() {
  const images = createSignal([])
  
  // 清理不再使用的图片
  hookAddDestroy(() => {
    // 清理逻辑
  })
  
  return hookDrawRect({
    children() {
      images.get().forEach((imageUrl, index) => {
        hookDrawUrlImage({
          src: imageUrl,
          skipDraw(rect) {
            // 不在可视范围内的图片不加载
            return !isInViewport(rect)
          }
        })
      })
    }
  })
}
```

## 性能监控

**帧率监控**：

```typescript
const fps = createSignal(0)
let lastTime = performance.now()
let frameCount = 0

function updateFPS() {
  frameCount++
  const currentTime = performance.now()
  
  if (currentTime - lastTime >= 1000) {
    fps.set(Math.round((frameCount * 1000) / (currentTime - lastTime)))
    frameCount = 0
    lastTime = currentTime
  }
  
  requestAnimationFrame(updateFPS)
}

updateFPS()

hookDrawText({
  config: () => ({
    text: `FPS: ${fps.get()}`,
    fillStyle: fps.get() < 30 ? '#e74c3c' : '#27ae60'
  })
})
```

**渲染时间统计**：

```typescript
renderCanvas(canvas, ({ canvas }) => {
  // 渲染内容
}, {
  beforeDraw(ctx) {
    console.time('canvas-render')
  },
  afterDraw(ctx) {
    console.timeEnd('canvas-render')
  }
})
```

## 最佳实践

1. **合理使用 skipDraw**: 对于大量元素必须实现跳过逻辑
2. **虚拟滚动**: 超过 100 个项目的列表应该使用虚拟滚动
3. **缓存计算**: 避免在每次渲染时重复复杂计算
4. **批量更新**: 使用 batch 进行批量状态更新
5. **简化绘制**: 避免过度复杂的绘制操作
6. **资源管理**: 及时清理不再使用的资源
7. **性能监控**: 在开发阶段监控渲染性能
8. **使用 renderArrayKey**: 对于动态列表，使用 renderArrayKey 而不是 forEach
9. **响应式数据模型**: 将可变数据转换为信号，实现数据驱动渲染