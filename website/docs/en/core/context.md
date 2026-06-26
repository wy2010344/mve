# Context System

Call-stack-based context passing, similar to React Context.

```typescript
import { createContext } from 'mve-core'
import { fdom } from 'mve-dom'
import { createSignal } from 'wy-helper'

type Theme = 'light' | 'dark'
const ThemeContext = createContext<{
  setTheme(v: Theme): void
  getTheme(): Theme
}>({
  getTheme() { return 'light' },
  setTheme(v) {},
})

function App() {
  const theme = createSignal<'light' | 'dark'>('light')
  ThemeContext.provide({
    getTheme: theme.get,
    setTheme: theme.set,
  })
  fdom.div({
    children() {
      Header() // can consume ThemeContext
    },
  })
}

function Header() {
  const { getTheme, setTheme } = ThemeContext.consume()

  fdom.header({
    s_backgroundColor() {
      return getTheme() === 'dark' ? '#333' : '#f8f9fa'
    },
  })
}
```

> Unlike React Context, MVE components construct only once. Pass getter functions (not static values) so consumers can read the latest value inside attribute functions.
