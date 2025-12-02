# 🏗️ Context 系统

类似于 react 的 context.

基于调用栈的上下文传递.

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

显然,由于只构造一次,并不是像 react 的 context 一样动态变化参数.如何动态变化的参数,一般需要传递 signal与事件,即函数.很少有传常量值。


## 其它

比如同一层级注入了两个相向的context，取用是向上寻找最新的一个。