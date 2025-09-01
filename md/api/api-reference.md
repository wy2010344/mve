# API 参考

本文档提供了 MVE 框架所有 API 的详细参考。

## wy-helper

### createSignal

创建一个响应式信号。

```typescript
function createSignal<T>(initialValue: T): Signal<T>

interface Signal<T> {
  get(): T
  set(value: T): void
}
```

**参数：**
- `initialValue: T` - 信号的初始值

**返回值：**
- `Signal<T>` - 包含 `get()` 和 `set()` 方法的信号对象

**示例：**
```typescript
const count = createSignal(0);
const message = createSignal("Hello");
const user = createSignal<User | null>(null);

// 读取值
console.log(count.get()); // 0

// 设置值
count.set(10);
message.set("World");
user.set({ id: 1, name: "张三" });
```

### memo

创建一个计算属性，只有当依赖发生变化时才重新计算。

```typescript
function memo<T>(fn: () => T): () => T
```

**参数：**
- `fn: () => T` - 计算函数，会自动追踪其中访问的 Signal

**返回值：**
- `() => T` - 返回计算结果的函数

**示例：**
```typescript
const firstName = createSignal("张");
const lastName = createSignal("三");

const fullName = memo(() => {
  return `${firstName.get()}${lastName.get()}`;
});

console.log(fullName()); // "张三"
firstName.set("李");
console.log(fullName()); // "李三"
```

### batchSignalEnd

手动触发批量更新结束。通常不需要手动调用，框架会自动处理。

```typescript
function batchSignalEnd(): void
```

**示例：**
```typescript
// 这些更新会被自动批量处理
count1.set(1);
count2.set(2);
count3.set(3);

// 手动触发批量更新结束（通常不需要）
batchSignalEnd();
```

### addLevelEffect

在信号更新完成后执行副作用。

```typescript
function addLevelEffect(fn: () => void): void
```

**参数：**
- `fn: () => void` - 要执行的副作用函数

**示例：**
```typescript
const count = createSignal(0);

addLevelEffect(() => {
  console.log("信号更新完成，当前值:", count.get());
});

count.set(1); // 会触发副作用
```

## mve-core

### render

创建一个渲染上下文并执行渲染函数。

```typescript
function render(create: () => void): () => void
```

**参数：**
- `create: () => void` - 渲染函数

**返回值：**
- `() => void` - 销毁函数，调用时会清理所有相关资源

**示例：**
```typescript
const destroy = render(() => {
  const count = createSignal(0);
  
  fdom.div({
    children() {
      fdom.p({
        childrenType: "text",
        children() {
          return `计数: ${count.get()}`;
        }
      });
    }
  });
});

// 清理资源
destroy();
```

### renderForEach

渲染动态列表的核心函数。这是 `renderArray` 等函数的底层实现。

```typescript
//T 每一个列表Item
//K 用来对比相等性的key
//O 如果creater有返回值,forEach里调用callback执行会获得获取它的信号,自行组织到外部的映射(一般不考虑)
function renderForEach<T, K, O>(
  forEach: (callback: (key: K, value: T) => () => O) => void,
  creater: (key: K, eachTime: EachTime<T>) => O,
  arg?: RenderForEachArg
): () => Map<K, EachValue<T, K, O>[]>

interface EachTime<T> {
  getIndex(): number
  getValue(): T
}

interface RenderForEachArg {
  bindIndex?: boolean
  bindValue?: boolean
  bindOut?: boolean
  createMap?: <K, V>() => Map<K, V>
}
```

**参数：**
- `forEach` - 遍历函数
- `creater` - 创建每个项目的函数
- `arg` - 可选配置参数

### createContext

创建一个上下文对象，用于跨组件传递数据。

```typescript
function createContext<T>(defaultValue: T): Context<T>

interface Context<T> {
  provide(value: T): T
  consume(): T
}
```

**参数：**
- `defaultValue: T` - 默认值

**返回值：**
- `Context<T>` - 上下文对象

**示例：**
```typescript
const ThemeContext = createContext("light");

// 在父组件中提供值
function App() {
  fdom.div({
    children() {
      ThemeContext.provide("dark");
      ChildComponent();
    }
  });
}

// 在子组件中消费值
function ChildComponent() {
  const theme = ThemeContext.consume(); // "dark"
  
  fdom.div({
    style() {
      return {
        backgroundColor: theme === "dark" ? "#333" : "#fff"
      };
    }
  });
}
```

### hookDestroy

注册组件销毁时的清理函数。

```typescript
function hookDestroy(fn: () => void): void
```

**参数：**
- `fn: () => void` - 清理函数

**示例：**
```typescript
function TimerComponent() {
  const timer = setInterval(() => {
    console.log("tick");
  }, 1000);
  
  // 组件销毁时清理定时器
  hookDestroy(() => {
    clearInterval(timer);
  });
}
```

### hookIsDestroyed

检查当前组件是否已被销毁。

```typescript
function hookIsDestroyed(): boolean
```

**返回值：**
- `boolean` - 如果组件已销毁返回 `true`

**示例：**
```typescript
async function loadData() {
  const response = await fetch("/api/data");
  
  // 检查组件是否已被销毁
  if (hookIsDestroyed()) {
    console.log("组件已销毁，取消数据更新");
    return;
  }
  
  const data = await response.json();
  dataSignal.set(data);
}
```

### hookCurrentStateHolder

获取当前的状态持有者。这是一个底层 API，通常不需要直接使用。

```typescript
function hookCurrentStateHolder(): StateHolder | null
```

### runGlobalHolder

在全局状态持有者中执行函数。

```typescript
function runGlobalHolder(fn: () => void): void
```

### destroyGlobalHolder

销毁全局状态持有者。通常在应用关闭时调用。

```typescript
function destroyGlobalHolder(): void
```

**示例：**
```typescript
window.addEventListener("unload", () => {
  destroyGlobalHolder();
});
```

## mve-helper

### renderArray

渲染数组列表，自动处理增删改操作。

```typescript
function renderArray<T>(
  getVs: () => ReadonlyArray<T>,
  render: (value: T, getIndex: () => number) => void,
  createMap?: <V>() => Map<any, V>
): void
```

**参数：**
- `getVs: () => ReadonlyArray<T>` - 获取数组的函数
- `render: (value: T, getIndex: () => number) => void` - 渲染每个项目的函数
- `createMap?: <V>() => Map<any, V>` - 可选的 Map 创建函数

**示例：**
```typescript
const items = createSignal([1, 2, 3]);

fdom.ul({
  children() {
    renderArray(items.get, (item, getIndex) => {
      fdom.li({
        childrenType: "text",
        children() {
          return `${getIndex() + 1}. ${item}`;
        }
      });
    });
  }
});
```

### renderArrayKey

使用自定义键渲染数组，提供更好的性能优化。

```typescript
function renderArrayKey<T, K>(
  getVs: () => ReadonlyArray<T>,
  getKey: (v: T, i: number) => K,
  render: (getValue: () => T, getIndex: () => number, key: K) => void,
  createMap?: <K, V>() => Map<K, V>
): void
```

**参数：**
- `getVs: () => ReadonlyArray<T>` - 获取数组的函数
- `getKey: (v: T, i: number) => K` - 获取每个项目键的函数
- `render: (getValue: () => T, getIndex: () => number, key: K) => void` - 渲染函数
- `createMap?: <K, V>() => Map<K, V>` - 可选的 Map 创建函数

**示例：**
```typescript
const todos = createSignal([
  { id: 1, text: "任务1" },
  { id: 2, text: "任务2" }
]);

fdom.ul({
  children() {
    renderArrayKey(
      todos.get,
      (todo) => todo.id, // 使用 id 作为键
      (getTodo, getIndex, key) => {
        fdom.li({
          children() {
            const todo = getTodo();
            fdom.span({
              childrenType: "text",
              children: todo.text
            });
          }
        });
      }
    );
  }
});
```

### renderIf

条件渲染。

```typescript
function renderIf(
  get: () => any,
  whenTrue: () => void,
  whenFalse?: () => void
): void
```

**参数：**
- `get: () => any` - 条件判断函数
- `whenTrue: () => void` - 条件为真时的渲染函数
- `whenFalse?: () => void` - 条件为假时的渲染函数（可选）

**示例：**
```typescript
const isVisible = createSignal(true);

renderIf(
  isVisible.get,
  () => {
    fdom.div({
      childrenType: "text",
      children: "可见内容"
    });
  },
  () => {
    fdom.div({
      childrenType: "text",
      children: "隐藏内容"
    });
  }
);
```

### renderOne

渲染单个动态值，当值变化时重新渲染。

```typescript
function renderOne<K>(
  get: () => K,
  render: (v: K) => void
): void
```

**参数：**
- `get: () => K` - 获取值的函数
- `render: (v: K) => void` - 渲染函数

**示例：**
```typescript
const currentPage = createSignal("home");

renderOne(currentPage.get, (page) => {
  switch (page) {
    case "home":
      HomePage();
      break;
    case "about":
      AboutPage();
      break;
    default:
      NotFoundPage();
  }
});
```

### renderOneKey

使用键渲染单个值，提供更好的性能优化。

```typescript
function renderOneKey<T, K>(
  get: () => T,
  getKey: (v: T) => K,
  render: (key: K, get: () => T) => void
): void
```

### memoArray

缓存数组，只有当数组内容发生变化时才更新。

```typescript
function memoArray<T, VS extends ReadonlyArray<T>>(
  getVs: () => VS,
  equal?: (a: T, b: T) => boolean
): () => VS
```

**参数：**
- `getVs: () => VS` - 获取数组的函数
- `equal?: (a: T, b: T) => boolean` - 可选的比较函数

**示例：**
```typescript
const rawItems = createSignal([
  { id: 1, name: "项目1" },
  { id: 2, name: "项目2" }
]);

const cachedItems = memoArray(
  rawItems.get,
  (a, b) => a.id === b.id && a.name === b.name
);
```

### memoEqual

使用自定义比较函数的缓存。

```typescript
function memoEqual<T>(
  get: () => T,
  equal: (a: T, b: T) => boolean
): () => T
```

### hookPromiseSignal

处理异步数据的高级工具。

```typescript
function hookPromiseSignal<T>(
  getPromiseCreator: () => (() => Promise<T>) | false
): {
  get(): { type: "success"; value: T } | { type: "error"; value: Error } | null
  loading(): boolean
}
```

**参数：**
- `getPromiseCreator: () => (() => Promise<T>) | false` - 返回 Promise 创建函数或 false

**返回值：**
- 包含 `get()` 和 `loading()` 方法的对象

**示例：**
```typescript
const userId = createSignal(1);

const userSignal = hookPromiseSignal(() => {
  const id = userId.get();
  if (id > 0) {
    return () => fetch(`/api/users/${id}`).then(res => res.json());
  }
  return false;
});

// 使用
renderIf(
  () => userSignal.loading(),
  () => {
    fdom.div({ childrenType: "text", children: "加载中..." });
  },
  () => {
    const result = userSignal.get();
    if (result?.type === "success") {
      fdom.div({
        childrenType: "text",
        children: `用户: ${result.value.name}`
      });
    } else if (result?.type === "error") {
      fdom.div({
        style: { color: "red" },
        childrenType: "text",
        children: `错误: ${result.value.message}`
      });
    }
  }
);
```

## mve-dom

### createRoot

创建应用根节点。

```typescript
function createRoot(node: Node, create: () => void): () => void
```

**参数：**
- `node: Node` - 挂载的 DOM 节点
- `create: () => void` - 应用创建函数

**返回值：**
- `() => void` - 销毁函数

**示例：**
```typescript
const app = document.querySelector("#app")!;

const destroy = createRoot(app, () => {
  App();
});

// 清理
window.addEventListener("unload", destroy);
```

### fdom

函数式 DOM 创建器，支持所有 HTML 元素。

```typescript
const fdom: {
  readonly [K in keyof HTMLElementTagNameMap]: (
    props?: FDomAttributes<K>
  ) => HTMLElementTagNameMap[K]
}
```

**示例：**
```typescript
// 创建各种元素
fdom.div({
  className: "container",
  children() {
    fdom.h1({
      childrenType: "text",
      children: "标题"
    });
    
    fdom.p({
      childrenType: "text",
      children: "段落"
    });
    
    fdom.button({
      onClick() {
        console.log("点击");
      },
      childrenType: "text",
      children: "按钮"
    });
    
    fdom.input({
      type: "text",
      placeholder: "输入框",
      onInput(e) {
        console.log((e.target as HTMLInputElement).value);
      }
    });
  }
});
```

### fsvg

函数式 SVG 创建器，支持所有 SVG 元素。

```typescript
const fsvg: {
  readonly [K in keyof SVGElementTagNameMap]: (
    props?: FSvgAttributes<K>
  ) => SVGElementTagNameMap[K]
}
```

**示例：**
```typescript
fsvg.svg({
  width: "100",
  height: "100",
  viewBox: "0 0 100 100",
  children() {
    fsvg.circle({
      cx: "50",
      cy: "50",
      r: "40",
      fill: "blue",
      stroke: "black",
      strokeWidth: "2"
    });
    
    fsvg.rect({
      x: "10",
      y: "10",
      width: "30",
      height: "30",
      fill: "red"
    });
  }
});
```

### renderTextContent

渲染文本内容。

```typescript
function renderTextContent(
  value: string | number | (() => string | number)
): Text
```

**参数：**
- `value` - 文本内容或返回文本内容的函数

**返回值：**
- `Text` - 文本节点

### renderText

使用模板字符串渲染文本。

```typescript
function renderText(
  ts: TemplateStringsArray,
  ...vs: (string | number | (() => string | number))[]
): Text
```

## DOM 属性接口

### FDomAttributes

DOM 元素的属性接口，支持所有标准 HTML 属性和事件。

```typescript
interface FDomAttributes<T extends keyof HTMLElementTagNameMap> {
  // 标准 HTML 属性（可以是静态值或响应式函数）
  className?: string | (() => string)
  id?: string | (() => string)
  style?: Partial<CSSStyleDeclaration> | (() => Partial<CSSStyleDeclaration>)
  title?: string | (() => string)
  
  // 表单属性
  value?: string | (() => string)
  checked?: boolean | (() => boolean)
  disabled?: boolean | (() => boolean)
  placeholder?: string | (() => string)
  required?: boolean | (() => boolean)
  
  // 事件处理器
  onClick?: (event: MouseEvent) => void
  onInput?: (event: InputEvent) => void
  onChange?: (event: Event) => void
  onSubmit?: (event: SubmitEvent) => void
  onKeyDown?: (event: KeyboardEvent) => void
  onKeyUp?: (event: KeyboardEvent) => void
  onMouseEnter?: (event: MouseEvent) => void
  onMouseLeave?: (event: MouseEvent) => void
  onMouseMove?: (event: MouseEvent) => void
  onFocus?: (event: FocusEvent) => void
  onBlur?: (event: FocusEvent) => void
  onScroll?: (event: Event) => void
  onResize?: (event: Event) => void
  
  // 子元素
  children?: () => void
  childrenType?: "text" | "html"
  
  // 生命周期和插件
  plugins?: ((element: HTMLElementTagNameMap[T]) => void)[]
  willRemove?: (element: HTMLElementTagNameMap[T]) => void
  
  // 其他所有标准 HTML 属性...
}
```

### 响应式属性

所有属性都可以是静态值或返回值的函数：

```typescript
const isActive = createSignal(false);
const theme = createSignal("light");

fdom.div({
  // 静态属性
  className: "container",
  
  // 响应式属性
  id() {
    return `container-${theme.get()}`;
  },
  
  style() {
    return {
      backgroundColor: theme.get() === "dark" ? "#333" : "#fff",
      color: theme.get() === "dark" ? "white" : "black",
      padding: "20px"
    };
  },
  
  // 响应式类名
  className() {
    return `container ${isActive.get() ? "active" : "inactive"}`;
  }
});
```

### 子元素渲染

```typescript
// 文本子元素
fdom.div({
  childrenType: "text",
  children: "静态文本"
});

fdom.div({
  childrenType: "text",
  children() {
    return `动态文本: ${count.get()}`;
  }
});

// HTML 子元素
fdom.div({
  childrenType: "html",
  children() {
    return `<strong>粗体文本</strong>: ${message.get()}`;
  }
});

// DOM 子元素（默认）
fdom.div({
  children() {
    fdom.p({
      childrenType: "text",
      children: "段落内容"
    });
    
    fdom.button({
      childrenType: "text",
      children: "按钮"
    });
  }
});
```

## 类型定义

### Signal

```typescript
interface Signal<T> {
  get(): T
  set(value: T): void
}
```

### Context

```typescript
interface Context<T> {
  provide(value: T): T
  consume(): T
}
```

### EachTime

```typescript
interface EachTime<T> {
  getIndex(): number
  getValue(): T
}
```

### 工具类型

```typescript
type GetValue<T> = () => T
type EmptyFun = () => void
type ValueOrGet<T> = T | (() => T)
type ReadArray<T> = readonly T[]

type OrFun<T> = {
  [K in keyof T]?: T[K] | (() => T[K])
}
```

## 错误处理

### 常见错误

1. **在 StateHolder 外使用渲染函数**
   ```
   Error: 需要在stateHolder里面
   ```
   **解决方案：** 确保在 `render()` 或 `createRoot()` 内部使用渲染函数。

2. **重复的 key**
   ```
   Warning: 重复的key [key] 出现第[n]次
   ```
   **解决方案：** 确保在 `renderArray` 中每个项目都有唯一的键。

3. **组件已销毁后的状态更新**
   **解决方案：** 使用 `hookIsDestroyed()` 检查组件状态：
   ```typescript
   if (!hookIsDestroyed()) {
     signal.set(newValue);
   }
   ```

### 调试技巧

1. **Signal 调试**
   ```typescript
   const count = createSignal(0);
   
   if (process.env.NODE_ENV === "development") {
     const originalSet = count.set;
     count.set = function(value) {
       console.log(`count: ${count.get()} -> ${value}`);
       return originalSet.call(this, value);
     };
   }
   ```

2. **渲染调试**
   ```typescript
   function MyComponent() {
     console.log("MyComponent 渲染开始");
     
     fdom.div({
       children() {
         console.log("子元素渲染");
         // 子元素内容
       }
     });
     
     console.log("MyComponent 渲染完成");
   }
   ```

3. **依赖追踪调试**
   ```typescript
   const computed = memo(() => {
     console.log("计算执行，依赖：", dep1.get(), dep2.get());
     return dep1.get() + dep2.get();
   });
   ```

这个 API 参考涵盖了 MVE 框架的所有主要接口和类型。使用这些 API，你可以构建复杂的响应式应用程序。