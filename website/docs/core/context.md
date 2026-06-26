# Context 系统

类似于 React 的 Context，基于调用栈的上下文传递。

函数组件在调用时可以隐式携带上下文，子组件通过 `consume` 获取上层提供的数据，无需层层 props 传递。

```typescript
import { createContext } from 'mve-core';
import { fdom } from 'mve-dom';
import { createSignal } from 'wy-helper';

type Theme = 'light' | 'dark';
const ThemeContext = createContext<{
  setTheme(v: Theme): void;
  getTheme(): Theme;
}>({
  getTheme() {
    return 'light';
  },
  setTheme(v) {},
});

function App() {
  const theme = createSignal<'light' | 'dark'>('light');
  ThemeContext.provide({
    getTheme: theme.get,
    setTheme: theme.set,
  });
  fdom.div({
    children() {
      // 提供 getter 函数
      Header(); // 在此调用栈中可获取到主题
    },
  });
}

function Header() {
  const { getTheme, setTheme } = ThemeContext.consume(); // 获取 getter 函数

  fdom.header({
    s_backgroundColor() {
      return getTheme() === 'dark' ? '#333' : '#f8f9fa'; // 调用获取值
    },
    children() {
      fdom.button({
        onClick() {
          setTheme(getTheme() == 'dark' ? 'light' : 'dark');
        },
        childrenType: 'text',
        children: getTheme,
      });
    },
  });
}

```

与 React Context 不同，MVE 组件只构造一次，不会反复渲染。因此 Context 值不是"动态变化后自动通知"，而是要传递 Signal 的 getter 函数，让消费方在属性函数中按需取值。

## 其它

如果在同一层级注入了两个相同 key 的 context，取用时向上寻找最近的一个。