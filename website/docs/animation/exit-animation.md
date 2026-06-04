# 视图切换动画

使用 `getExitAnimateArray` 实现列表项的进入/退出动画。

## 核心配置

- **mode**: `pop`(末尾动画) | `shift`(开头动画)
- **wait**: `normal`(同时) | `in-out`(进入后退出) | `out-in`(退出后进入)

## 基础用法

```typescript
import { getExitAnimateArray, renderArray, hookTrackSignal } from "mve-helper";

const list = createSignal([{ id: 1, name: "项目1" }]);

const getAnimatedList = getExitAnimateArray(list.get, {
  getKey: (item) => item.id,
  mode: () => "pop",
  wait: () => "normal",
});

fdom.ul({
  children() {
    renderArray(getAnimatedList, (row) => {
      const div = fdom.li({ children: () => row.value().name });

      hookTrackSignal(row.step, (step) => {
        if (!row.promise()) return;

        if (step === "enter") {
          animate(div, { x: ["100%", 0] }).then(row.resolve);
        } else if (step === "exiting") {
          animate(div, { x: [0, "100%"] }).then(row.resolve);
        }
      });

      return div;
    });
  },
});
```

## ExitModel 接口

```typescript
interface ExitModel<V, K> {
  value: GetValue<V>; // 数据
  key: K; // 唯一标识
  step: GetValue<string>; // 动画步骤: "enter" | "exiting" | "will-exiting"
  resolve: () => void; // 完成回调
  promise: GetValue<Promise<void> | undefined>; // 动画Promise
}
```

## 完整示例

```typescript
function AnimatedList() {
  const list = createSignal([{ id: 1, text: "项目1" }]);
  const mode = createSignal<"pop" | "shift">("pop");

  const getAnimatedList = getExitAnimateArray(list.get, {
    getKey: (item) => item.id,
    mode: () => mode.get(),
    enterIgnore: (item, inited) => !inited && list.get().length === 1,
  });

  fdom.div({
    children() {
      // 控制按钮
      fdom.button({
        onClick: () => mode.set(mode.get() === "pop" ? "shift" : "pop"),
        children: () => `模式: ${mode.get()}`,
      });

      // 动画列表
      fdom.ul({
        children() {
          renderArray(getAnimatedList, (row) => {
            const item = fdom.li({
              children() {
                fdom.span({ children: () => row.value().text });
                fdom.button({
                  onClick: () =>
                    list.set(list.get().filter((i) => i.id !== row.key)),
                  children: "删除",
                });
              },
            });

            hookTrackSignal(row.step, (step) => {
              if (!row.promise()) return;

              if (step === "enter") {
                animate(
                  item,
                  { x: ["100%", 0], opacity: [0, 1] },
                  { duration: 0.3 }
                ).then(row.resolve);
              } else if (step === "exiting") {
                animate(
                  item,
                  { x: [0, "-100%"], opacity: [1, 0] },
                  { duration: 0.25 }
                ).then(row.resolve);
              }
            });

            return item;
          });
        },
      });

      // 添加按钮
      fdom.button({
        onClick: () =>
          list.set([
            ...list.get(),
            { id: Date.now(), text: `项目${Date.now()}` },
          ]),
        children: "添加",
      });
    },
  });
}
```

## 高级特性

**动画回调**

```typescript
const getAnimatedList = getExitAnimateArray(list.get, {
  getKey: (item) => item.id,
  onEnterComplete: () => console.log("进入完成"),
  onExitComplete: () => console.log("退出完成"),
});
```

**条件忽略**

```typescript
const getAnimatedList = getExitAnimateArray(list.get, {
  getKey: (item) => item.id,
  enterIgnore: (item, inited) => !inited, // 初始化时不动画
  exitIgnore: (item) => item.skipAnimation, // 条件跳过
});
```

**动画步骤**: `will-enter` → `enter` → `will-exiting` → `exiting`

## 最佳实践

- 进入动画 300ms，退出动画 250ms
- 使用 `enterIgnore` 避免初始化动画
- 动画失败时调用 `row.resolve()` 确保流程继续
