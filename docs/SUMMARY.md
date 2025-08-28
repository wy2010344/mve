# MVE 框架总结

## 🎯 核心特性

### 响应式系统
- **createSignal**: 原子信号，类似 Vue shallowRef，可解包为 get/set
- **memo**: 智能计算属性，背后依赖 Map，简单计算可不使用
- **trackSignal/hookTrackSignal**: 依赖追踪，只有 newValue 参数
- **addEffect**: 类似 nextTick，支持 level 层级，常在 hookTrackSignal 回调中按需使用

### 渲染系统
- **renderArrayKey**: 列表渲染，自动管理 stateHolder 生命周期
- **renderIf**: 条件渲染
- **renderOne**: 单值渲染

### DOM API
- **dom.xx**: 链式调用风格
- **fdom.xx**: 扁平参数风格（推荐）
- **mdom.xx**: 减少重复依赖的优化风格

### 异步处理
- **hookPromiseSignal**: 异步状态管理，依赖变化时自动重新请求

## 🔄 与 Vue/React 对比

| 功能 | Vue 3 | React | MVE |
|------|-------|-------|-----|
| 状态 | `ref(0)` | `useState(0)` | `createSignal(0)` |
| 计算 | `computed(() => {})` | `useMemo(() => {}, [])` | `memo(() => {})` |
| 监听 | `watchEffect(() => {})` | `useEffect(() => {}, [])` | `hookTrackSignal(() => {}, () => {})` |
| 列表 | `v-for` | `map()` | `renderArrayKey()` |
| 条件 | `v-if` | `&&` | `renderIf()` |

## 🚀 最佳实践

1. **状态管理**: 直接使用 Signal，避免不必要的类封装
2. **原子信号**: createSignal 是原子的，对象更新需整体替换，可手动创建嵌套信号优化
3. **Context 传递**: 传递 getSignal 和 changeSignal 函数，不是值本身
4. **children() 用法**: 信号内容在最终观察属性节点上展开，不在 children 回调中获取
5. **样式属性**: 使用 `s_` 前缀，如 `s_color`, `s_backgroundColor`
6. **列表渲染**: 优先使用 `renderArrayKey` 提供稳定的 key
7. **生命周期**: 使用 `hookDestroy` 清理资源
8. **异步处理**: 使用 `hookPromiseSignal` 处理依赖变化的异步请求

## 📚 学习路径

1. **入门**: [getting-started.md](./guide/getting-started.md)
2. **迁移**: [migration-from-vue-react.md](./guide/migration-from-vue-react.md)
3. **核心**: [core-concepts.md](./guide/core-concepts.md)
4. **实践**: [best-practices.md](./guide/best-practices.md)

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