# convex-mve

Convex 到 MVE 的桥接库，提供 hooks 将 Convex 的异步操作与 MVE 的响应式信号系统集成。

## 功能

- **useConvexQuery**: 将 Convex query 转换为响应式 signal，支持自动重新获取
- **useConvexMutation**: 将 Convex mutation 转换为响应式操作
- **useConvexAction**: 将 Convex action 转换为响应式操作
- **Provider 模式**: 通过 Context 提供 ConvexHttpClient 给整个应用

## 安装

```bash
pnpm add convex-mve
```

## 快速开始

### 1. 设置 Provider

在应用的根部使用 `provideConvexClient` 提供 Convex 客户端：

```typescript
import { render } from 'mve-core'
import { fdom } from 'mve-dom'
import { ConvexHttpClient } from 'convex/browser'
import { provideConvexClient } from 'convex-mve'

const convex = new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL)

render(() => {
  provideConvexClient(convex)

  fdom.div({
    children() {
      App()
    },
  })
})
```

### 2. 使用 useConvexQuery

获取数据并自动重新获取：

```typescript
import { fdom } from 'mve-dom'
import { useConvexQuery } from 'convex-mve'
import { api } from '../convex/_generated/api'

function TodoList() {
  const getTodos = useConvexQuery(api.todos.list)

  fdom.div({
    children() {
      const result = getTodos()

      if (result?.isLoading) {
        fdom.p({ children: '加载中...' })
      } else if (result?.error) {
        fdom.p({
          s_color: 'red',
          children: `错误: ${result.error.message}`,
        })
      } else if (result?.data) {
        fdom.ul({
          children() {
            result.data.forEach((todo: any) => {
              fdom.li({
                children: todo.text,
              })
            })
          },
        })
      }
    },
  })
}
```

### 3. 使用动态查询参数

当查询参数改变时自动重新获取：

```typescript
import { createSignal } from 'wy-helper'
import { fdom } from 'mve-dom'
import { useConvexQuery } from 'convex-mve'
import { api } from '../convex/_generated/api'

function UserProfile() {
  const userId = createSignal('user123')

  const getUser = useConvexQuery(api.users.getById, () => ({
    userId: userId.get(),
  }))

  fdom.div({
    children() {
      const result = getUser()

      if (result?.data) {
        fdom.h1({ children: result.data.name })
      }
    },
  })
}
```

### 4. 使用 useConvexMutation

执行修改操作：

```typescript
import { fdom } from 'mve-dom'
import { useConvexMutation } from 'convex-mve'
import { api } from '../convex/_generated/api'

function CreateTodo() {
  const { mutate, get } = useConvexMutation(api.todos.create)

  fdom.div({
    children() {
      const state = get()

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
          return state?.isPending ? '正在保存...' : '创建'
        },
      })

      if (state?.error) {
        fdom.p({
          s_color: 'red',
          children: `错误: ${state.error.message}`,
        })
      }
    },
  })
}
```

### 5. 使用 useConvexAction

执行服务器端操作：

```typescript
import { fdom } from 'mve-dom'
import { useConvexAction } from 'convex-mve'
import { api } from '../convex/_generated/api'

function SendEmail() {
  const { execute, get } = useConvexAction(api.email.send)

  fdom.button({
    onClick: async () => {
      try {
        await execute({ to: 'user@example.com', subject: 'Hello' })
      } catch (error) {
        console.error('发送失败:', error)
      }
    },
    childrenType: 'text',
    children() {
      const state = get()
      return state?.isPending ? '发送中...' : '发送邮件'
    },
  })
}
```

## API 参考

### Types

#### `ConvexData<T>`

查询结果的状态对象：

```typescript
interface ConvexData<T> {
  data: T
  isLoading: boolean
  error?: Error | null
}
```

#### `ConvexMutationState<T>`

mutation/action 的状态对象：

```typescript
interface ConvexMutationState<T> {
  data?: T
  isPending: boolean
  error?: Error | null
}
```

### Functions

#### `provideConvexClient(client: ConvexHttpClient): ConvexHttpClient`

在 MVE 组件树中提供 Convex 客户端。必须在其他 hooks 之前调用。

```typescript
provideConvexClient(convex)
```

#### `useConvexClient(): ConvexHttpClient`

获取提供的 Convex 客户端。

```typescript
const client = useConvexClient()
```

#### `useConvexQuery<T, D>(query, args?, options?): () => ConvexData<D> | undefined`

执行 Convex query 并返回响应式 signal getter。

- `query`: Convex query 函数
- `args`: 查询参数（可选），可以是函数以支持动态参数
- `options.signal`: 自定义 signal（可选）

返回一个 getter 函数，调用它获取当前的 `ConvexData<D>` 值。

```typescript
const getTodos = useConvexQuery(api.todos.list)
const result = getTodos() // { data: [...], isLoading: false, error: null }
```

#### `useConvexMutation<T, D>(mutation, options?): { mutate: (args) => Promise<D>, get: () => ConvexMutationState<D> | undefined }`

执行 Convex mutation。

```typescript
const { mutate, get } = useConvexMutation(api.todos.create)
await mutate({ text: 'New todo' })
```

#### `useConvexAction<T, D>(action, options?): { execute: (args) => Promise<D>, get: () => ConvexMutationState<D> | undefined }`

执行 Convex action。

```typescript
const { execute, get } = useConvexAction(api.email.send)
await execute({ to: 'user@example.com' })
```

## 高级用法

### 自定义 Signal

传入自定义 signal 以获得更多控制：

```typescript
import { createSignal } from 'wy-helper'
import { useConvexQuery } from 'convex-mve'

const customSignal = createSignal<ConvexData<Todo[]> | undefined>(undefined)
const getTodos = useConvexQuery(api.todos.list, undefined, {
  signal: customSignal,
})
```

### 与其他 MVE 特性集成

由于返回的是标准的 MVE signal getter，可以与其他 MVE 特性无缝协作：

```typescript
import { renderIf, renderArrayKey } from 'mve-helper'

function TodoList() {
  const getTodos = useConvexQuery(api.todos.list)

  fdom.div({
    children() {
      renderIf(
        () => getTodos()?.isLoading,
        () => fdom.p({ children: '加载中...' }),
        () => {
          const result = getTodos()
          if (result?.data) {
            renderArrayKey(
              () => result.data,
              (todo) => todo.id,
              (getItem) => {
                fdom.li({
                  children() {
                    return getItem().text
                  },
                })
              }
            )
          }
        }
      )
    },
  })
}
```

## 最佳实践

1. **总是检查 isLoading 状态**: 在访问数据前检查加载状态
2. **处理错误**: 始终检查并处理可能的错误
3. **使用动态参数**: 对于依赖状态的查询，使用函数形式的参数
4. **避免重复调用 get()**: 在单个渲染函数中缓存结果

## 许可证

MIT
