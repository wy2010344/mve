# MVE 最佳实践与常见错误

本文档总结了 MVE 框架的最佳实践和常见错误的修正方法。

## 🔧 Signal 使用

### ✅ 正确：理解 Signal 的原子性

```typescript
// createSignal 是原子信号，类似 Vue shallowRef
const user = createSignal({ name: "张三", age: 25 });

// ✅ 正确：整体替换
user.set({ ...user.get(), age: 26 });

// ✅ 优化：手动创建嵌套信号
const userState = createSignal({
  name: createSignal("张三"),
  age: createSignal(25),
  profile: createSignal({
    email: createSignal("zhangsan@example.com")
  })
});

// 可以单独更新
userState.get().age.set(26);
userState.get().profile.get().email.set("lisi@example.com");

// ✅ 解包使用
const { get, set } = createSignal(0);
const increment = () => set(get() + 1);
```

### ❌ 错误：尝试修改对象属性

```typescript
// ❌ 错误：不会触发更新
const user = createSignal({ name: "张三", age: 25 });
user.get().age = 26; // 错误！
user.get().name = "李四"; // 错误！
```

## 🎨 DOM 使用

### ✅ 正确：在最终观察属性节点上展开信号

```typescript
// ✅ 正确的写法
fdom.li({
  children() {
    fdom.span({
      childrenType: "text",
      children() {
        // 正确：在最终观察属性节点上展开信号内容
        const todo = getItem();
        const index = getIndex();
        return `${index + 1}. ${todo.text}`;
      }
    });
    
    fdom.button({
      onClick() {
        // 正确：在事件中获取最新值
        const todo = getItem();
        toggleTodo(todo.id);
      },
      childrenType: "text",
      children() {
        // 正确：在 children 回调中获取动态内容
        const todo = getItem();
        return todo.completed ? "撤销" : "完成";
      }
    });
  }
});
```

### ❌ 错误：在 children() 回调中获取信号内容

```typescript
// ❌ 错误的写法
fdom.li({
  children() {
    const todo = getItem(); // 错误：在 children 回调中获取信号内容
    const index = getIndex();
    
    fdom.span({
      childrenType: "text",
      children: `${index + 1}. ${todo.text}` // 错误：静态内容，不会更新
    });
  }
});
```

### ✅ 正确：属性转换规则

```typescript
// MVE 的属性转换规则
fdom.div({
  // 样式属性：style.xxx → s_xxx
  s_color: 'red',
  s_backgroundColor() {
    return theme.get() === 'dark' ? '#333' : '#fff';
  },
  
  // data 属性：data-attrXXX → data_attrXXX
  data_testId: 'my-div',
  data_customValue() {
    return `value-${id.get()}`;
  },
  
  // CSS 变量：--varcssxx → css_varcssxx
  css_primaryColor: '#007bff',
  css_fontSize() {
    return `${size.get()}px`;
  },
  
  // ARIA 属性：aria-xxx → aria_xxx
  aria_label: '主要内容',
  aria_expanded() {
    return isExpanded.get();
  }
});
```

### ✅ 正确：dom.xx API 用法

```typescript
// ✅ 正确
dom.div({
  className: 'container',
  s_color: 'red',
  onClick() {
    // 事件处理
  }
}).render(() => {
  dom.p().renderTextContent("内容");
  
  dom.span().renderText`动态内容: ${value.get()}`;
});

// ❌ 错误
dom.div().className("container").onClick(handler).append(
  dom.p().text("内容") // 错误的方法
);
```

## 🏗️ Context 使用

### ✅ 正确：传递函数而非值

```typescript
// ✅ 正确：传递 getter 函数
const ThemeContext = createContext<() => "light" | "dark">(() => "light");

function App() {
  const theme = createSignal<"light" | "dark">("light");
  
  fdom.div({
    children() {
      // 正确：传递 getter 函数
      ThemeContext.provide(() => theme.get());
      Header();
    }
  });
}

function Header() {
  // 正确：获取的是 getter 函数
  const getTheme = ThemeContext.consume();
  
  fdom.header({
    s_backgroundColor() {
      // 正确：每次都会获取最新值
      return getTheme() === "dark" ? "#333" : "#f8f9fa";
    }
  });
}

// ✅ 更完整的模式：传递信号和事件
interface ThemeContextType {
  getTheme: () => "light" | "dark";
  toggleTheme: () => void;
}

const contextValue: ThemeContextType = {
  getTheme: () => theme.get(),
  toggleTheme: () => {
    theme.set(theme.get() === "light" ? "dark" : "light");
  }
};
```

### ❌ 错误：传递值

```typescript
// ❌ 错误：传递的是值，不是函数
ThemeContext.provide(theme.get()); // 错误！

// ❌ 错误：获取的是静态值，不会响应变化
const theme = ThemeContext.consume(); // 错误！
```

## 🔄 响应式系统

### ✅ 正确：memo 的使用时机

```typescript
// ✅ 简单计算：不使用 memo（memo 背后依赖 Map，有性能开销）
const simpleDouble = () => count.get() * 2;

// ✅ 复杂计算：使用 memo
const complexCalc = memo((old, inited) => {
  console.log('复杂计算执行', { old, inited });
  return heavyCalculation(data.get());
});

// ✅ 理解 memo 的回调参数
const computed = memo((old, inited) => {
  if (!inited) {
    console.log('首次计算，old 是 undefined');
  } else {
    console.log('重新计算，上次结果:', old);
  }
  return calculate(input.get());
});
```

### ✅ 正确：trackSignal 和 addEffect 的配合

```typescript
// ✅ 推荐模式：在 hookTrackSignal 回调中按需使用 addEffect
hookTrackSignal(() => count.get(), (newValue) => {
  console.log('count 变化:', newValue);
  
  // 按需在 addEffect 中执行副作用
  addEffect(() => {
    // 更新其他 Signal
    doubledCount.set(newValue * 2);
    
    // 更新 DOM
    document.title = `Count: ${newValue}`;
    
    // 发送分析数据
    analytics.track('count_changed', { value: newValue });
  }, 1); // level 1，确保在 DOM 更新后执行
});

// ✅ 正确：addEffect 的 level 使用
addEffect(() => {
  console.log('默认级别 0');
}); // 默认 level 0

addEffect(() => {
  console.log('级别 1 - 在 DOM 更新后');
}, 1); // 一般用户级别需要大于 -1
```

### ❌ 错误：在错误的地方更新 Signal

```typescript
// ❌ 错误：在 memo 中直接更新 Signal
const computed = memo((old, inited) => {
  const result = calculate(input.get());
  output.set(result); // 错误！
  return result;
});

// ❌ 错误：在 trackSignal 回调中直接更新 Signal
hookTrackSignal(() => input.get(), (newValue) => {
  output.set(newValue * 2); // 错误！
});

// ❌ 错误：使用框架内部的 level
addEffect(() => {
  console.log('用户操作');
}, -1); // 错误：level -1 是框架内部使用
```

## 🎯 列表渲染

### ✅ 正确：使用稳定的 key

```typescript
// ✅ 正确：使用稳定的 id 作为 key
const items = createSignal([
  { id: 1, name: "项目1" },
  { id: 2, name: "项目2" }
]);

fdom.ul({
  children() {
    renderArrayKey(
      () => items.get(),
      (item) => item.id, // 正确：使用稳定的 id 作为 key
      (getItem, getIndex, key) => {
        fdom.li({
          children() {
            fdom.span({
              childrenType: "text",
              children() {
                const item = getItem();
                const index = getIndex();
                return `${index + 1}. ${item.name}`;
              }
            });
          }
        });
      }
    );
  }
});
```

### ❌ 错误：使用不稳定的 key

```typescript
// ❌ 错误：使用 index 作为 key，不稳定
renderArrayKey(
  () => items.get(),
  (item, index) => index, // 错误！
  (getItem, getIndex, key) => {
    // 渲染逻辑...
  }
);
```

## 🚀 性能优化

### ✅ 正确：合理使用 memo

```typescript
// ✅ 推荐：对昂贵计算使用 memo
const expensiveComputation = memo((old, inited) => {
  const data = largeDataSet.get();
  return data
    .filter(item => item.active)
    .map(item => processItem(item))
    .sort((a, b) => a.priority - b.priority);
});

// ✅ 推荐：避免在渲染函数中进行昂贵计算
fdom.div({
  children() {
    const processedData = expensiveComputation();
    
    renderArrayKey(
      () => processedData,
      (item) => item.id,
      (getItem, getIndex, key) => {
        ItemComponent({ item: getItem() });
      }
    );
  }
});
```

### ❌ 错误：在渲染函数中重复计算

```typescript
// ❌ 不推荐：每次渲染都重新计算
fdom.div({
  children() {
    const processedData = largeDataSet.get()
      .filter(item => item.active)
      .map(item => processItem(item))
      .sort((a, b) => a.priority - b.priority);
    
    // 渲染逻辑...
  }
});
```

## 🔧 状态管理模式

### ✅ 推荐：直接使用 Signal

```typescript
// ✅ 推荐：直接使用 Signal，避免不必要的封装
const appState = createSignal({
  user: null as User | null,
  theme: "light" as "light" | "dark",
  loading: false
});

// 计算属性
const isAuthenticated = memo((old, inited) => {
  return appState.get().user !== null;
});

// 操作函数
function login(user: User) {
  appState.set({
    ...appState.get(),
    user
  });
}

function toggleTheme() {
  const current = appState.get();
  appState.set({
    ...current,
    theme: current.theme === "light" ? "dark" : "light"
  });
}
```

### ❌ 避免：不必要的类封装

```typescript
// ❌ 不推荐：创建类来封装 Signal
class UserStore {
  private _state = createSignal<UserState>({...});
  
  get state() {
    return this._state.get();
  }
  
  login(user: User) {
    this._state.set({...});
  }
}
```

## 📋 总结

### 核心原则

1. **Signal 是原子的**：对象更新需整体替换，或手动创建嵌套信号
2. **函数式设计**：传递函数而不是值，在正确的地方获取动态内容
3. **响应式上下文**：理解什么时候可以更新 Signal，什么时候不可以
4. **性能考虑**：memo 有开销，简单计算可以不使用
5. **level 层级**：addEffect 的 level 一般需要大于 -1

### 属性转换规则

- `style.xxx` → `s_xxx`
- `data-attrXXX` → `data_attrXXX`
- `--varcssxx` → `css_varcssxx`
- `aria-xxx` → `aria_xxx`

### 常见模式

```typescript
// 状态管理
const state = createSignal(initialValue);
const computed = memo((old, inited) => calculate(state.get()));

// 依赖追踪
hookTrackSignal(() => state.get(), (newValue) => {
  addEffect(() => {
    // 副作用操作
  }, 1);
});

// 列表渲染
renderArrayKey(
  () => items.get(),
  (item) => item.id,
  (getItem, getIndex, key) => {
    // 渲染逻辑
  }
);
```

掌握这些最佳实践，就能避免常见错误，写出高效的 MVE 代码。