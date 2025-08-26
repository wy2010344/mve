# MVE 核心概念

本章介绍 MVE 框架的核心概念，帮助你理解框架的设计思想和工作原理。

## 🔧 响应式系统

### createSignal - 原子信号

createSignal 创建的是原子信号，类似 Vue 的 shallowRef，不是嵌套响应式：

```typescript
import { createSignal } from 'wy-helper'

// 基础用法
const count = createSignal(0)
const user = createSignal<User | null>(null)

// createSignal 创建的只是一个 object，可以随意解包
const { get, set } = createSignal(0)
console.log(get()) // 0
set(1)

// 对象更新需要整体替换
const userState = createSignal({ name: '张三', age: 25 })
userState.set({ ...userState.get(), age: 26 }) // 正确

// 手动创建嵌套信号来优化性能
const nestedState = createSignal({
  value: createSignal(9),
  name: createSignal('8'),
})

// 在回调中使用
function updateNested() {
  nestedState.get().value.set(8)
  nestedState.get().name.set('ddd')
}
```

### memo - 计算属性

memo 用于减少重复的重计算，背后依赖了 Map。如果计算量远少于它的实现，可以考虑不使用：

```typescript
import { memo } from 'wy-helper'

const a = createSignal(1)

// memo 的回调参数：(old, inited)
const memoA = memo((old, inited) => {
  // old: 旧值，inited: 是否不是第一次执行
  console.log('memoA 计算', { old, inited })
  return a.get() > 0 ? 'positive' : 'negative'
})

const memoB = memo((old, inited) => {
  return `Result: ${memoA()}`
})

// 智能优化：即使 a 变化，如果 memoA 返回值相同，memoB 不会重新计算
a.set(5) // memoA 执行，但返回值仍是 'positive'，memoB 不执行
a.set(-1) // memoA 返回值变为 'negative'，memoB 也执行

// 性能考虑：简单计算可以不使用 memo
const simpleDouble = () => count.get() * 2 // 直接计算，无需 memo
const complexCalc = memo((old, inited) => {
  // 复杂计算才使用 memo
  return heavyCalculation(data.get())
})
```

### trackSignal - 依赖追踪

trackSignal 类似 Vue 的 watchEffect，在 mve 中一般使用它的封装 hookTrackSignal, 会自动随生命周期销毁：

```typescript
import { trackSignal } from 'wy-helper'
import { hookTrackSignal } from 'mve-helper'
const count = createSignal(0)
const name = createSignal('张三')

// 基础用法
trackSignal(
  (oldValue, inited) => count.get(),
  (newValue, oldValue, inited) => {
    //只在newValue!=oldValue时触发
    console.log('count 变化:', newValue)
    return function () {
      //类似useEffect的销毁回调
      console.log('nextTime clear')
    }
  }
)

// 推荐用法 - hookTrackSignal（自动绑定到 stateHolder）
function MyComponent() {
  hookTrackSignal(
    () => count.get(),
    (newValue) => {
      console.log('count 变化:', newValue)
    }
  )

  // 监听多个依赖
  hookTrackSignal(
    () => {
      return {
        count: count.get(),
        name: name.get(),
      }
    },
    (newValue) => {
      console.log('多个依赖变化:', newValue)
    }
  )
}

// 全局使用 hookTrackSignal
import { runGlobalHolder } from 'mve-core'

runGlobalHolder(() => {
  hookTrackSignal(
    () => count.get(),
    (newValue) => {
      document.title = `Count: ${newValue}`
    }
  )
})
```

### addEffect - 批量更新后回调

addEffect 类似于 nextTick，在本批次 Signal 更新完成后执行，支持 level 层级：

```typescript
import { addEffect } from 'wy-helper'

// 基础用法（默认 level 0）
addEffect(() => {
  console.log('所有 Signal 更新完成')
})

// level 层级说明：
// level -1, -2: DOM 更新的副作用（框架内部使用）
// level 0: 默认级别
// level > 0: 用户自定义级别，数值越大越晚执行

addEffect(() => {
  console.log('级别 0 - 默认执行')
}, 0)

addEffect(() => {
  console.log('级别 10 - 较晚执行')
}, 10)

// 注意：一般 level 都需要大于 -1
addEffect(() => {
  console.log('级别 1 - 在 DOM 更新后执行')
}, 1)

// 常见用法：在 hookTrackSignal 的回调中按需使用 addEffect
hookTrackSignal(
  () => count.get(),
  (newValue) => {
    console.log('count 变化:', newValue)

    // 按需在 addEffect 中执行副作用
    addEffect(() => {
      // 更新其他 Signal
      doubledCount.set(newValue * 2)

      // 更新 DOM
      document.title = `Count: ${newValue}`

      // 发送分析数据
      analytics.track('count_changed', { value: newValue })
    }, 1) // level 1，确保在 DOM 更新后执行
  }
)
```

## 🎨 渲染系统

### renderArrayKey - 列表渲染

renderArrayKey 是最常用的列表渲染函数：

```typescript
import { renderArrayKey } from 'mve-helper'

const todos = createSignal([
  { id: 1, text: '学习 MVE', completed: false },
  { id: 2, text: '写代码', completed: true },
])

fdom.ul({
  children() {
    renderArrayKey(
      () => todos.get(), // 参数1: 获得数组的依赖函数
      (todo) => todo.id, // 参数2: 从每个数组元素中取得唯一 key,需要稳定的key
      (getItem, getIndex, key) => {
        // 参数3: 渲染回调函数
        // 当数组变化时：
        // - 如果某 item 消失，对应 key 的 stateHolder 销毁
        // - 如果有新增，新建一个 stateHolder
        // - 如果仍然存在，保持 stateHolder，getItem/getIndex 动态获得最新内容

        fdom.li({
          children() {
            fdom.span({
              childrenType: 'text',
              children() {
                // 正确：在最终观察属性节点上展开信号内容
                const todo = getItem()
                const index = getIndex()
                return `${index + 1}. ${todo.text}`
              },
            })

            fdom.button({
              onClick() {
                const todo = getItem() // 在事件中获取最新值
                const currentTodos = todos.get()
                const updatedTodos = currentTodos.map((t) =>
                  t.id === todo.id ? { ...t, completed: !t.completed } : t
                )
                todos.set(updatedTodos)
              },
              childrenType: 'text',
              children() {
                // 正确：在 children 回调中获取动态内容
                const todo = getItem()
                return todo.completed ? '撤销' : '完成'
              },
            })
          },
        })
      }
    )
  },
})
```

### renderIf - 条件渲染

```typescript
import { renderIf } from 'mve-helper'

const user = createSignal<User | null>(null)
const isLoading = createSignal(false)

renderIf(
  () => isLoading.get(),
  () => {
    // 加载状态
    fdom.div({
      childrenType: 'text',
      children: '加载中...',
    })
  },
  () => {
    // 非加载状态
    renderIf(
      () => user.get() !== null,
      () => {
        // 已登录
        const currentUser = user.get()!
        UserProfile({ user: currentUser })
      },
      () => {
        // 未登录
        LoginForm()
      }
    )
  }
)
```

### renderOne - 单值渲染

```typescript
import { renderOne } from 'mve-helper'

const currentView = createSignal<'list' | 'grid' | 'table'>('list')

renderOne(
  () => currentView.get(),
  (view) => {
    switch (view) {
      case 'list':
        ListView()
        break
      case 'grid':
        GridView()
        break
      case 'table':
        TableView()
        break
    }
  }
)
```

### renderOneKey -- 处理联合类型

```ts
const { get } = hookTrackPromiseSignal(....)
//get是()=>{type:'success',...}|{type:'error',...}
renderOneKey(get,'type',function(key,get){
  if(key=='success'){
    //此时,get是()=>{type:'success',...}
    fdom.div({
      className:'xxx'
    })
  }else if(key=='error'){
    //此时,get是()=>{type:'error',...}
    fdom.div({
      className:'xxx'
    })
  }
})
```

## 🌐 三套 DOM API

### 1. dom.xx - 符合 DOM 结构的链式 API

```typescript
import { dom } from 'mve-dom'

dom
  .div({
    className: 'container',
    //这里类似react
    style: {
      color: 'red',
      background() {
        return isActive.get() ? 'green' : 'blue'
      },
    },
  })
  .render(() => {
    renderTextContent('abc')

    //渲染子区域为文字
    dom.span().renderText`abc`

    //渲染子区域为文字,但文字是动态的
    dom.div().renderTextContent(() => {
      return `${value.get()}abc`
    })

    //渲染子区域为html
    dom.span().rendrHtml`<b>abc</b>`
    dom.span().rendrHtmlContent(function () {
      //返回一段html的内容
      return html.get()
    })
  })
```

### 2. fdom.xx - 简化的扁平参数 API（推荐）

fdom 中的属性转换规则：

- `style.xxx` → `s_xxx`
- `data-attrXXX` → `data_attrXXX`
- `--varcssxx` → `css_varcssxx`
- `aria-xxx` → `aria_xxx`

```typescript
import { fdom } from 'mve-dom'

fdom.div({
  className: 'abc',

  // 样式属性
  s_color: 'red',
  s_backgroundColor() {
    return isActive.get() ? 'green' : 'blue'
  },

  // data 属性
  data_testId: 'my-div',
  data_customValue() {
    return `value-${id.get()}`
  },

  // CSS 变量
  css_primaryColor: '#007bff',
  css_fontSize() {
    return `${size.get()}px`
  },

  // ARIA 属性
  aria_label: '主要内容',
  aria_expanded() {
    return isExpanded.get()
  },

  onClick(e) {
    //点击事件,其它事件类似,如react
  },
  onClickCapture(e) {
    //capture
  },
  plugin(e) {
    //e为该div实例,只调用一次,可注入一些东西.
  },
  children() {
    fdom.span({
      //此时,children为文本,或返回文本的函数
      childrenType: 'text',
      children() {
        return `动态内容: ${content.get()}`
      },
    })
    fdom.span({
      //只是文本,可以省略childrenType
      children: 'abc',
    })

    fdom.span({
      //此时,children为html,或返回html的函数
      childrenType: 'html',
      children() {
        return `<b>动态内容: ${content.get()}</b>`
      },
    })

    fdom.span({
      //getContent为返回文本或数字的函数.此时子区域渲染为该文本,toText来源于wy-dom-helper
      children: toText`abc--${getContent}---bcc`,
    })

    fdom.span({
      //getContent为返回文本或数字的函数.此时子区域渲染为html,toHtml来源于wy-dom-helper
      children: toHtml`<b>abc--${getContent}---bcc</b>`,
    })
    fdom.span({
      //getContent为返回文本或数字的函数.此时子区域渲染为html,toGetHtml来源于wy-dom-helper
      children: toGetHtml(function () {
        return `<b>abc--${getContent()}---bcc</b>`
      }),
    })
  },
})
```

### 3. mdom.xx - 减少重复依赖的优化 API

当同一元素上过多属性依赖相同的信号时，使用 mdom 可以减少 trackSignal 的建立。其它地方,mdom 与 fdom 一样

```typescript
import { mdom } from 'mve-dom'

mdom({
  attrs(m) {
    // m 的属性与 fdom 类似，支持相同的转换规则
    if (isActive.get()) {
      m.s_color = 'red'
      m.s_backgroundColor = 'green'
      m.data_status = 'active'
      m.aria_selected = true
    } else {
      m.s_color = 'blue'
      m.s_backgroundColor = 'yellow'
      m.data_status = 'inactive'
      m.aria_selected = false
    }
    m.className = 'abc'
    m.css_customVar = `--value-${value.get()}`
  },
  onClick(e) {
    //点击事件
  },
  // children 和 childrenType 与 fdom 完全一样
  children() {
    mdom({
      childrenType: 'text',
      children() {
        return `状态: ${isActive.get() ? '激活' : '未激活'}`
      },
    })

    // 也可以渲染子组件
    ChildComponent()
  },
})
```

## 🔄 异步状态管理

### hookPromiseSignal - 异步数据处理

```typescript
import { hookPromiseSignal } from 'mve-helper'
import { renderInput } from 'mve-dom-helper'
function DataComponent() {
  const signalA = createSignal('param1')
  const signalB = createSignal('param2')

  // 当 signalA 或 signalB 变化时，都会触发 fetchRemote 重新执行
  const { get, loading, reduceSet } = hookPromiseSignal(() => {
    const a = signalA.get()
    const b = signalB.get()

    return () => {
      return fetchRemote(a, b)
    }
  })

  fdom.div({
    children() {
      renderIf(
        () => loading.get(),
        () => {
          fdom.div({
            childrenType: 'text',
            children: '加载中...',
          })
        }
      )
      renderOneKey(get, 'type', function (key, o) {
        if (key == 'success') {
          const data = o.value
          fdom.div({
            childrenType: 'text',
            children: `数据: ${JSON.stringify(data)}`,
          })

          fdom.button({
            onClick() {
              // 如果请求成功，可以修改信号的内容
              reduceSet((currentData) => {
                return { ...currentData, modified: true }
              })
            },
            childrenType: 'text',
            children: '修改数据',
          })
        }
      })
      // 控制参数
      renderInput(signalA.get, signalA.set, fdom.input({}))

      renderInput(signalB.get, signalB.set, fdom.input({}))
    },
  })
}

async function fetchRemote(a: string, b: string) {
  // 模拟异步请求
  await new Promise((resolve) => setTimeout(resolve, 1000))
  return { result: `${a}-${b}`, timestamp: Date.now() }
}
```

## 🏗️ Context 系统

Context 一般传递的是信号与事件，即 getSignal、changeSignal 这种模式：

```typescript
import { createContext } from 'mve-core'

const ThemeContext = createContext<() => 'light' | 'dark'>(() => 'light')

function App() {
  const theme = createSignal<'light' | 'dark'>('light')

  fdom.div({
    children() {
      // 提供的是 getter 函数
      ThemeContext.provide(() => theme.get())
      Header()
      MainContent()
    },
  })
}

function Header() {
  // 消费的是 getter 函数
  const getTheme = ThemeContext.consume()

  fdom.header({
    s_backgroundColor() {
      return getTheme() === 'dark' ? '#333' : '#f8f9fa'
    },
    s_color() {
      return getTheme() === 'dark' ? 'white' : 'black'
    },
    children() {
      fdom.h1({
        childrenType: 'text',
        children: '我的应用',
      })
    },
  })
}

// 更完整的 Context 模式：传递信号和事件
interface ThemeContextType {
  getTheme: () => 'light' | 'dark'
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  getTheme: () => 'light',
  toggleTheme: () => {},
})

function App() {
  const theme = createSignal<'light' | 'dark'>('light')

  const contextValue: ThemeContextType = {
    getTheme: () => theme.get(),
    toggleTheme: () => {
      theme.set(theme.get() === 'light' ? 'dark' : 'light')
    },
  }

  fdom.div({
    children() {
      ThemeContext.provide(contextValue)
      Header()
    },
  })
}
```

## 🔧 生命周期管理

```typescript
import { hookIsDestroyed } from 'mve-core'
import { hookDestroy } from 'mve-helper'
function TimerComponent() {
  const time = createSignal(new Date().toLocaleTimeString())

  // 创建定时器
  const timer = setInterval(() => {
    if (!hookIsDestroyed()) {
      time.set(new Date().toLocaleTimeString())
    }
  }, 1000)

  // 注册清理函数
  hookDestroy(() => {
    console.log('清理定时器')
    clearInterval(timer)
  })

  fdom.div({
    children() {
      fdom.p({
        childrenType: 'text',
        children() {
          return `当前时间: ${time.get()}`
        },
      })
    },
  })
}
```

## ⚠️ 重要注意事项

### 1. Signal 原子性

createSignal 是原子的，对象更新需整体替换，或手动创建嵌套信号优化,即类似 vue 的 shallowRef 而不是 ref。

### 2. children() 用法

如果没有 childrenType:'text'|'html',children 只是子层级.
信号内容需要在最终观察属性节点上展开，不在 children 回调中获取。

```ts
fdom.div({
  children() {
    //这里只能获得singalA最初的值,而不能获得动态的值.即该children函数在整个生命周期中,只执行一次
    const a = signalA.get()
  },
})
```

一般改造

```ts
fdom.div({
  children() {
    //这里只能获得singalA最初的值,而不能获得动态的值.即该children函数在整个生命周期中,只执行一次

    fdom.span({
      s_background() {
        //在具体的属性场合展开
        return signalB.get() ? 'blue' : 'green'
      },
      childrenType: 'text',
      children() {
        //在真正需要的场合展开,如children是text节点
        return signalA.get()
      },
    })
  },
})
```

这些核心概念构成了 MVE 框架的基础。掌握了这些概念，你就能够构建高效的响应式应用程序。
