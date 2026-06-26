# Three DOM APIs

## zdom.x / zsvg.x — Future-proof (recommended)

Group related attributes in `attrs(m)` to reduce dependency tracking overhead:

```typescript
zdom.div({
  attrs(m) {
    if (isActive.get()) {
      m.className = 'status active'
      m.s_color = 'red'
      m.data_status = 'active'
    } else {
      m.className = 'status'
      m.s_color = 'blue'
      m.data_status = 'inactive'
    }
  },
  onClick(e) {},
  children() { /* same as fdom */ },
})
```

## fdom.x / fsvg.x — Flat props (performance-optimized)

Attribute naming conventions:

| Pattern | DOM Equivalent |
|---------|---------------|
| `s_backgroundColor` | `style.backgroundColor` |
| `css_primaryColor` | `--primaryColor` |
| `data_testId` | `data-testId` |
| `aria_label` | `aria-label` |

```typescript
fdom.div({
  className: 'container',
  s_color: 'red',
  s_backgroundColor() { return isActive.get() ? 'green' : 'blue' },
  data_testId: 'my-div',
  css_primaryColor: '#007bff',
  children() {
    fdom.span({ children: 'static text' })
    fdom.span({
      childrenType: 'text',
      children() { return `dynamic: ${content.get()}` },
    })
    fdom.span({
      childrenType: 'html',
      children() { return `<b>${content.get()}</b>` },
    })
  },
})
```

## dom.x / svg.x — Chained style (legacy, not recommended)

```typescript
dom.div({ className: 'container' }).render(() => {
  renderTextContent('abc')
  renderHtml`<b>html</b>`
})
```
