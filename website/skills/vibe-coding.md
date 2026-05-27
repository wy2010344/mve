# MVE Vibe Coding Skill

基于 `packages/mve/website/core` 文档构建的一套高频 `vibe coding` 模板和技能指南，方便快速上手与复用。

## 1. 主要目标

- 快速启动 `MVE` 响应式状态 + `DOM` 渲染。
- 支持列表、条件、组件切换、生命周期、effect、信号追踪。
- 为后续扩展保留 TODO 留白。

---

## 2. 核心信号 API 速查（State）

### createSignal

```ts
const count = createSignal(0)
const user = createSignal({ name: '张三', age: 25 })

count.set(count.get() + 1)
user.set({ ...user.get(), age: user.get().age + 1 })
```

### memo

```ts
const a = createSignal(1)
const memoA = memo((old, inited) => (a.get() > 0 ? 'positive' : 'negative'))
const memoB = memo(() => `Result: ${memoA()}`)
```

- 语义：值不变时不触发依赖更新。

### hookTrackSignal

```ts
hookTrackSignal(
  () => count.get() + user.get().age,
  (newValue, oldValue, inited) => {
    console.log('逻辑触发：', newValue, oldValue, inited)
    return () => {
      console.log('销毁/清理')
    }
  },
)
```

### addEffect

```ts
addEffect(() => {
  console.log('Signal 批量更新完成')
}, 1)
```

---

## 3. DOM 渲染速查（UI）

### 3.1 推荐：`zdom`（未来式）

```ts
zdom.div({
  attrs(m) {
    m.className = isActive.get() ? 'status active' : 'status'
    m.s_color = isActive.get() ? 'red' : 'blue'
  },
  onClick() {
    count.set(count.get() + 1)
  },
  children() {
    zdom.span({ children: `count: ${count.get()}` })
  },
})
```

### 3.2 性能版：`fdom`

```ts
fdom.div({
  s_color: () => (isActive.get() ? 'green' : 'gray'),
  data_testId: 'vibe-card',
  children() {
    fdom.p({ childrenType: 'text', children: () => `value:${count.get()}` })
  },
})
```

### 3.3 兼容式：`dom`（链式调用，现阶段不推荐）

```ts
dom.div({ className: 'box' }).render(() => {
  dom.span().renderTextContent(() => `hello-${count.get()}`)
})
```

---

## 4. 动态渲染（列表/条件/切换）

### renderIf

```ts
renderIf(
  () => isLoading.get(),
  () => fdom.div({ children: '加载中...' }),
  () => fdom.div({ children: '加载完成' }),
)
```

### renderOne / renderOneKey

```ts
renderOne(
  () => viewType.get(),
  (view) => {
    if (view === 'list') ListView()
    else GridView()
  },
)

renderOneKey(getAsyncResult, 'type', (key, get) => {
  if (key === 'success') fdom.div({ children: '成功' })
  else if (key === 'error') fdom.div({ children: '错误' })
})
```

### renderArrayKey

```ts
fdom.ul({
  children() {
    renderArrayKey(
      () => todos.get(),
      (todo) => todo.id,
      (getItem, getIndex, key) => {
        fdom.li({
          children() {
            return `${getIndex() + 1}. ${getItem().text}`
          },
        })
      },
    )
  },
})
```

---

## 5. 生命周期 + 清理

```ts
function TimerComponent() {
  const time = createSignal(new Date().toLocaleTimeString())

  addEffect(() => {
    console.log('组件构造完成')
  })

  const timer = setInterval(() => {
    time.set(new Date().toLocaleTimeString())
  }, 1000)

  hookDestroy(() => {
    clearInterval(timer)
  })

  fdom.div({
    children() {
      fdom.p({
        childrenType: 'text',
        children: () => `当前时间：${time.get()}`,
      })
    },
  })
}
```

---

## 6. 进阶 Vibe Coding 组合模板（可直接复制）

```ts
function VibeDemo() {
  const todos = createSignal([{ id: 1, text: '写 demo', done: false }])
  const text = createSignal('')

  const finishedCount = memo(() => todos.get().filter((t) => t.done).length)

  hookTrackSignal(
    () =>
      todos
        .get()
        .map((t) => t.done)
        .join(','),
    (newValue) => {
      addEffect(() => {
        console.log('完成数：', finishedCount())
      })
    },
  )

  fdom.div({
    children() {
      fdom.input({
        value: text.get(),
        onInput(e) {
          text.set(e.currentTarget.value)
        },
      })
      fdom.button({
        onClick() {
          todos.set([
            ...todos.get(),
            { id: Date.now(), text: text.get(), done: false },
          ])
          text.set('')
        },
        children: '加 Todo',
      })
      renderArrayKey(
        () => todos.get(),
        (item) => item.id,
        (getItem) => {
          fdom.div({
            children() {
              const item = getItem()
              fdom.label({
                children: [
                  fdom.input({
                    type: 'checkbox',
                    checked: item.done,
                    onChange() {
                      const list = todos
                        .get()
                        .map((x) =>
                          x.id === item.id ? { ...x, done: !x.done } : x,
                        )
                      todos.set(list)
                    },
                  }),
                  ` ${item.text}`,
                ],
              })
            },
          })
        },
      )
      fdom.p({ children: `完成：${finishedCount()}/${todos.get().length}` })
    },
  })
}
```

---

## 7. TODO/待补充（可按你自身 Vibe 加内容）

- [ ] `zdom` + `runGlobalHolder` 全局副作用仍需补充语义细节
- [ ] `renderArrayP` / `renderMap` / `renderSet` 的性能边界与 key 策略
- [ ] SSR/静态预渲染说明
- [ ] 表单双向绑定方案（hookEvent + autoTrack）

---

## 8. 请你选一个优先方向（我可接着再出具体文件）

1. 直接生成 `packages/mve/website/skills/vibe-coding.ts` 可直接导入（包含函数封装）
2. 生成一套 `VS Code snippet`（json）
3. 生成一套 `README` 风格 `mve` 速查大表

---

> 你现在已经有 `packages/mve/website/skills/vibe-coding.md`，可在任意项目里一键复用或更新。
