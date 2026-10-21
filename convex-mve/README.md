# convex-mve

Convex 到 MVE 的桥接库：把 Convex 的 query / mutation / action 接入 MVE 的信号系统。

## 安装

```bash
npm install convex-mve convex
```

## 快速开始

### 1. 提供客户端

```ts
import { createRoot, fdom } from 'mve-dom'
import { ConvexClient } from 'convex/browser'
import { provideConvexClient } from 'convex-mve'

const client = new ConvexClient(import.meta.env.VITE_CONVEX_URL)

createRoot(document.body, function () {
  provideConvexClient(client)

  fdom.div({
    children() {
      App()
    },
  })
})
```

`provideConvexClient` 走 MVE 的 Context，必须在组件树内调用，否则立即抛错。`useConvexClient()` 在找不到 provider 时也会抛错。

### 2. 查询

```ts
import { fdom } from 'mve-dom'
import { hookConvexQuery } from 'convex-mve'
import { api } from '../convex/_generated/api'

function TodoList() {
  const getTodos = hookConvexQuery(api.todos.list)

  fdom.div({
    children() {
      const result = getTodos()

      if (!result) {
        fdom.p({ children: '加载中...' })
        return
      }

      if (result.type === 'error') {
        fdom.p({ s_color: 'red', children: `错误: ${result.value}` })
        return
      }

      fdom.ul({
        children() {
          for (const todo of result.value) {
            fdom.li({ children: todo.text })
          }
        },
      })
    },
  })
}
```

返回值是 `PromiseResult<D> | undefined`，不是 `{ data, isLoading, error }`：

```ts
type PromiseResult<T> =
  | { type: 'success'; promise: Promise<T>; value: T }
  | { type: 'error'; promise: Promise<T>; value: any }
```

`undefined` 表示首次结果尚未到达。

### 3. 动态参数

参数可以是 getter，参数变化时会自动重新订阅：

```ts
import { createSignal } from 'wy-helper'

const userId = createSignal('user123')

const getUser = hookConvexQuery(api.users.getById, () => ({
  userId: userId.get(),
}))
```

### 4. Mutation / Action

```ts
import { fdom } from 'mve-dom'
import { useConvexMutation } from 'convex-mve'

function CreateTodo() {
  const { mutate, get } = useConvexMutation(api.todos.create)

  fdom.button({
    onClick: async () => {
      try {
        await mutate({ text: '新的待办事项' })
      } catch (error) {
        console.error('创建失败:', error)
      }
    },
    childrenType: 'text',
    children() {
      const state = get()
      return state?.isPending ? '正在保存...' : '创建'
    },
  })
}
```

`useConvexAction` 用法相同，返回 `{ execute, get }`。mutation / action 的状态为：

```ts
interface ConvexMutationState<T> {
  data?: T
  isPending: boolean
  error?: Error | null
}
```

失败时 `mutate` / `execute` 会把错误记录到状态并重新抛出，调用方自行处理。

### 5. 自定义信号

`options.signal` 需要 `OneSetStoreRef`（只允许取一次 setter）。使用 `createLateSignal`：

```ts
import { createLateSignal, PromiseResult } from 'wy-helper'
import { hookConvexQuery } from 'convex-mve'

const signal = createLateSignal<PromiseResult<Todo[]> | undefined>(undefined)

const getTodos = hookConvexQuery(api.todos.list, undefined, { signal })
```

不要传 `createSignal(...)`：它的 `getOnlySet` 已被消耗，传入会抛错。

## API

| API | 说明 |
| --- | --- |
| `provideConvexClient(client)` | 在组件树中提供 `ConvexClient` |
| `useConvexClient()` | 读取当前 `ConvexClient` |
| `hookConvexQuery(query, args?, options?)` | 订阅 query，返回 `GetValue<PromiseResult<D> \| undefined>` |
| `useConvexMutation(mutation, options?)` | 返回 `{ mutate, get }` |
| `useConvexAction(action, options?)` | 返回 `{ execute, get }` |
| `ConvexHttpClient` | 从 `convex/browser` 透出 |

## License

MIT
