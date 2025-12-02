# API 对比表

快速查找 Vue/React API 在 MVE 中的对应实现。

## 🔄 响应式状态

| 功能       | Vue 3                             | React                               | MVE                           |
| ---------- | --------------------------------- | ----------------------------------- | ----------------------------- |
| 响应式状态 | `shallowRef(0)`                   | `useState(0)`                       | `createSignal(0)`             |
| 获取值     | `count.value`                     | `count`                             | `count.get()`                 |
| 设置值     | `count.value = 1`                 | `setCount(1)`                       | `count.set(1)`                |
| 计算属性   | `computed(() => count.value * 2)` | `useMemo(() => count * 2, [count])` | `memo(() => count.get() * 2)` |

## 👀 监听和副作用

| 功能     | Vue 3                                         | React                                          | MVE                                                         |
| -------- | --------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------- |
| 监听变化 | `watchEffect(() => console.log(count.value))` | `useEffect(() => console.log(count), [count])` | `hookTrackSignal(() => count.get(), (v) => console.log(v))` |
| 副作用   | `nextTick(() => {})`                          | `useEffect(() => {})`                          | `addEffect(() => {})`                                       |
| 清理资源 | `onUnmounted(() => {})`                       | `useEffect(() => () => {}, [])`                | `hookDestroy(() => {})`                                     |

## 🎨 渲染

| 功能     | Vue 3                                       | React                                     | MVE                                                                            |
| -------- | ------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------ |
| 条件渲染 | `<div v-if="show">`                         | `{show && <div>}`                         | `renderIf(() => show.get(), () => fdom.div({}))`                               |
| 列表渲染 | `<li v-for="item in items" :key="item.id">` | `{items.map(item => <li key={item.id}>)}` | `renderArrayKey(() => items.get(), item => item.id, (getItem) => fdom.li({}))` |
| 动态类名 | `:class="{ active: isActive }"`             | `className={isActive ? 'active' : ''}`    | `className() { return isActive.get() ? 'active' : '' }`                        |
| 动态样式 | `:style="{ color: textColor }"`             | `style={ { color: textColor }}`           | `s_color() { return textColor.get() }`                                         |

## 🎣 Hooks 对比

| 功能   | Vue 3                                             | React                                               | MVE                                           |
| ------ | ------------------------------------------------- | --------------------------------------------------- | --------------------------------------------- |
| 状态   | `const count = ref(0)`                            | `const [count, setCount] = useState(0)`             | `const count = createSignal(0)`               |
| 计算   | `const doubled = computed(() => count.value * 2)` | `const doubled = useMemo(() => count * 2, [count])` | `const doubled = memo(() => count.get() * 2)` |
| 监听   | `watchEffect(() => {})`                           | `useEffect(() => {}, [deps])`                       | `hookTrackSignal(() => deps.get(), () => {})` |
| 引用   | `const el = ref(null)`                            | `const el = useRef(null)`                           | `const el = createSignal(null)` 或直接变量    |
| 回调   | 不需要                                            | `const fn = useCallback(() => {}, [deps])`          | 直接函数（MVE 自动优化）                      |
| 上下文 | `inject('key')`                                   | `useContext(Context)`                               | `Context.consume()`                           |

## 🏗️ 组件模式

### Vue 组件 → MVE 组件

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
