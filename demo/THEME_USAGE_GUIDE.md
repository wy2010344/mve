# MVE 响应式绑定使用指南

## ❌ 错误用法

在 MVE 中，render 函数只执行一次，如果在顶层调用 Signal 相关函数，获得的只是初始状态，不会动态更新：

```typescript
export default function () {
  const { themeColors, theme } = gContext.consume();
  const { dataStatistics } = advancedContext.consume();
  
  // ❌ 错误：在顶层调用，只获得初始状态
  const colors = themeColors();
  const isDark = theme() === "dark";
  const stats = dataStatistics();
  
  fdom.div({
    // ❌ 错误：这些值不会动态更新
    className: `${colors.bg} ${colors.text}`,
    children() {
      fdom.p({
        childrenType: "text",
        children: `当前是${isDark ? "暗色" : "亮色"}模式，共${stats.total}项数据`
      });
    }
  });
}
```

## ✅ 正确用法

应该在具体的属性函数中调用 Signal 相关函数，这样才能在运行时动态变化：

```typescript
export default function () {
  const { themeColors, theme } = gContext.consume();
  const { dataStatistics } = advancedContext.consume();
  
  fdom.div({
    // ✅ 正确：在属性函数中调用，会动态更新
    className() {
      return `${themeColors().bg} ${themeColors().text}`;
    },
    children() {
      fdom.p({
        className() {
          // ✅ 正确：每次都会获取最新的主题色
          return `text-lg ${themeColors().textSecondary}`;
        },
        childrenType: "text",
        children() {
          // ✅ 正确：在 children 函数中调用，会动态更新
          const isDark = theme() === "dark";
          const stats = dataStatistics();
          return `当前是${isDark ? "暗色" : "亮色"}模式，共${stats.total}项数据`;
        }
      });
    }
  });
}
```

## 🔧 性能优化

如果在同一个属性函数中多次使用 Signal 值，可以在函数内部缓存：

```typescript
fdom.div({
  className() {
    // ✅ 在属性函数内部缓存，既保证动态性又避免重复调用
    const colors = themeColors();
    const isDark = theme() === "dark";
    return `${colors.bg} ${colors.text} ${colors.border} border ${isDark ? 'dark-mode' : 'light-mode'}`;
  },
  children() {
    fdom.p({
      childrenType: "text",
      children() {
        // ✅ 在 children 函数内部缓存
        const stats = dataStatistics();
        const isDark = theme() === "dark";
        return `${isDark ? "🌙" : "☀️"} 统计：${stats.total} 项`;
      }
    });
  }
});
```

## 📝 修正示例

### 修正前：
```typescript
export default function () {
  const { themeColors, theme } = gContext.consume();
  const { dataStatistics } = advancedContext.consume();
  
  const colors = themeColors(); // ❌ 错误
  const isDark = theme() === "dark"; // ❌ 错误
  const stats = dataStatistics(); // ❌ 错误

  fdom.div({
    className: `${colors.bg} p-4`, // ❌ 不会动态更新
    children() {
      fdom.span({
        childrenType: "text",
        children: `${stats.total} 项` // ❌ 不会动态更新
      });
    }
  });
}
```

### 修正后：
```typescript
export default function () {
  const { themeColors, theme } = gContext.consume();
  const { dataStatistics } = advancedContext.consume();

  fdom.div({
    className() {
      return `${themeColors().bg} p-4`; // ✅ 正确
    },
    children() {
      fdom.span({
        childrenType: "text",
        children() {
          return `${dataStatistics().total} 项`; // ✅ 正确
        }
      });
    }
  });
}
```

## 🎯 关键要点

1. **render 函数只执行一次**：组件的 render 函数在初始化时只执行一次
2. **属性函数会重复执行**：当依赖的 Signal 变化时，属性函数会重新执行
3. **所有 Signal 调用都要延迟**：包括 `themeColors()`、`theme()`、`dataStatistics()` 等所有 Signal 相关调用
4. **在属性函数中调用**：只有在属性函数（如 `className()`、`children()` 等）中调用才能建立响应式绑定
5. **避免顶层展开**：不要在组件顶层调用任何 Signal 函数，这样只能获得初始值

## 📋 常见错误模式

```typescript
// ❌ 所有这些都是错误的顶层调用
const colors = themeColors();
const isDark = theme() === "dark";
const user = getUserData();
const loading = isLoading();
const stats = dataStatistics();
const items = getItems();
```

```typescript
// ✅ 正确的做法是在属性函数中调用
fdom.div({
  className() {
    const isDark = theme() === "dark"; // ✅ 在属性函数中
    return isDark ? "dark-theme" : "light-theme";
  },
  children() {
    const user = getUserData(); // ✅ 在 children 函数中
    return user ? user.name : "未登录";
  }
});
```

## 🔄 副作用处理的正确用法

当需要根据 Signal 的变化执行副作用时，不能直接使用 `addEffect`，因为它不会建立依赖追踪：

### ❌ 错误的副作用处理：
```typescript
// ❌ 错误：addEffect 不会追踪 count 的变化
addEffect(() => {
  const currentCount = count.get();
  const log = `计数变化: ${currentCount}`;
  trackingLog.set([log, ...trackingLog.get().slice(0, 4)]);
});
```

### ✅ 正确的副作用处理：
```typescript
// ✅ 正确：使用 hookTrackSignal 建立依赖追踪
hookTrackSignal(count.get, function(currentCount) {
  const log = `计数变化: ${currentCount} (${new Date().toLocaleTimeString()})`;
  addEffect(() => {
    trackingLog.set([log, ...trackingLog.get().slice(0, 4)]);
  });
  
  if (currentCount === 10) {
    alert('🎉 恭喜！计数达到 10');
  }
});
```

### 🔑 副作用处理原则：
1. **使用 hookTrackSignal 建立依赖**：第一个参数是要追踪的 Signal 的 get 函数
2. **在回调中使用 addEffect**：在 hookTrackSignal 的回调中使用 addEffect 执行实际的副作用
3. **回调参数是最新值**：hookTrackSignal 的回调函数会接收到 Signal 的最新值作为参数

这个概念对于理解 MVE 的响应式机制非常重要！类似于 Vue 的响应式系统，只有在正确的位置访问响应式数据才能建立依赖追踪。