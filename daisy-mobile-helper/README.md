# daisy-mobile-helper

基于 DaisyUI 与 MVE 的移动端 UI 层。分为两组能力：

- `components/*` - 移动端场景封装：导航栏、Tab、页面切换、横向滑动、布局页、日历记录
- `window/*` - 带主题上下文的 UI 组件与移动端窗口/面板

## 安装

```bash
npm install daisy-mobile-helper mve-core mve-dom mve-dom-helper mve-helper wy-dom-helper wy-helper
```

同时需要 Tailwind CSS 与 DaisyUI：

```css
@import "tailwindcss";
@plugin "daisyui";
```

组件样式随包提供：

```ts
import 'daisy-mobile-helper/style.css'
```

## 示例

```ts
import 'daisy-mobile-helper/style.css'
import { createRoot, fdom } from 'mve-dom'
import { Button, Card, renderNavbar } from 'daisy-mobile-helper'

createRoot(document.body, function () {
  renderNavbar({ title: '我的应用', index: true })

  Card({
    title: '欢迎',
    subtitle: 'DaisyUI + MVE',
    children() {
      fdom.p({ children: '这是一个移动端卡片。' })
      Button({
        children: '开始',
        onClick() {
          console.log('clicked')
        },
      })
    },
  })
})
```

## 组件

### 基础组件（`window/themeContext`）

- 按钮：`Button`、`IconButton`
- 表单：`Input`、`Textarea`、`Select`、`Checkbox`、`Radio`、`FormGroup`
- 布局：`Container`、`Grid`、`Flex`、`Card`
- 反馈：`Notification`、`Badge`、`Alert`、`Progress`
- 其它：`Switch`、`Tag`、`Avatar`、`Rating`、`Skeleton`

### 场景封装（`components`）

- `button(props)` - 带 loading 状态的按钮（class 前缀 `daisy-btn`）
- `createTabList({ options, value, onChange, renderChild })` - Tab 列表
- `hookTabLayout` - Tab 切换位移动画
- `linkTab({ href, children })` - 与路由联动的 Tab
- `hookXScroll(div, tabs, get, set)` - 横向分页滑动
- `renderNavbar({ title, right, index })` - 顶部导航栏
- `hookPage(div, config)` / `hookTabPage` - 页面进出场动画
- `renderLayoutPage` / `renderMovePage` - 布局页与分页容器
- `dailyRecord(arg)` - 日历/每日记录视图
- `pluginLayoutIndex` / `hookTrackLayout` - 布局索引与追踪

### 窗口与面板（`window`）

- `panel` - 移动端面板（底部弹层/全屏页）
- `renderWindows` / `createWindow` - 窗口队列
- `hookTheme` / `hookRewriteTheme` - 主题 token 生成

## License

MIT
