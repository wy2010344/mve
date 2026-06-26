# 生命周期管理

MVE 组件的主函数只执行一次（不像 React 会反复 render），因此生命周期管理集中在**构造时注册**和**销毁时清理**。

## 构造与销毁

```typescript
function TimerComponent() {
  const time = createSignal(new Date().toLocaleTimeString())

  // 构造完成后执行（类似于 useLayoutEffect）
  addEffect(() => {
    // 全部 DOM 构造完成后执行
  })

  // 创建定时器
  const timer = setInterval(() => {
    time.set(new Date().toLocaleTimeString())
  }, 1000)

  // 注册清理函数（组件销毁时自动调用）
  hookDestroy(() => {
    clearInterval(timer)
    // 如果需要在销毁时更新 Signal，需放在 addEffect 中
    addEffect(() => {
      signal.set(value)
    })
  })

  fdom.div({
    children() {
      fdom.p({
        childrenType: 'text',
        children() {
          return `当前时间: ${time.get()}`
        },
      })
    },
  })
}
```

## 批量更新流程

```
事件触发信号更新
  │
  ├─ messageChannel 异步批量
  └─ batchSignalEnd 手动立即

进入批量执行：
  1. 执行受信号影响的监听（trackSignal）
     重复步骤 1 直到无新监听
  2. 执行新增的监听（递归处理）：
     a. 依赖的 memo 缓存被触发
        → 根据 memo 列表初始化或销毁组件
        → 将自身注入对应信号等待下次通知
  3. 执行 effect（按 level 排序）：
     - level -2: 更新 DOM 子结构
     - level -1: 更新 DOM 属性
     - level ≥0: 用户自定义副作用
  4. 检查是否有新的信号变更，如有则重复
```

`addEffect` 的 `level` 控制执行顺序：

| level | 用途 |
|-------|------|
| -2 | 框架内部：更新子节点结构 |
| -1 | 框架内部：更新 DOM 属性 |
| 0 | 默认级别 |
| >0 | 用户自定义（需在 DOM 更新后执行） |
