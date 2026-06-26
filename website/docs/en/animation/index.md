# Animation

MVE offers three animation approaches:

1. **Signal value animation** — smooth transitions on numeric Signals
2. **CSS transition animation** — enter/leave animations similar to Vue `<Transition>`
3. **View switch animation** — fine-grained list enter/exit control

## Signal Value Animation

```ts
import { animateSignal } from 'wy-dom-helper'

const scale = animateSignal(0)

// Tween animation
scale.animateTo(1, tween(200))                    // 200ms linear
scale.animateTo(1, tween(300, easeFns.circ))      // with easing

// Spring animation
scale.animateTo(1, spring({ omega0: 8, zta: 0.4 }))

// Use in DOM
fdom.div({
  s_transform() { return `scale(${scale.get()})` },
})
```

## CSS Transition

Use `hookTransition` for enter/leave animations. See [CSS Transition](./css-transition).

## View Switch

Use `getExitAnimateArray` for list item animations. See [Exit Animation](./exit-animation).
