# mve

要开启一个 mve 项目[vite](https://vite.dev/),选择 vanilla 模式,推荐使用 typescript,一切准备好后,至少需要依赖这些包:

```
wy-helper wy-dom-helper mve-core mve-helper mve-dom mve-dom-helper
```

> 其中 wy-helper、wy-dom-helper 是自用的 js 库,涉及知识较杂.因为可能会面临按需加载不相关的知识的库,具体参照 wy-helper、wy-dom-helper

> mve 区分核心库与辅助库,故共分成了 4 个包.
> 调整内容:

main.ts

```ts
import { createRoot } from "mve-dom";
const app = document.querySelector<HTMLDivElement>("#app")!;
const destroy = createRoot(app, () => {
  //业务代码放在这里
});
window.addEventListener("unload", destroy);
```

## 一个简单的 count demo

```ts
const count = createSignal(0);
fdom.button({
  onClick() {
    count.set(count.get() + 1);
  },
  childrenType: "text",
  children() {
    return `count - ${count.get()}`;
  },
});
```

放在上面 main.ts 里备注的放业务代码的地方.

## 一个 todo demo

导入内容为

```ts
import { fdom } from "mve-dom";
import { renderArray } from "mve-helper";
import { createSignal, emptyArray } from "wy-helper";
```

将下面的内容添加到上述业务代码位置.

```ts
const list = createSignal(emptyArray as number[]);
renderArray(list.get, (row, getIndex) => {
  fdom.div({
    children() {
      fdom.span({
        childrenType: "text",
        children() {
          return `第${getIndex() + 1}行,内容是${row}`;
        },
      });
      fdom.button({
        childrenType: "text",
        children: "删除",
        onClick() {
          list.set(list.get().filter((x) => x != row));
        },
      });
    },
  });
});
fdom.button({
  childrenType: "text",
  children: "添加",
  onClick() {
    list.set(list.get().concat(Date.now()));
  },
});
```

## 核心方法

- [createSignal](https://github.com/wy2010344/wy-helper/blob/main/wy-helper/src/signal.ts) (wy-helper) 因为也可以用于其它框架,故提升到这一层
- [memo](https://github.com/wy2010344/wy-helper/blob/main/wy-helper/src/signal.ts) (wy-helper) 核心的依赖缓存,在需要求值时比较依赖变化,有变化才执行.[memo 原理](https://github.com/wy2010344/wy-helper/blob/main/wy-helper/docs/memo的原理.md)
- [addLevelEffect](https://github.com/wy2010344/wy-helper/blob/main/wy-helper/src/signal.ts) (wy-helper) 与信号一起,在信号完成后执行

- renderForEach (mve-core)

  - renderArray
  - renderIf
  - renderOne

- hookAddDestroy

  - hookDestroy

- createContext (mve-core)

## 动机

1. react 的动画,比如 frame-motion,reanimated,其运动值是脱离状态系统的,因此存在两套状态系统,两套系统之间同步非常困难.
2. react 的使用者对其反复 render 很敏感,虽然其实影响不大,但经常自建一套信号系统来优化它.

我曾经对 vue 的依赖更新很痴迷,通过学习各种第三方总结,掌握了依赖更新的原理,实现了最基础的 mve,但相比 react 显得复杂,而且无法解决原子信号的问题,所以 mve 库一直处于废弃状态.最近我突然有了解决批量更新与惰性求值的方案,加之 signal 也开始盛行起来,我这里给出我的解决方案.

使用 signal,典型如 SolidJS,你需要传递一个 get 函数而不是值,来获得动态更新,因为构造的过程只执行一次(不像 react 反复执行).mve 也是类似的. 传递 get 函数很不直观, 但却是必然的方法. 我倾向于用“电路与电流”或“血管与血液”来描述这种状态.

react 是瀑布式地向下更新,这个库实现的目标,是没有明显的树形约束.信号(状态)可能从父级流向子级,也可能从子级流向父级.只要保证它的最终流向是无循环的.这其实也可以统一布局的计算.

也就意味着钻石依赖其实是允许的.

通过一定的 memo,但钻石依赖的孙节点,一般可以只执行一次:

通过批量与 memo,不仅解决了原子更新时的事件响应问题,还避免了大量重复执行.内部还有尽可能延迟生效的机制.
