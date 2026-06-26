# 动画

MVE 提供了三种动画方案，按需选择：

1. **信号值动画** — 对 Signal 数值做平滑过渡，用于驱动样式、位置等
2. **CSS 过渡动画** — 类似 Vue 的 `<Transition>`，控制元素的进入/离开
3. **视图切换动画** — 列表项进入/退出时的精细化动画控制

## 信号值动画

`wy-dom-helper` 提供了 `animateSignal`，对数值型 Signal 做平滑过渡：

```ts
import { animateSignal } from 'wy-dom-helper'

const scale = animateSignal(0)

// 匀速过渡
scale.animateTo(1, tween(200)) // 200ms

// 缓动曲线
scale.animateTo(1, tween(300, easeFns.circ))

// 弹簧动画
scale.animateTo(1, spring({
  omega0: 8,        // 角频率，默认 8
  zta: 0.4,         // 阻尼比: <1 欠阻尼(会回弹), >=1 临界/过阻尼
}))
```

驱动 DOM 元素：

```ts
fdom.div({
  s_transform() {
    return `scale(${scale.get()})`
  }
})
```

## CSS 过渡动画

使用 `hookTransition` 实现类似 Vue `<Transition>` 的进入/离开动画，详见 [CSS 过渡动画](./css-transition)。

## 视图切换动画

使用 `getExitAnimateArray` 控制列表项的进入/退出动画，详见 [视图切换动画](./exit-animation)。
