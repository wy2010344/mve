# 🎨 渲染系统

## renderArrayKey - 列表渲染

最常用的列表渲染，自动管理 stateHolder 生命周期：

```typescript
const todos = createSignal([{ id: 1, text: '学习 MVE', completed: false }])

fdom.ul({
  children() {
    renderArrayKey(
      () => todos.get(), // 获取数组
      (todo) => todo.id, // 提取稳定的 key
      (getItem, getIndex, key) => {
        // 渲染每一项，getItem动态获取最新值,getIndex动态获得最新顺序坐标
        fdom.li({
          children() {
            fdom.span({
              childrenType: 'text',
              children() {
                const todo = getItem()
                return `${getIndex() + 1}. ${todo.text}`
              },
            })
          },
        })
      }
    )
  },
})
```

## 其他渲染函数

```typescript
// 条件渲染
renderIf(
  () => isLoading.get(),
  () => fdom.div({ children: '加载中...' }),
  () => fdom.div({ children: '加载完成' })
)

// 单值渲染
renderOne(
  () => currentView.get(),
  (view) => {
    switch (view) {
      case 'list':
        ListView()
        break
      case 'grid':
        GridView()
        break
    }
  }
)

// 联合类型渲染（常用于异步状态）
// 如getAsyncResult为()=>{type:'success',...}|{type:'error',....}|void
renderOneKey(getAsyncResult, 'type', (key, get) => {
  if (key === 'success') {
    //此时,get是()=>{type:'success',...}
    fdom.div({ children: '成功' })
  } else if (key === 'error') {
    //此时,get是()=>{type:'error',...}
    fdom.div({ children: '错误' })
  } else {
    //此时,key为never,get为()=>void
  }
})
```

## 扩展

所有的动态渲染都基于 renderForEach (来自包 mve-core)

```ts
renderForEach(
  function (callback) {
    callback(1, 'ABC')
    callback(2, 'BCD')
  },
  function (key, et) {
    //et.getIndex,et.getRow
  }
)
```
