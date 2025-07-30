# API 对比表

快速查找 Vue/React API 在 MVE 中的对应实现。

## 🔄 响应式状态

| 功能 | Vue 3 | React | MVE |
|------|-------|-------|-----|
| 响应式状态 | `ref(0)` | `useState(0)` | `createSignal(0)` |
| 获取值 | `count.value` | `count` | `count.get()` |
| 设置值 | `count.value = 1` | `setCount(1)` | `count.set(1)` |
| 计算属性 | `computed(() => count.value * 2)` | `useMemo(() => count * 2, [count])` | `memo(() => count.get() * 2)` |

## 👀 监听和副作用

| 功能 | Vue 3 | React | MVE |
|------|-------|-------|-----|
| 监听变化 | `watchEffect(() => console.log(count.value))` | `useEffect(() => console.log(count), [count])` | `hookTrackSignal(() => count.get(), (v) => console.log(v))` |
| 副作用 | `nextTick(() => {})` | `useEffect(() => {})` | `addEffect(() => {})` |
| 清理资源 | `onUnmounted(() => {})` | `useEffect(() => () => {}, [])` | `hookDestroy(() => {})` |

## 🎨 渲染

| 功能 | Vue 3 | React | MVE |
|------|-------|-------|-----|
| 条件渲染 | `<div v-if="show">` | `{show && <div>}` | `renderIf(() => show.get(), () => fdom.div({}))` |
| 列表渲染 | `<li v-for="item in items" :key="item.id">` | `{items.map(item => <li key={item.id}>)}` | `renderArrayKey(() => items.get(), item => item.id, (getItem) => fdom.li({}))` |
| 动态类名 | `:class="{ active: isActive }"` | `className={isActive ? 'active' : ''}` | `className() { return isActive.get() ? 'active' : '' }` |
| 动态样式 | `:style="{ color: textColor }"` | `style={{ color: textColor }}` | `s_color() { return textColor.get() }` |

## 🎣 Hooks 对比

| 功能 | Vue 3 | React | MVE |
|------|-------|-------|-----|
| 状态 | `const count = ref(0)` | `const [count, setCount] = useState(0)` | `const count = createSignal(0)` |
| 计算 | `const doubled = computed(() => count.value * 2)` | `const doubled = useMemo(() => count * 2, [count])` | `const doubled = memo(() => count.get() * 2)` |
| 监听 | `watchEffect(() => {})` | `useEffect(() => {}, [deps])` | `hookTrackSignal(() => deps.get(), () => {})` |
| 引用 | `const el = ref(null)` | `const el = useRef(null)` | `const el = createSignal(null)` 或直接变量 |
| 回调 | 不需要 | `const fn = useCallback(() => {}, [deps])` | 直接函数（MVE 自动优化） |
| 上下文 | `inject('key')` | `useContext(Context)` | `Context.consume()` |

## 🏗️ 组件模式

### Vue 组件 → MVE 组件

```typescript
// Vue 3
export default {
  props: ['title', 'count'],
  emits: ['update'],
  setup(props, { emit }) {
    const localCount = ref(props.count);
    
    const increment = () => {
      localCount.value++;
      emit('update', localCount.value);
    };
    
    return { localCount, increment };
  },
  template: `
    <div>
      <h1>{{ title }}</h1>
      <p>{{ localCount }}</p>
      <button @click="increment">+</button>
    </div>
  `
};

// MVE
interface Props {
  title: string;
  count: number;
  onUpdate?: (count: number) => void;
}

function MyComponent({ title, count, onUpdate }: Props) {
  const localCount = createSignal(count);
  
  const increment = () => {
    const newCount = localCount.get() + 1;
    localCount.set(newCount);
    onUpdate?.(newCount);
  };
  
  fdom.div({
    children() {
      fdom.h1({
        childrenType: "text",
        children: title
      });
      
      fdom.p({
        childrenType: "text",
        children() {
          return localCount.get().toString();
        }
      });
      
      fdom.button({
        onClick: increment,
        childrenType: "text",
        children: "+"
      });
    }
  });
}
```

### React 组件 → MVE 组件

```typescript
// React
interface Props {
  title: string;
  count: number;
  onUpdate?: (count: number) => void;
}

function MyComponent({ title, count, onUpdate }: Props) {
  const [localCount, setLocalCount] = useState(count);
  
  const increment = useCallback(() => {
    const newCount = localCount + 1;
    setLocalCount(newCount);
    onUpdate?.(newCount);
  }, [localCount, onUpdate]);
  
  return (
    <div>
      <h1>{title}</h1>
      <p>{localCount}</p>
      <button onClick={increment}>+</button>
    </div>
  );
}

// MVE（与上面的 Vue 迁移版本相同）
function MyComponent({ title, count, onUpdate }: Props) {
  const localCount = createSignal(count);
  
  const increment = () => {
    const newCount = localCount.get() + 1;
    localCount.set(newCount);
    onUpdate?.(newCount);
  };
  
  // 渲染逻辑同上...
}
```

## 🔧 状态管理

### Vuex/Pinia → MVE

```typescript
// Pinia
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0);
  const doubled = computed(() => count.value * 2);
  
  function increment() {
    count.value++;
  }
  
  return { count, doubled, increment };
});

// MVE
const count = createSignal(0);
const doubled = memo(() => count.get() * 2);

function increment() {
  count.set(count.get() + 1);
}

export { count, doubled, increment };
```

### Redux → MVE

```typescript
// Redux
const initialState = { count: 0 };

function counterReducer(state = initialState, action) {
  switch (action.type) {
    case 'INCREMENT':
      return { count: state.count + 1 };
    default:
      return state;
  }
}

// MVE
const counterState = createSignal({ count: 0 });

function increment() {
  const current = counterState.get();
  counterState.set({ count: current.count + 1 });
}
```

## 🎯 事件处理

| 功能 | Vue 3 | React | MVE |
|------|-------|-------|-----|
| 点击事件 | `@click="handler"` | `onClick={handler}` | `onClick: handler` |
| 输入事件 | `@input="handler"` | `onInput={handler}` | `onInput: handler` |
| 表单提交 | `@submit="handler"` | `onSubmit={handler}` | `onSubmit: handler` |
| 键盘事件 | `@keydown="handler"` | `onKeyDown={handler}` | `onKeyDown: handler` |
| 鼠标事件 | `@mouseenter="handler"` | `onMouseEnter={handler}` | `onMouseEnter: handler` |

## 🔄 生命周期

| 功能 | Vue 3 | React | MVE |
|------|-------|-------|-----|
| 组件挂载 | `onMounted(() => {})` | `useEffect(() => {}, [])` | 组件函数执行时 |
| 组件更新 | `onUpdated(() => {})` | `useEffect(() => {})` | `addEffect(() => {})` |
| 组件卸载 | `onUnmounted(() => {})` | `useEffect(() => () => {}, [])` | `hookDestroy(() => {})` |
| 依赖更新 | `watch(dep, () => {})` | `useEffect(() => {}, [dep])` | `hookTrackSignal(() => dep.get(), () => {})` |

## 🌐 上下文/Context

```typescript
// Vue 3
// 提供
provide('theme', 'dark');

// 注入
const theme = inject('theme');

// React
const ThemeContext = createContext('light');

// 提供
<ThemeContext.Provider value="dark">

// 消费
const theme = useContext(ThemeContext);

// MVE
const ThemeContext = createContext('light');

// 提供
ThemeContext.provide('dark');

// 消费
const theme = ThemeContext.consume();
```

## 📝 表单处理

```typescript
// Vue 3
const form = reactive({
  name: '',
  email: ''
});

// React
const [form, setForm] = useState({
  name: '',
  email: ''
});

// MVE
const form = createSignal({
  name: '',
  email: ''
});

// 或者分别管理
const name = createSignal('');
const email = createSignal('');
```

## 🎨 样式绑定

```typescript
// Vue 3
<div 
  :class="{ active: isActive, disabled: isDisabled }"
  :style="{ color: textColor, fontSize: fontSize + 'px' }"
>

// React
<div 
  className={`${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
  style={{ color: textColor, fontSize: fontSize + 'px' }}
>

// MVE
fdom.div({
  className() {
    return [
      isActive.get() ? 'active' : '',
      isDisabled.get() ? 'disabled' : ''
    ].filter(Boolean).join(' ');
  },
  s_color() {
    return textColor.get();
  },
  s_fontSize() {
    return fontSize.get() + 'px';
  }
});
```

这个对比表应该能帮助你快速找到对应的 API，加速迁移过程。