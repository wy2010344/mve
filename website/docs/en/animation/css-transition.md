# CSS Transition Animation

Use `hookTransition` for enter/leave animations, similar to Vue's `<Transition>`.

## Basic Usage

```typescript
const transition = hookTransition(visible.get, (callback, show) => {
  setTimeout(callback, 300)
})

renderIf(
  () => transition.didShow(),
  () => {
    fdom.div({
      className: () => `modal ${transition.className('fade')}`,
      children: 'Modal content',
    })
  }
)
```

## CSS Classes

```css
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to { opacity: 0; }
```

Class name pattern matches Vue's convention: `{prefix}-enter-from`, `{prefix}-enter-active`, `{prefix}-enter-to`, and `-leave-` equivalents.
