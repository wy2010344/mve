# CSS 过渡动画

使用 `hookTransition` 实现基于 CSS 的进入/退出动画,类似 vue 的`<transition>`与`<transition-group>`。

## 基础用法

```typescript
import { hookTransition } from 'mve-dom-helper'

function TransitionDemo() {
  const visible = createSignal(false)

  const transition = hookTransition(visible.get, (callback, show) => {
    setTimeout(callback, 300) // 动画时长
  })

  fdom.div({
    children() {
      fdom.button({
        onClick: () => visible.set(!visible.get()),
        children: () => (visible.get() ? '隐藏' : '显示'),
      })

      renderIf(
        () => transition.didShow(),
        () => {
          fdom.div({
            className: () => `modal ${transition.className('fade')}`,
            children: '模态框内容',
          })
        }
      )
    },
  })
}
```

## CSS 样式

```css
/* 淡入淡出 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 滑动 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

/* 缩放 */
.fade-zoom-enter-active,
.fade-zoom-leave-active {
  transition: all 0.3s ease;
}
.fade-zoom-enter-from,
.fade-zoom-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
```

## 弹窗组件示例

```typescript
function Popup({ visible, placement = 'center', onClose, children }) {
  const transition = hookTransition(visible, (callback, show) => {
    setTimeout(() => {
      callback()
      if (show) console.log('弹窗打开')
      else console.log('弹窗关闭')
    }, 300)
  })

  renderIf(
    () => transition.didShow(),
    () => {
      renderPortal(document.body, () => {
        fdom.div({
          className: () => `popup-overlay ${transition.className('fade')}`,
          onClick: onClose,
          children() {
            fdom.div({
              className: () => {
                const animClass =
                  placement === 'center'
                    ? transition.className('fade-zoom')
                    : transition.className(`slide-${placement}`)
                return `popup popup--${placement} ${animClass}`
              },
              onClick: (e) => e.stopPropagation(),
              children,
            })
          },
        })
      })
    }
  )
}
```

## API

```typescript
hookTransition(
  show: GetValue<boolean>,           // 显示状态
  beginChange: (callback, show) => void, // 动画回调
  set?: Set<Element>                 // 强制回流元素
)

// 返回值
{
  className(prefix: string): string, // 获取CSS类名
  didShow(): boolean | "active",     // 是否渲染
  set: Set<Element>                  // 回流元素集合
}
```

## 类名规则

- 进入: `${prefix}-enter-active ${prefix}-enter-from` → `${prefix}-enter-active ${prefix}-enter-to`
- 离开: `${prefix}-leave-active ${prefix}-leave-from` → `${prefix}-leave-active ${prefix}-leave-to`

## 最佳实践

- CSS 和 JS 动画时长保持一致
- 使用 `renderIf(() => transition.didShow())` 条件渲染
- 组件销毁时清理定时器
