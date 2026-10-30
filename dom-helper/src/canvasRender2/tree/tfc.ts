import type { StateHolder } from 'mve-core';
import type { Node2 } from './protocol';

/**
 * 组件工厂（对标 Compose 的无状态 `@Composable` / SwiftUI 的 `View` / ooc 的 composable）：
 *
 * `fc(f)` 把 `f(ctx, ...vs)` 包成 `create(...vs) => (ctx) => void`，返回的本身即是
 * `create`——调用 `component(arg)` 直接得到 `Fc`（子表达式），放进 children 即可。
 *
 * **不再有柯里化的两段式（旧 `tfc` / `.of()` / `.create()`）**：节点句柄是普通的
 * `arg.nodeRef`（见 `Node2Arg.nodeRef`，可选），最底层 `node2` 负责 `ref.set(node)` 收尾；
 * 调用方要拿节点句柄时自建 `storeRef` 填进 `arg.nodeRef` 即可。这与 ooc 完全同形
 * （组件即普通函数、参数直接传，没有 ref 的柯里化包装），便于迁移。
 *
 * `ref` 的初值是 undefined（Rust：`Rc<RefCell<Option<M>>>`），工厂函数体内自己
 * 负责 `ref.set(node)`，因此外部不要假设构造期就能 `.get()`（要父节点走
 * `ctx.getParent()`）。
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
