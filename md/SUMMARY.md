# MVE 框架核心要点

## 🎯 核心 API

### 响应式系统 (wy-helper)
- **createSignal(0)**: 原子信号，类似 Vue shallowRef
- **memo(() => {})**: 智能计算，相同返回值不触发更新
- **hookTrackSignal(get, callback)**: 依赖追踪，自动销毁
- **addEffect(callback, level)**: 批量更新后执行，level > -1

### 渲染系统 (mve-helper)
- **renderArrayKey(getArray, getKey, render)**: 列表渲染
- **renderIf(condition, ifTrue, ifFalse)**: 条件渲染
- **hookPromiseSignal(getDeps)**: 异步状态管理

### DOM API (mve-dom)
- **fdom.div({})**: 扁平参数风格（推荐）
- **dom.div({}).render()**: 链式调用风格
- **`mdom.div({ attrs(m) {}})`**: 减少重复依赖

## 🔄 与 Vue/React 对比

| Vue 3 | React | MVE |
|-------|-------|-----|
| `ref(0)` | `useState(0)` | `createSignal(0)` |
| `computed(() => {})` | `useMemo(() => {}, [])` | `memo(() => {})` |
| `watchEffect(() => {})` | `useEffect(() => {}, [])` | `hookTrackSignal(() => {}, () => {})` |

## ⚠️ 关键易错点

### 1. 响应式绑定位置
```typescript
// ❌ 错误：顶层调用，永远不会更新
export default function() {
  const colors = themeColors();
  return fdom.div({ className: colors.bg });
}

// ✅ 正确：在属性函数中调用
export default function() {
  return fdom.div({
    className() { return themeColors().bg; }
  });
}
```

### 2. Context 传递方式
```typescript
// ❌ 错误：传递值
ThemeContext.provide(theme.get());

// ✅ 正确：传递 getter 函数
ThemeContext.provide(() => theme.get());
```

### 3. children() 用法
```typescript
// ❌ 错误：在 children 回调中获取信号
fdom.div({
  children() {
    const value = signal.get(); // 只获得初始值
    return fdom.span({ children: value });
  }
});

// ✅ 正确：在最终属性节点展开
fdom.div({
  children() {
    return fdom.span({
      childrenType: "text",
      children() { return signal.get(); } // 动态更新
    });
  }
});
```

## 🚀 最佳实践

1. **Signal 是原子的**：对象更新需整体替换
2. **Context 传递函数**：传递 `() => signal.get()` 而不是值
3. **属性转换规则**：`style.xxx` → `s_xxx`，`data-xxx` → `data_xxx`
4. **memo 有开销**：简单计算可以不使用
5. **addEffect level**：用户级别需要 > -1

## 📚 学习路径

**新手**: [入门指南](./guide/getting-started.md) → [核心概念](./guide/core-concepts.md) → [最佳实践](./guide/best-practices.md)

**迁移**: [迁移指南](./guide/migration-from-vue-react.md) → [API 对比表](./guide/api-comparison-table.md)

## ⚠️ 常见错误

### 1. Signal 原子性误解
```typescript
// ❌ 错误：尝试修改对象属性
const user = createSignal({ name: "张三", age: 25 });
user.get().age = 26; // 不会触发更新

// ✅ 正确：整体替换
user.set({ ...user.get(), age: 26 });
```

### 2. children() 回调中获取信号
```typescript
// ❌ 错误：在 children 回调中获取信号内容
fdom.div({
  children() {
    const value = signal.get(); // 错误位置
    fdom.span({ childrenType: "text", children: value });
  }
});

// ✅ 正确：在最终观察属性节点上展开
fdom.div({
  children() {
    fdom.span({
      childrenType: "text",
      children() { return signal.get(); } // 正确位置
    });
  }
});
```

### 3. Context 传递值而非函数
```typescript
// ❌ 错误：传递值
ThemeContext.provide(theme.get());

// ✅ 正确：传递 getter 函数
ThemeContext.provide(() => theme.get());
```

### 4. dom.xx API 用法错误
```typescript
// ❌ 错误
dom.div().className("container").onClick(handler).append(
  dom.p().text("内容")
);

// ✅ 正确
dom.div({
  className: 'container',
  onClick() { /* handler */ }
}).render(() => {
  dom.p().renderTextContent("内容");
});
```

MVE 框架的设计理念是简洁直接，基于 Signal 的细粒度响应式更新，为开发者提供高效的开发体验。