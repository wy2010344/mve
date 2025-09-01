# 🔧 生命周期管理

```typescript
function TimerComponent() {
  const time = createSignal(new Date().toLocaleTimeString())

  //主函数只执行一次,不像 react 在反复 render

  //如果需要在构造结束后执行,可以添加 addEffect
  addEffect(() => {
    //全部构造完成后执行
  })

  // 创建定时器
  const timer = setInterval(() => {
    time.set(new Date().toLocaleTimeString())
  }, 1000)

  // 注册清理函数
  hookDestroy(() => {
    clearInterval(timer)
    //如果此处要更新signal,亦需要在 addEffect 里去执行
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

## 过程

```
批量执行:
  1. 执行受信号影响的监听
    重复(a)
  2. 执行新增加的监听
    观察属性计算依赖了哪些信号(a)
      1. 依赖的 memo 缓存被触发
        根据memo列表,初始化构造组件与销毁组件(hookDestroy函数执行)
      2. 将自身注入相应的信号中,等待信号通知
  3. 执行effect
    1. 更新dom子成员结构(-2)
    2. 更新dom属性(-1)
    3. 其它副作用
检查是否重复执行执行

事件更新信号
  messageChannel
  batchSignalEnd
    批量执行
```
