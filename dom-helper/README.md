# mve-dom-helper

MVE 的浏览器场景工具集：表单绑定、存储信号、动画、路由、滚动、拖拽、Canvas 与移动端手势。

## 安装

```bash
npm install mve-dom-helper mve-core mve-dom mve-helper wy-dom-helper wy-helper
```

## 主入口

### 存储信号

把 `localStorage` / `sessionStorage` 包装为信号。同一个 `storage + key` 共享底层信号，因此同一标签页内各组件立即同步，跨标签页通过 `storage` 事件同步；没有 `localStorage` 的环境（Node / SSR）退化为内存信号。

```ts
import { fdom } from 'mve-dom'
import { hookStorageSignal } from 'mve-dom-helper'

const name = hookStorageSignal('name', '')

fdom.input({
  value: name.get,
  onInput(e) {
    name.set(e.currentTarget.value)
  },
})
```

### 表单绑定

```ts
import { fdom } from 'mve-dom'
import { renderInput } from 'mve-dom-helper'
import { createSignal } from 'wy-helper'

const text = createSignal('')

const input = fdom.input()
renderInput(text.get, text.set, input) // 自动处理输入/组合事件
```

- `renderInput` / `renderInputTrans` - input / textarea / select
- `renderInputBool` / `renderInputStrEnum` - 布尔、枚举值
- `renderContentEditable` / `renderContentEditableHtml` - contenteditable 绑定
- `useContentEditable` - 自定义 contenteditable 模型

### 按钮 loading

```ts
import { fdom } from 'mve-dom'
import { toButtonClick } from 'mve-dom-helper'

const { loading, onClick } = toButtonClick({
  onClick: async () => {
    await save()
  },
})

fdom.button({
  disabled: loading,
  onClick,
  childrenType: 'text',
  children() {
    return loading() ? '保存中...' : '保存'
  },
})
```

### 动画与过渡

- `hookAnimateSignal(getValue, config?)` - 把数值信号变成逐帧动画信号
- `hookTransition` - CSS 过渡
- `renderExitArrayClone` / `hookExitAnimate` - 离场动画
- `setLayoutIndex` - FLIP 布局动画
- `centerPicker` / `rangePicker` - 滚轮选择器

### 滚动与手势

- `OnScroll` / `measureMaxScroll` - 滚动状态与边界
- `hookLockScroll` - 锁定滚动
- `hookTouch` / `pluginTouchHover` - 移动端触摸与 hover
- `movePage` / `createSimpleMovePage` - 分页滑动
- `pointerDrag` / `hookAccept` / `simpleDragContainer` - 拖拽排序
- `moveEdgeScroll` - 拖到边缘自动滚动

### 其它

- `cns` - 条件类名拼接
- `fakeRoute` - 无路由环境下的占位
- `hookMeasureSize` - 尺寸测量
- `renderTNode` - 渲染文本/HTML/子节点
- `renderCodeChange` - 代码高亮更新
- `FC` - TSX 函数组件类型

## 子路径

### `mve-dom-helper/history`

```ts
import { createBrowserHistory } from 'history'
import { fdom, createRoot } from 'mve-dom'
import { routerProvide, routerConsume, fLink } from 'mve-dom-helper/history'

const history = createBrowserHistory()

createRoot(document.body, function () {
  routerProvide(history)

  fdom.div({
    children() {
      const { getHistoryState } = routerConsume()

      fLink({
        href: '/about',
        children() {
          return getHistoryState().pathname === '/about' ? '当前页' : '关于'
        },
      })
    },
  })
})
```

- `routerProvide(history)` - 提供路由上下文
- `routerConsume()` - 读取 `router` / `getHistoryState` / `backOrReplace` / `replaceAndFirstPush`
- `fLink(props)` - 使用 `history` 跳转的 `<a>`，支持 `replace`

### `mve-dom-helper/canvasRender`

基于 Canvas 的保留模式渲染器（CanvasKit）：

- `renderCanvas(canvas, args)` - 创建根渲染器，自动同步尺寸与事件
- `Renderer` / `RectNode` / `Node` / `ImageNode`
- `RichTextNode` / `WrappedTextNode` / `EditableTextNode`
- `Scroll` / `ScrollContent` / `SimpleScrollBar`
- `rgba` / `colorToCSS` / `UndoRedo` / `FlexLayout`

## License

MIT
