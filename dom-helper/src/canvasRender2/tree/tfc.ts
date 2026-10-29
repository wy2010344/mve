import { storeRef } from 'wy-helper';
import type { StoreRef } from 'wy-helper';
import type { StateHolder } from 'mve-core';
import type { Node2 } from './protocol';

/**
 * 函数式节点工厂（对标 Kotlin 的 `Node(...)` 构造器 + 组合函数）：
 * - `create(...vs)` → `(ref) => Fc`：外部先给 ref（`nodeOf` 场景），再应用；
 * - `of(...vs)` → `Fc`：自建 ref，直接放进 children 数组。
 *
 * 两个函数都**不依赖 this**（用闭包互调）：这样 `const { of } = rectNode` 解构后
 * 仍可调用，且与 Rust 的"两个自由函数 + 工厂结构体"一一对应。
 *
 * 不需要句柄、只做节点组合的组件用 [fc]（不分配 `StoreRef`）。
 *
 * `ref` 的初值是 undefined（Rust：`Rc<RefCell<Option<M>>>`），工厂函数体内自己
 * 负责 `ref.set(node)`，因此外部不要假设构造期就能 `.get()`（要父节点走
 * `ctx.getParent()`）。
 *
 * 类似react的forwardRef
 */
export function tfc<
  M,
  F extends (
    ctx: StateHolder<Node2, readonly Node2[]>,
    get: StoreRef<M>,
    ...vs: any[]
  ) => void,
>(f: F) {
  type Args = Parameters<F> extends [any, any, ...infer Args] ? Args : never;
  function create(...vs: Args) {
    return function (ref: StoreRef<M>) {
      return function (ctx: StateHolder<Node2, readonly Node2[]>) {
        f(ctx, ref, ...vs);
      };
    };
  }
  function of(...vs: Args) {
    const ref = storeRef<M>(undefined!);
    return create(...vs)(ref);
  }
  return { of, create };
}

/**
 * 无句柄的组合组件（对标 Compose 的无状态 `@Composable` / SwiftUI 的 `View`）。
 *
 * 与 [tfc] 的唯一区别是**不接收 `StoreRef`**：`create(...vs)` 直接返回 `Fc`，
 * 可以直接放进 children 数组或调用。
 *
 * 选 `fc`：只负责把子节点摆好、事后不需要读/写这个节点。
 * 选 `tfc`：
 * - 节点消息里要读自身尺寸/位置（`size`/`position` 闭包 `ref.get()`）；
 * - 需要 `create(...)(ref)`（外部先给 ref，再应用）；
 * - 工厂内部要 `ref.set(node)` 收尾。
 */
export function fc<
  F extends (ctx: StateHolder<Node2, readonly Node2[]>, ...vs: any[]) => void,
>(f: F) {
  type Args = Parameters<F> extends [any, ...infer Args] ? Args : never;

  return function create(...vs: Args) {
    return function (ctx: StateHolder<Node2, readonly Node2[]>) {
      f(ctx, ...vs);
    };
  };
}
