# 🎨 渲染系统


## renderForEach

最基础的动态列表
```ts
import { renderForEach } from 'mve-core';
import { fdom } from 'mve-dom';
import { createSignal } from 'wy-helper';

const map = createSignal<Map<number, string>>(new Map());
renderForEach<number, string>(
  callback => {
    const m = map.get();
    m.forEach((key, value) => {
      callback(key, value);
    });
  },
  (key, et) => {
    fdom.div({
      children() {
        return `${key}--${et.getIndex()}--${et.getValue()}`;
      },
    });
  }
);
```

如上，以map.get()为信号，key取map的key，为number类型。值类型为string。

在渲染的时候（第二个回调函数），参数1为key，参数2有两个消息：getIndex与getValue。


如果非信号，直接用对应的js遍历方法就好。

```ts

const a=[1,2,3]
a.forEach(function(row,i){
  fdom.div({
    children:`${row}--${i}`
  })
})
```

一般不直接用这个方法，所以有以下一些常用封装方法

### renderArrayKey - 列表渲染

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

### 条件渲染

```typescript
renderIf(
  () => isLoading.get(),
  () => fdom.div({ children: '加载中...' }),
  () => fdom.div({ children: '加载完成' })
)
```

### 单值渲染

返回值充当key
```ts
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
```



### 联合类型渲染

比如（用于异步状态）
```ts
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


### renderArray

遍历数组，自动处理 key（使用值本身作为 key）

```ts
const items = createSignal([1, 2, 3, 4, 5])

fdom.ul({
  children() {
    renderArray(
      () => items.get(),
      (value, getIndex) => {
        // value 是数组项的值，getIndex 动态获取索引
        fdom.li({
          children() {
            return `Item ${value} at index ${getIndex()}`
          },
        })
      }
    )
  },
})
```

### renderArrayP

支持静态或动态数组的渲染（P 代表 Polymorphic）

```ts
// 可以传入静态数组
renderArrayP([1, 2, 3], (value, getIndex) => {
  fdom.div({ children: `${value}` })
})

// 也可以传入信号
renderArrayP(
  () => items.get(),
  (value, getIndex) => {
    fdom.div({ children: `${value}` })
  }
)
```

### renderRecord

遍历对象的键值对

```ts
const userInfo = createSignal({
  name: '张三',
  age: 25,
  email: 'zhangsan@example.com',
})

fdom.dl({
  children() {
    renderRecord(
      () => userInfo.get(),
      (key, getItem, getIndex) => {
        // key 是对象的键，getItem 动态获取值，getIndex 获取索引
        fdom.dt({ children: key })
        fdom.dd({
          children() {
            return String(getItem())
          },
        })
      }
    )
  },
})
```

### renderMap

遍历 Map 数据结构

```ts
const userMap = createSignal(
  new Map([
    [1, { name: '张三', role: 'admin' }],
    [2, { name: '李四', role: 'user' }],
  ])
)

fdom.ul({
  children() {
    renderMap(
      () => userMap.get(),
      (key, getItem, getIndex) => {
        // key 是 Map 的键，getItem 动态获取值，getIndex 获取索引
        fdom.li({
          children() {
            const item = getItem()
            return `${key}: ${item.name} (${item.role})`
          },
        })
      }
    )
  },
})
```

### renderSet

遍历 Set 数据结构

```ts
const tags = createSignal(new Set(['JavaScript', 'TypeScript', 'React']))

fdom.div({
  children() {
    renderSet(
      () => tags.get(),
      (item, getIndex) => {
        // item 是 Set 中的值，getIndex 获取索引
        fdom.span({
          children() {
            return `#${item} `
          },
        })
      }
    )
  },
})
```

## 高级渲染工具

### renderArrayToMap

将数组渲染为 Map 结构，返回一个获取 Map 的函数

```ts
const users = createSignal([
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
])

const getUserMap = renderArrayToMap(
  () => users.get(),
  (key, et) => {
    // 返回每项的渲染结果
    return () => `User: ${et.getValue().name}`
  },
  (user) => user.id // 提取 key
)

// 使用
const map = getUserMap()
map.forEach((getUser, id) => {
  console.log(id, getUser())
})
```

### renderArrayToArray

将数组转换为另一个数组，每项都是响应式的

```ts
const numbers = createSignal([1, 2, 3, 4, 5])

const getSquares = renderArrayToArray(
  () => numbers.get(),
  (num, getIndex) => {
    // 返回转换后的值
    return num * num
  }
)

// 使用
fdom.div({
  children() {
    return getSquares().join(', ') // "1, 4, 9, 16, 25"
  },
})
```

### renderIfP / renderOneP

支持静态或动态值的多态版本

```ts
// renderIfP - 可以传入静态值或信号
renderIfP(
  true, // 静态值
  () => fdom.div({ children: '显示' })
)

renderIfP(
  () => isVisible.get(), // 信号
  () => fdom.div({ children: '显示' })
)

// renderOneP - 可以传入静态值或信号
renderOneP('home', (view) => {
  fdom.div({ children: `当前视图: ${view}` })
})

renderOneP(
  () => currentView.get(),
  (view) => {
    fdom.div({ children: `当前视图: ${view}` })
  }
)
```

### renderOrKey

根据对象的某个键进行条件渲染，支持 undefined 情况

```ts
type AsyncResult =
  | { status: 'success'; data: string }
  | { status: 'error'; message: string }
  | undefined

const result = createSignal<AsyncResult>(undefined)

renderOrKey(
  () => result.get(),
  'status',
  (status, getResult) => {
    if (status === 'success') {
      const data = getResult()
      fdom.div({ children: () => `成功: ${data.data}` })
    } else if (status === 'error') {
      const error = getResult()
      fdom.div({ children: () => `错误: ${error.message}` })
    } else {
      // status 为 undefined
      fdom.div({ children: '加载中...' })
    }
  }
)
```

## 性能优化工具

### memoArray

缓存数组，只有当数组内容真正变化时才更新

```ts
const items = createSignal([1, 2, 3])

// 即使 items 引用变化，只要内容相同就不会触发更新
const memoedItems = memoArray(() => items.get())

// 自定义相等性比较
const users = createSignal([{ id: 1, name: '张三' }])
const memoedUsers = memoArray(
  () => users.get(),
  (a, b) => a.id === b.id // 按 id 比较
)
```

### memoEqual

使用自定义相等性函数进行缓存

```ts
const user = createSignal({ name: '张三', age: 25 })

// 只有 name 变化时才更新
const memoedUser = memoEqual(
  () => user.get(),
  (a, b) => a.name === b.name
)
```

### memoEqualDep

基于依赖项进行缓存（类似 React 的 useMemo）

```ts
const user = createSignal({ name: '张三', age: 25, email: 'test@example.com' })

// 只有 name 和 age 变化时才更新
const memoedUser = memoEqualDep(
  () => user.get(),
  (u) => [u.name, u.age] // 依赖项
)
```

### memoMapArray

映射数组并缓存结果，避免重复计算

```ts
const users = createSignal([
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
])

// 将用户对象映射为格式化字符串，并缓存结果
const formattedUsers = memoMapArray(
  () => users.get(),
  (user) => `${user.id}: ${user.name}`, // 映射函数
  (a, b) => a.id === b.id // 判断是否为同一项
)

fdom.ul({
  children() {
    formattedUsers().forEach((text) => {
      fdom.li({ children: text })
    })
  },
})
```