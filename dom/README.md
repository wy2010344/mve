# mve-dom

MVE 的直接 DOM 渲染层。没有虚拟 DOM，所有元素都通过原生 `document.createElement` 创建，再由信号驱动属性与子节点更新。

## 安装

```bash
npm install mve-dom mve-core mve-helper wy-dom-helper wy-helper
```

## 三套 DOM API

| 入口 | 风格 | 说明 |
| --- | --- | --- |
| `fdom` / `fsvg` | 扁平属性 | 属性直接展开，适合性能敏感场景 |
| `zdom` / `zsvg` | `attrs` 收敛 | 多个属性依赖同一信号时只建立一个追踪 |
| `dom` / `svg` | 链式调用 | 传统写法，返回可继续配置的 `NodeCreater` |

### 扁平属性映射

- `style.xxx` → `s_xxx`（如 `style.backgroundColor` → `s_backgroundColor`）
- CSS 变量 `--xxx` → `css_xxx`
- `data-xxx` → `data_xxx`
- `aria-xxx` → `aria_xxx`

普通属性、事件（`onClick`、`onInput` 等）与原生一致。任意属性值都可以传 getter，框架会自动建立依赖追踪。

## 示例

```ts
import { createRoot, fdom, fsvg } from 'mve-dom'
import { createSignal } from 'wy-helper'

const count = createSignal(0)

createRoot(document.body, function () {
  fdom.div({
    className: 'counter',
    s_backgroundColor: '#fff',
    children() {
      fdom.span({
        childrenType: 'text',
        children() {
          return `count: ${count.get()}`
        },
      })

      fdom.button({
        onClick() {
          count.set(count.get() + 1)
        },
        children: 'add',
      })

      fsvg.svg({
        width: 24,
        height: 24,
        viewBox: '0 0 24 24',
        children() {
          fsvg.path({ d: 'M4 4h16v16H4z' })
        },
      })
    },
  })
})
```

### 子节点写法

```ts
import { fdom } from 'mve-dom'
import { toText } from 'wy-dom-helper'

fdom.div({
  children() {
    // 静态文本
    fdom.span({ children: 'text' })

    // 动态文本
    fdom.span({ childrenType: 'text', children: () => `${count.get()}` })

    // 动态 HTML
    fdom.span({ childrenType: 'html', children: () => `<b>${count.get()}</b>` })

    // 用 toText / toHtml 模板标签（来自 wy-dom-helper）
    fdom.span({ children: toText`count = ${count.get}` })
  },
})
```

`children` 也可以是数组或函数。函数形式的 `children` 会在独立的 holder 中执行，可安全地创建动态子节点。

## API

- `fdom` / `fsvg` - 扁平属性创建元素
- `zdom` / `zsvg` - `attrs(m)` 收敛属性
- `dom` / `svg` - 链式创建器
- `renderFDom(type, props?)` / `renderFSvg(type, props?)` - 底层创建函数
- `createRoot(node, render)` - 在宿主节点上创建根，返回销毁函数
- `renderChildren(node, render)` - 为元素声明动态子区域
- `renderPortal(node, render)` - 把子节点渲染到元素之外
- `renderText` / `renderTextContent` / `renderHtml` / `renderHtmlContent` - 文本与 HTML 节点

## 说明

- 需要浏览器环境（依赖 `document`），不支持 SSR
- 组件函数只执行一次，动态更新由信号与 `addEffect` 驱动

## License

MIT
