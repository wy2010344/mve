# mve-helper

MVE 的场景化封装：列表/条件渲染、生命周期、Promise 信号、弹层、虚拟列表与简单路由。

## 安装

```bash
npm install mve-helper mve-core wy-helper
```

## 列表与条件渲染

```ts
import { fdom } from 'mve-dom'
import { renderArrayKey, renderIf } from 'mve-helper'
import { createSignal } from 'wy-helper'

const todos = createSignal([{ id: 1, text: '学习 MVE' }])
const isLoading = createSignal(false)

fdom.ul({
  children() {
    renderIf(
      isLoading.get,
      () => fdom.li({ children: '加载中...' }),
      () =>
        renderArrayKey(
          todos.get,
          todo => todo.id,
          (getTodo, getIndex) => {
            fdom.li({
              childrenType: 'text',
              children() {
                return `${getIndex() + 1}. ${getTodo().text}`
              },
            })
          }
        )
    )
  },
})
```

| API | 说明 |
| --- | --- |
| `renderArray(getList, render)` | 以数组值本身作为 key |
| `renderArrayKey(getList, getKey, render)` | 自定义 key，`render` 收到 `getValue` / `getIndex` / `key` |
| `renderArrayP(v, render)` | 同时支持静态数组与 getter |
| `renderRecord` / `renderMap` / `renderSet` | 遍历对象、Map、Set |
| `renderArrayToMap` / `renderArrayToArray` | 把动态列表映射为 Map / 数组 |
| `renderIf` / `renderIfP` | 条件渲染 |
| `renderOne` / `renderOneP` / `renderOneKey` / `renderOrKey` | 单值、联合类型渲染 |

## 生命周期与追踪

```ts
import { hookDestroy, hookTrackSignal, hookTrackSignalSkipFirst } from 'mve-helper'

function Timer() {
  const timer = setInterval(() => tick(), 1000)

  hookTrackSignal(
    () => count.get(),
    newValue => {
      console.log('count changed:', newValue)
    }
  )

  hookDestroy(() => {
    clearInterval(timer)
  })
}
```

- `hookTrackSignal(get, set?)` - 组件销毁时自动解除追踪
- `hookTrackSignalSkipFirst` - 跳过首次回调
- `hookDestroy(fn)` - 注册销毁回调
- `useVersion()` - 手动触发组件区域更新

## Promise 信号

```ts
import { hookPromiseSignal } from 'mve-helper'

const { get, loading } = hookPromiseSignal(() =>
  fetch('/api/todos').then(r => r.json())
)

get() // PromiseResult<T> | undefined
loading() // 是否仍在请求
```

- `hookPromiseSignal` - 跟踪 Promise 结果，组件销毁时中止
- `hookPromiseSignalLoadMore` - 分页加载
- `promiseSignal` - 非组件环境下的 Promise 信号

## 其它

- `createPop` / `renderPop` - 弹层队列
- `getExitAnimateArray` / `getExitAnimate` - 离场动画列表
- `renderFlyweight` - 轻量级渲染
- `getSubListInfo` - 虚拟列表区间计算
- `createTreeRoute` - 简单树形路由
- `fc` - 把普通函数适配为渲染回调

## License

MIT
