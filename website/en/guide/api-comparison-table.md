# API Comparison Table

Quickly find the MVE equivalents for Vue/React APIs.

## 🔄 Reactive State

| Feature       | Vue 3                             | React                               | MVE                           |
| ---------- | --------------------------------- | ----------------------------------- | ----------------------------- |
| Reactive State | `shallowRef(0)`                   | `useState(0)`                       | `createSignal(0)`             |
| Get Value     | `count.value`                     | `count`                             | `count.get()`                 |
| Set Value     | `count.value = 1`                 | `setCount(1)`                       | `count.set(1)`                |
| Computed Property   | `computed(() => count.value * 2)` | `useMemo(() => count * 2, [count])` | `memo(() => count.get() * 2)` |

## 👀 Watching and Side Effects

| Feature     | Vue 3                                         | React                                          | MVE                                                         |
| -------- | --------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------- |
| Watch Changes | `watchEffect(() => console.log(count.value))` | `useEffect(() => console.log(count), [count])` | `hookTrackSignal(() => count.get(), (v) => console.log(v))` |
| Side Effects   | `nextTick(() => {})`                          | `useEffect(() => {})`                          | `addEffect(() => {})`                                       |
| Cleanup Resources | `onUnmounted(() => {})`                       | `useEffect(() => () => {}, [])`                | `hookDestroy(() => {})`                                     |

## 🎨 Rendering

| Feature     | Vue 3                                       | React                                     | MVE                                                                            |
| -------- | ------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------ |
| Conditional Rendering | `<div v-if="show">`                         | `{show && <div>}`                         | `renderIf(() => show.get(), () => fdom.div({}))`                               |
| List Rendering | `<li v-for="item in items" :key="item.id">` | `{items.map(item => <li key={item.id}>)}` | `renderArrayKey(() => items.get(), item => item.id, (getItem) => fdom.li({}))` |
| Dynamic Class Names | `:class="{ active: isActive }"`             | `className={isActive ? 'active' : ''}`    | `className() { return isActive.get() ? 'active' : '' }`                        |
| Dynamic Styles | `:style="{ color: textColor }"`             | `style={ { color: textColor }}`           | `s_color() { return textColor.get() }`                                         |

## 🎣 Hooks Comparison

| Feature   | Vue 3                                             | React                                               | MVE                                           |
| ------ | ------------------------------------------------- | --------------------------------------------------- | --------------------------------------------- |
| State   | `const count = ref(0)`                            | `const [count, setCount] = useState(0)`             | `const count = createSignal(0)`               |
| Computed   | `const doubled = computed(() => count.value * 2)` | `const doubled = useMemo(() => count * 2, [count])` | `const doubled = memo(() => count.get() * 2)` |
| Watch   | `watchEffect(() => {})`                           | `useEffect(() => {}, [deps])`                       | `hookTrackSignal(() => deps.get(), () => {})` |
| Reference   | `const el = ref(null)`                            | `const el = useRef(null)`                           | `const el = createSignal(null)` or direct variable    |
| Callback   | Not needed                                            | `const fn = useCallback(() => {}, [deps])`          | Direct function (MVE automatically optimizes)                      |
| Context | `inject('key')`                                   | `useContext(Context)`                               | `Context.consume()`                           |

## 🏗️ Component Patterns

### Vue Component → MVE Component

```typescript
// Vue 3
export default {
  props: ['title', 'count'],
  emits: ['update'],
  setup(props, { emit }) {
    const localCount = ref(props.count)

    const increment = () => {
      localCount.value++
      emit('update', localCount.value)
    }

    return { localCount, increment }
  },
  template: `
    <div>
      <h1>{{ title }}</h1>
      <p>{{ localCount }}</p>
      <button @click="increment">+</button>
    </div>
  `,
}
```

```typescript
// MVE
interface Props {
  title: string
  count: number
  onUpdate?: (count: number) => void
}

function MyComponent({ title, count, onUpdate }: Props) {
  const localCount = createSignal(count)

  const increment = () => {
    const newCount = localCount.get() + 1
    localCount.set(newCount)
    onUpdate?.(newCount)
  }

  fdom.div({
    children() {
      fdom.h1({
        children: title,
      })

      fdom.p({
        childrenType: 'text',
        children() {
          return localCount.get().toString()
        },
      })

      fdom.button({
        onClick: increment,
        children: '+',
      })
    },
  })
}
```