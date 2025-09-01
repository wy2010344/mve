# 从 Vue/React 迁移到 MVE

本指南专门为从 Vue 或 React 迁移到 MVE 的开发者准备，特别是针对 tdesign-vue-mobile 等项目的迁移。

## 🔄 核心概念对比

### Signal vs Vue Ref vs React State

```typescript
// Vue 3
import { ref, computed, watchEffect } from 'vue';

const count = ref(0);
const doubled = computed(() => count.value * 2);
watchEffect(() => {
  console.log('count changed:', count.value);
});

// React
import { useState, useMemo, useEffect } from 'react';

const [count, setCount] = useState(0);
const doubled = useMemo(() => count * 2, [count]);
useEffect(() => {
  console.log('count changed:', count);
}, [count]);

// MVE
import { createSignal, memo, hookTrackSignal } from 'mve';

const count = createSignal(0);
const doubled = memo(() => count.get() * 2);
hookTrackSignal(() => count.get(), (newCount) => {
  console.log('count changed:', newCount);
});
```

### memo 的智能优化特性

MVE 的 memo 类似 Vue 的 computed，具有智能优化：

```typescript
// 智能依赖优化示例
const a = createSignal(1);
const b = createSignal(2);

const memoA = memo(() => {
  console.log('memoA 计算');
  return a.get() > 0 ? 'positive' : 'negative';
});

const memoB = memo(() => {
  console.log('memoB 计算');
  return `Result: ${memoA()}`; // 依赖 memoA
});

// 即使 a 从 1 变为 2，memoA 返回值相同，memoB 不会重新计算
a.set(2); // memoA 重新计算，但 memoB 不会
a.set(-1); // memoA 和 memoB 都会重新计算
```

## 🎣 Hooks 对比

### trackSignal vs watchEffect vs useEffect

```typescript
// Vue 3 watchEffect
import { watchEffect } from 'vue';

watchEffect(() => {
  console.log('count:', count.value);
  // 自动追踪 count.value
});

// React useEffect
useEffect(() => {
  console.log('count:', count);
}, [count]); // 手动声明依赖

// MVE trackSignal (全局使用)
trackSignal(() => count.get(), (newCount) => {
  console.log('count:', newCount);
});

// MVE hookTrackSignal (组件内使用，推荐)
function MyComponent() {
  hookTrackSignal(() => count.get(), (newCount) => {
    console.log('count:', newCount);
  });
  // 组件销毁时自动清理
}
```

### addEffect vs Vue nextTick vs React useEffect

```typescript
// Vue 3 - 在 DOM 更新后执行
import { nextTick } from 'vue';

count.value = 1;
nextTick(() => {
  console.log('DOM 已更新');
});

// React - 在渲染后执行
useEffect(() => {
  console.log('组件已渲染');
});

// MVE - 类似 nextTick，在所有 Signal 更新后执行
function MyComponent() {
  const count = createSignal(0);
  
  // 常见模式：在 hookTrackSignal 回调中按需使用
  hookTrackSignal(() => count.get(), (newValue) => {
    console.log('count 变化:', newValue);
    
    // 按需在 addEffect 中执行副作用
    addEffect(() => {
      // 可以在这里更新 Signal
      if (newValue > 10) {
        count.set(0);
      }
      
      // 更新 DOM
      document.title = `Count: ${newValue}`;
    }, 1); // level 1，确保在 DOM 更新后执行
  });
}
```

### addEffect 的执行级别

```typescript
// addEffect 支持 level 层级，类似 nextTick 的优先级
// level -1, -2: DOM 更新的副作用（框架内部使用）
// level 0: 默认级别
// level > 0: 用户级别，一般需要大于 -1

addEffect(() => {
  console.log('默认级别 0');
}); // 默认 level 0

addEffect(() => {
  console.log('级别 1 - 在 DOM 更新后执行');
}, 1);

addEffect(() => {
  console.log('级别 10 - 更晚执行');
}, 10);
```

## 🏗️ 组件迁移模式

### Vue 组件迁移

```typescript
// Vue 3 组件
export default {
  setup() {
    const count = ref(0);
    const doubled = computed(() => count.value * 2);
    
    const increment = () => {
      count.value++;
    };
    
    watchEffect(() => {
      document.title = `Count: ${count.value}`;
    });
    
    onUnmounted(() => {
      console.log('组件卸载');
    });
    
    return {
      count,
      doubled,
      increment
    };
  },
  template: `
    <div>
      <p>Count: {{ count }}</p>
      <p>Doubled: {{ doubled }}</p>
      <button @click="increment">+</button>
    </div>
  `
};

// MVE 迁移版本
function CounterComponent() {
  const count = createSignal(0);
  const doubled = memo(() => count.get() * 2);
  
  const increment = () => {
    count.set(count.get() + 1);
  };
  
  hookTrackSignal(() => count.get(), (newCount) => {
    document.title = `Count: ${newCount}`;
  });
  
  hookDestroy(() => {
    console.log('组件卸载');
  });
  
  fdom.div({
    children() {
      fdom.p({
        childrenType: "text",
        children() {
          return `Count: ${count.get()}`;
        }
      });
      
      fdom.p({
        childrenType: "text", 
        children() {
          return `Doubled: ${doubled()}`;
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

### React 组件迁移

```typescript
// React 组件
function Counter() {
  const [count, setCount] = useState(0);
  const doubled = useMemo(() => count * 2, [count]);
  
  const increment = useCallback(() => {
    setCount(c => c + 1);
  }, []);
  
  useEffect(() => {
    document.title = `Count: ${count}`;
  }, [count]);
  
  useEffect(() => {
    return () => {
      console.log('组件卸载');
    };
  }, []);
  
  return (
    <div>
      <p>Count: {count}</p>
      <p>Doubled: {doubled}</p>
      <button onClick={increment}>+</button>
    </div>
  );
}

// MVE 迁移版本（同上面的 Vue 迁移版本）
function CounterComponent() {
  const count = createSignal(0);
  const doubled = memo(() => count.get() * 2);
  
  const increment = () => {
    count.set(count.get() + 1);
  };
  
  hookTrackSignal(() => count.get(), (newCount) => {
    document.title = `Count: ${newCount}`;
  });
  
  hookDestroy(() => {
    console.log('组件卸载');
  });
  
  // 渲染逻辑同上...
}
```

## 🔄 状态管理迁移

### Vuex/Pinia 迁移

```typescript
// Pinia Store
import { defineStore } from 'pinia';

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0);
  const doubled = computed(() => count.value * 2);
  
  function increment() {
    count.value++;
  }
  
  return { count, doubled, increment };
});

// MVE 迁移版本
const counterState = createSignal(0);
const doubled = memo(() => counterState.get() * 2);

function increment() {
  counterState.set(counterState.get() + 1);
}

// 导出状态和操作
export { counterState, doubled, increment };

// 在组件中使用
function MyComponent() {
  fdom.div({
    children() {
      fdom.p({
        childrenType: "text",
        children() {
          return `Count: ${counterState.get()}`;
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

### Redux 迁移

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

// MVE 迁移版本
const counterState = createSignal({ count: 0 });

function increment() {
  const current = counterState.get();
  counterState.set({ count: current.count + 1 });
}

// 或者更简洁的方式
const count = createSignal(0);
const increment = () => count.set(count.get() + 1);
```

## 🎨 TDesign Vue Mobile 迁移示例

### Button 组件迁移

```typescript
// TDesign Vue Mobile Button
<template>
  <button 
    :class="buttonClass"
    :disabled="disabled"
    @click="handleClick"
  >
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'medium' },
  disabled: { type: Boolean, default: false }
});

const emit = defineEmits(['click']);

const buttonClass = computed(() => {
  return [
    't-button',
    `t-button--${props.variant}`,
    `t-button--${props.size}`,
    { 't-button--disabled': props.disabled }
  ];
});

const handleClick = (e) => {
  if (!props.disabled) {
    emit('click', e);
  }
};
</script>

// MVE 迁移版本
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick?: (e: Event) => void;
  children?: () => void;
}

function Button({ 
  variant = 'primary', 
  size = 'medium', 
  disabled = false, 
  onClick,
  children 
}: ButtonProps) {
  
  const handleClick = (e: Event) => {
    if (!disabled && onClick) {
      onClick(e);
    }
  };
  
  fdom.button({
    className() {
      return [
        't-button',
        `t-button--${variant}`,
        `t-button--${size}`,
        disabled ? 't-button--disabled' : ''
      ].filter(Boolean).join(' ');
    },
    disabled,
    onClick: handleClick,
    children
  });
}

// 使用方式
Button({
  variant: 'primary',
  onClick: () => console.log('clicked'),
  children() {
    fdom.span({
      childrenType: "text",
      children: "点击我"
    });
  }
});
```

### Cell 组件迁移

```typescript
// TDesign Vue Mobile Cell
<template>
  <div class="t-cell" @click="handleClick">
    <div class="t-cell__left">
      <slot name="left-icon" />
      <div class="t-cell__title">{{ title }}</div>
    </div>
    <div class="t-cell__right">
      <div class="t-cell__note">{{ note }}</div>
      <slot name="right-icon" />
    </div>
  </div>
</template>

// MVE 迁移版本
interface CellProps {
  title: string;
  note?: string;
  leftIcon?: () => void;
  rightIcon?: () => void;
  onClick?: () => void;
}

function Cell({ title, note, leftIcon, rightIcon, onClick }: CellProps) {
  fdom.div({
    className: "t-cell",
    onClick,
    children() {
      fdom.div({
        className: "t-cell__left",
        children() {
          if (leftIcon) {
            leftIcon();
          }
          
          fdom.div({
            className: "t-cell__title",
            childrenType: "text",
            children: title
          });
        }
      });
      
      fdom.div({
        className: "t-cell__right",
        children() {
          if (note) {
            fdom.div({
              className: "t-cell__note",
              childrenType: "text",
              children: note
            });
          }
          
          if (rightIcon) {
            rightIcon();
          }
        }
      });
    }
  });
}
```

## 🔧 全局状态管理

### Context 迁移：基于调用栈 vs 组件树

```typescript
// React Context
const ThemeContext = React.createContext('light');

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Header />
    </ThemeContext.Provider>
  );
}

function Header() {
  const theme = useContext(ThemeContext);
  return <div style={{ color: theme === 'dark' ? 'white' : 'black' }} />;
}

// MVE Context - 基于调用栈
const ThemeContext = createContext<() => "light" | "dark">(() => "light");

function App() {
  fdom.div({
    children() {
      // 提供 Context 值（基于调用栈）
      ThemeContext.provide(() => "dark");
      Header(); // 在这个调用栈中能获取到 "dark"
    }
  });
}

function Header() {
  const getTheme = ThemeContext.consume(); // 获取 getter 函数
  
  fdom.div({
    s_color() {
      return getTheme() === "dark" ? "white" : "black"; // 调用函数获取值
    }
  });
}

// 动态 Context 值
function App() {
  const theme = createSignal<"light" | "dark">("light");
  
  fdom.div({
    children() {
      // 传递 getter 函数，不是值
      ThemeContext.provide(() => theme.get());
      Header();
    }
  });
}
```

### 使用 runGlobalHolder

```typescript
// 全局状态管理
const globalTheme = createSignal<'light' | 'dark'>('light');
const globalUser = createSignal<User | null>(null);

// 在全局任意地方监听状态变化
runGlobalHolder(() => {
  hookTrackSignal(() => globalTheme.get(), (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
  });
  
  hookTrackSignal(() => globalUser.get(), (user) => {
    if (user) {
      analytics.identify(user.id);
    }
  });
});

// 全局状态操作函数
function toggleTheme() {
  const current = globalTheme.get();
  globalTheme.set(current === 'light' ? 'dark' : 'light');
}

function login(user: User) {
  globalUser.set(user);
}

function logout() {
  globalUser.set(null);
}
```

## 📋 迁移检查清单

### Vue 项目迁移

- [ ] `ref()` → `createSignal()`
- [ ] `computed()` → `memo()`
- [ ] `watchEffect()` → `hookTrackSignal()`
- [ ] `nextTick()` → `addEffect()`
- [ ] `onUnmounted()` → `hookDestroy()`
- [ ] `v-if` → `renderIf()`
- [ ] `v-for` → `renderArray()`
- [ ] `template` → `fdom` 函数调用
- [ ] `props` → 函数参数
- [ ] `emit` → 回调函数

### React 项目迁移

- [ ] `useState()` → `createSignal()`
- [ ] `useMemo()` → `memo()`
- [ ] `useEffect()` → `hookTrackSignal()` 或 `addEffect()`
- [ ] `useCallback()` → 普通函数（MVE 自动优化）
- [ ] `useRef()` → `createSignal()` 或直接变量
- [ ] 条件渲染 → `renderIf()`
- [ ] 列表渲染 → `renderArray()`
- [ ] JSX → `fdom` 函数调用
- [ ] props → 函数参数
- [ ] 事件处理 → 直接函数引用

### 通用迁移注意事项

1. **Signal 更新限制**：
   - ❌ 不能在 `memo` 中直接更新 Signal
   - ❌ 不能在 `trackSignal` 回调中直接更新 Signal
   - ✅ 可以在 `addEffect` 回调中更新 Signal

2. **生命周期管理**：
   - 使用 `hookDestroy` 替代组件卸载钩子
   - 使用 `hookTrackSignal` 替代 `trackSignal`（自动绑定到 stateHolder）

3. **性能优化**：
   - MVE 的 `memo` 具有智能优化，相同返回值不会触发依赖更新
   - 使用 `addEffect` 的级别参数控制执行顺序
   - 列表渲染使用 `renderArrayKey` 提供稳定的 key

## 🚨 迁移中的关键陷阱

### 最容易犯的错误

从 Vue/React 迁移时，最容易犯的错误是保持原有的思维模式：

```typescript
// Vue/React 思维（错误）
export default function () {
  const { themeColors } = gContext.consume();
  const colors = themeColors(); // ❌ 以为这样就能响应变化
  
  return fdom.div({
    className: `${colors.bg} p-4`, // ❌ 永远不会更新
  });
}

// MVE 正确思维
export default function () {
  const { themeColors } = gContext.consume();
  
  fdom.div({
    className() {
      const colors = themeColors(); // ✅ 在属性函数中调用
      return `${colors.bg} p-4`;
    },
  });
}
```

### 核心思维转换

1. **Vue/React**：可以在任何地方调用响应式 API
2. **MVE**：只能在属性函数中调用 Signal 才能建立响应式绑定

### 迁移检查清单补充

#### 响应式绑定检查
- [ ] 移除所有组件顶层的 Signal 调用
- [ ] 确保所有 Signal 调用都在属性函数内
- [ ] 检查副作用处理是否使用了 `hookTrackSignal`

#### 常见错误模式
```typescript
// ❌ 这些都是错误的顶层调用
const colors = themeColors();
const isDark = theme() === "dark";
const user = getUserData();
const stats = dataStatistics();

// ✅ 正确的做法
fdom.div({
  className() {
    const colors = themeColors(); // 在属性函数中
    return colors.bg;
  },
  children() {
    const user = getUserData(); // 在 children 函数中
    return user ? user.name : "未登录";
  }
});
```

这个迁移指南应该能帮助你顺利从 Vue/React 项目迁移到 MVE，特别是 tdesign-vue-mobile 这样的组件库项目。记住：**MVE 的响应式绑定必须在属性函数中建立**，这是与 Vue/React 最大的区别。