# mve-core

MVE（Model-View-Effect）的核心运行时：StateHolder 组件树、Context、动态列表与根渲染。

> 响应式能力（`createSignal`、`memo`、`addEffect`、`batchSignalEnd` 等）来自 `wy-helper`，本包不导出它们。

## 安装

```bash
npm install mve-core wy-helper
```

## 核心导出

| API | 说明 |
| --- | --- |
| `renderRoot(node, config, callback)` | 以 `node` 为根创建 StateHolder 树，返回 `{ target, destroy }` |
| `createContext(value)` | 创建 Context；`provide` 在组件树外调用会立即抛错 |
| `renderForEach(forEach, creater, arg?)` | 按 key 维护的动态列表 |
| `hookAddResult(node)` | 把渲染结果节点交给当前 holder |
| `hookCurrentStateHolder(orThrow?)` | 取当前 holder；传 `true` 时不在树内直接抛错 |
| `addTrackEffect` / `hookEffectCollect` / `hookTrackAttr` | 随组件自动销毁的依赖追踪副作用 |
| `createRenderChildren` | 构造渲染适配器（`mve-dom` 内部使用） |
| `purifyList` / `purifySet` | 拍平 `T \| (() => ...)` 嵌套列表 |

## 示例

```ts
import {
  createContext,
  purifyList,
  renderForEach,
  renderRoot,
} from 'mve-core'

const Theme = createContext<'light' | 'dark'>('light')

const root = renderRoot<Node, readonly Node[]>(
  document.body,
  {
    purifyList(list) {
      const out: Node[] = []
      purifyList(list, out, () => false)
      return out
    },
    after(nodes) {
      // 节点列表变化后的回调
    },
  },
  function () {
    Theme.provide('dark')

    renderForEach<number, number>(
      callback => {
        ;[1, 2, 3].forEach(n => callback(n, n))
      },
      (key, each) => {
        const theme = Theme.consume()
        return () => `${theme}-${each.getValue()}`
      },
      { bindValue: true }
    )
  }
)

root.target() // readonly Node[]
root.destroy()
```

`renderRoot` 只负责建立 holder 树并收集节点，节点如何挂载由适配器决定。DOM 场景直接使用 `mve-dom` 的 `createRoot`：

```ts
import { createRoot, fdom } from 'mve-dom'

createRoot(document.body, function () {
  fdom.div({ children: 'Hello MVE' })
})
```

## Context 语义

- `provide` 必须在组件树内调用，否则立即抛错（`hookCurrentStateHolder(true)`），不做静默降级
- `consume` 找不到 provider 时返回 `createContext` 的默认值
- `null`、`0`、`false` 都是合法的 provide 值，不会被当作“未提供”
- 同一层级有多个相同 Context 的 provider 时，`consume` 取最近的一个

## API 文档

- 在线文档：https://wy2010344.github.io/mve
- 仓库：https://github.com/wy2010344/mve

## License

MIT
