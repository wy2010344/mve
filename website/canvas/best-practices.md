# 最佳实践

Canvas 渲染系统的重要认知和使用建议。

## 核心原则

### 若非必要，勿增实体

- 避免不必要的抽象和包装函数
- 直接使用现有 API，不要创建多余的中间层
- 优先简单直接的解决方案

### 布局系统理解

- 只有设置了 `layout()` 的容器，子元素才能访问 `axis.x.size()` 等属性
- 有布局的容器中，子元素位置由布局系统计算，不要手动设置 x, y
- 使用 `alignSelf` 控制子元素在布局中的对齐方式

## 常见陷阱

### 绘制模式混淆

```typescript
// ❌ 错误：withPath 模式下使用 ctx 直接绘制
hookDraw({
  withPath: true,
  draw({ ctx }) {
    ctx.fillRect(0, 0, 100, 100) // 不会触发事件检测
  }
})

// ✅ 正确：withPath 模式下使用 path
hookDraw({
  withPath: true,
  draw({ path }) {
    path.rect(0, 0, 100, 100)
    hookFill('#3498db')
  }
})
```

### 布局访问错误

```typescript
// ❌ 错误：没有 layout() 时访问 size()
hookDrawRect({
  width: 100,
  height: 50,
  draw({ rect }) {
    const width = rect.axis.x.size() // ❌ 可能报错
  }
})

// ✅ 正确：提供 layout() 或使用固定值
hookDrawRect({
  width: 100,
  height: 50,
  layout() {
    return simpleFlex({ direction: 'x' })
  },
  draw({ rect }) {
    const width = rect.axis.x.size() // ✅ 现在可以访问
  }
})
```

### 事件处理遗漏

```typescript
// ❌ 错误：忘记设置 withPath
hookDrawRect({
  draw() {
    hookAddRect()
    hookFill('#3498db')
  },
  onClick() {
    // 不会触发，因为没有 withPath: true
  }
})

// ✅ 正确：设置 withPath
hookDrawRect({
  draw() {
    hookAddRect()
    hookFill('#3498db')
  },
  onClick() {
    // 正常触发
  }
})
```

## 性能最佳实践

### 合理使用 skipDraw

```typescript
// 对于大量元素，必须实现 skipDraw
hookDrawRect({
  skipDraw(rect) {
    // 不在可视区域时跳过
    const top = rect.axis.y.position()
    const bottom = top + rect.axis.y.size()
    return bottom < 0 || top > containerHeight
  }
})
```

### 缓存复杂计算

```typescript
// ✅ 缓存计算结果
const expensiveValue = memo(() => {
  return someComplexCalculation()
})

hookDrawRect({
  width: () => expensiveValue()
})
```

### 批量状态更新

```typescript
import { batch } from 'wy-helper'

// ✅ 批量更新避免多次重绘
batch(() => {
  position.set(newPos)
  color.set(newColor)
  size.set(newSize)
})
```

## 代码组织

### 模块拆分

- 单个文件不超过 200 行
- 按功能职责拆分：数据、渲染、交互
- 避免循环依赖

### 命名规范

- 渲染函数使用 `render` 前缀：`renderChart`
- 事件处理使用 `handle` 前缀：`handleClick`
- 工具函数使用动词开头：`createNodes`, `updateLayout`

## 调试技巧

### 可视化调试

```typescript
// 添加边框查看布局
hookDrawRect({
  draw() {
    hookAddRect()
    hookStroke(1, '#ff0000') // 红色边框便于调试
  }
})
```

### 性能监控

```typescript
// 监控渲染性能
renderCanvas(canvas, ({ canvas }) => {
  // 内容
}, {
  beforeDraw() {
    console.time('render')
  },
  afterDraw() {
    console.timeEnd('render')
  }
})
```

### 事件调试

```typescript
hookDrawRect({
  onClick(e) {
    console.log('点击事件:', {
      position: { x: e.x, y: e.y },
      inPath: e.inPath,
      node: e.node
    })
  }
})
```

## 架构建议

### 数据与视图分离

```typescript
// ✅ 数据层
const chartData = createSignal([...])
const selectedItem = createSignal(null)

// ✅ 视图层
function renderChart() {
  return hookDrawRect({
    children() {
      chartData.get().forEach(item => {
        renderChartItem(item)
      })
    }
  })
}
```

### 组件化思维

```typescript
// ✅ 可复用的组件
function renderButton(text: string, onClick: () => void) {
  return hookDrawRect({
    width: 100,
    height: 40,
    draw() {
      hookAddRect(4)
      hookFill('#3498db')
    },
    onClick,
    children() {
      hookDrawText({
        config: { text, fillStyle: '#fff' },
        alignSelf: alignSelf('center')
      })
    }
  })
}
```

### 状态管理

```typescript
// ✅ 集中的状态管理
const appState = {
  selectedItems: createSignal(new Set()),
  viewMode: createSignal('list'),
  searchText: createSignal('')
}

// ✅ 派生状态
const filteredItems = memo(() => {
  const search = appState.searchText.get()
  return items.filter(item => item.name.includes(search))
})
```

## 总结

1. **简单优先**: 避免过度设计，直接使用 API
2. **性能意识**: 大量元素必须考虑 skipDraw 和虚拟化
3. **响应式思维**: 利用信号系统实现数据驱动
4. **组件化**: 将复杂界面拆分为可复用组件
5. **调试友好**: 添加必要的调试信息和边界检查