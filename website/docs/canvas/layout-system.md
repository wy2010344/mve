# 布局系统

Canvas 渲染系统集成了响应式布局系统。

## simpleFlex

Flex 布局配置。

```typescript
simpleFlex({
  direction: 'x' | 'y',
  gap?: number,
  alignItems?: 'start' | 'center' | 'end' | 'stretch',
  directionFix?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly',
  alignFix?: boolean
})
```

## 基础布局

**水平排列**：

```typescript
hookDrawRect({
  width: 300,
  height: 100,
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

**垂直排列**：

```typescript
hookDrawRect({
  width: 100,
  height: 300,
  layout() {
    return simpleFlex({
      direction: 'y',
      gap: 10,
      alignItems: 'stretch'
    })
  },
  children() {
    hookDrawRect({ height: 50 })
    hookDrawRect({ height: 50 })
    hookDrawRect({ height: 50 })
  }
})
```

## 对齐方式

### alignItems

控制辅轴对齐：

```typescript
// 居中对齐
simpleFlex({
  direction: 'x',
  alignItems: 'center'
})

// 拉伸填充
simpleFlex({
  direction: 'x',
  alignItems: 'stretch'
})
```

### directionFix

控制主轴分布：

```typescript
// 两端对齐
simpleFlex({
  direction: 'x',
  directionFix: 'between'
})

// 居中分布
simpleFlex({
  direction: 'x',
  directionFix: 'center'
})

// 平均分布
simpleFlex({
  direction: 'x',
  directionFix: 'evenly'
})
```

## alignSelf

子元素自定义对齐：

```typescript
import { alignSelf } from 'wy-helper'

hookDrawRect({
  layout() {
    return simpleFlex({ direction: 'x' })
  },
  children() {
    hookDrawRect({ 
      width: 50, 
      height: 50,
      alignSelf: alignSelf('center')
    })
    hookDrawRect({ 
      width: 50, 
      height: 50,
      alignSelf: alignSelf('end')
    })
  }
})
```

## 响应式布局

**动态尺寸**：

```typescript
const containerWidth = createSignal(400)

hookDrawRect({
  width: () => containerWidth.get(),
  height: 200,
  layout() {
    return simpleFlex({
      direction: 'x',
      gap: () => containerWidth.get() > 300 ? 20 : 10
    })
  }
})
```

**内容自适应**：

```typescript
hookDrawRect({
  // 不设置 width，由子元素撑开
  height: 100,
  layout() {
    return simpleFlex({
      direction: 'x',
      gap: 10
    })
  },
  children() {
    hookDrawText({ config: { text: '自适应宽度' } })
    hookDrawText({ config: { text: '的文本' } })
  }
})
```

## 嵌套布局

```typescript
hookDrawRect({
  width: 400,
  height: 300,
  layout() {
    return simpleFlex({
      direction: 'y',
      gap: 10
    })
  },
  children() {
    // 头部
    hookDrawRect({
      height: 50,
      alignSelf: alignSelf('stretch'),
      layout() {
        return simpleFlex({
          direction: 'x',
          alignItems: 'center',
          directionFix: 'between'
        })
      },
      children() {
        hookDrawText({ config: { text: '标题' } })
        hookDrawText({ config: { text: '操作' } })
      }
    })
    
    // 内容区域
    hookDrawRect({
      alignSelf: alignSelf('stretch'),
      grow: 1, // 填充剩余空间
      layout() {
        return simpleFlex({
          direction: 'x',
          gap: 20
        })
      },
      children() {
        hookDrawRect({ width: 200 }) // 侧边栏
        hookDrawRect({ grow: 1 })     // 主内容
      }
    })
  }
})
```

## 布局调试

使用边框查看布局：

```typescript
hookDrawRect({
  layout() {
    return simpleFlex({ direction: 'x', gap: 10 })
  },
  draw() {
    hookAddRect()
    hookStroke(1, '#ddd') // 容器边框
  },
  children() {
    hookDrawRect({
      width: 50,
      height: 50,
      draw() {
        hookAddRect()
        hookFill('#f0f0f0')
        hookStroke(1, '#ccc') // 子元素边框
      }
    })
  }
})
```