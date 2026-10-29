import { createContext } from 'mve-core';
import type { StateHolder } from 'mve-core';
import { createSignal, emptyArray } from 'wy-helper';
import type { Fc, Node2 } from './Node';
import { forEachNode } from './ForEachNode';

/**
 * Pop / Toast 浮层登记处（对标 Kotlin `EngineGlobal.appendPop/appendToast`
 * 与 `Register` 里的两个信号列表）。
 *
 * 为什么是"登记处 + 列表信号"而不是"把浮层塞进业务 children"：
 * - 浮层（右键菜单 / 下拉 / Toast）要在**最上层**绘制，且不能参与业务布局，
 *   由渲染器在根节点的 children 末尾统一展开（顺序即绘制顺序 = 层叠顺序）；
 * - 业务侧只管 `appendPop(...)` / `removePop(...)`，拿到句柄即可关闭，
 *   不需要持有节点、不需要知道容器在哪；
 * - 列表是信号，增删自然驱动重绘；渲染器销毁时 [PopRegistry.clear] 一次清空。
 *
 * 与 Kotlin 的差别：Kotlin 的 `Pop.render(holder)` 是接口方法（继承式），
 * 这里存的是一段 Fc（函数式），与整棵树同形，ooc 侧直接是闭包。
 */

/** 浮层的一段内容：拿到该浮层自己的渲染上下文即可建节点 */
export interface Pop2 {
  readonly render: Fc;
}

/** Toast 与 Pop 同形（Kotlin 里也是两个平行接口），列在各自的清单里 */
export type Toast2 = Pop2;

export interface PopRegistry {
  popList(): readonly Pop2[];
  toastList(): readonly Toast2[];
  /** 追加一个浮层，返回句柄（传给 [PopRegistry.removePop] 关闭） */
  appendPop(render: Fc): Pop2;
  removePop(pop: Pop2): boolean;
  /** 追加一个 toast，返回句柄 */
  appendToast(render: Fc): Toast2;
  removeToast(toast: Toast2): boolean;
  /** 清空两层（渲染器销毁时调用，避免浮层活得比树还久） */
  clear(): void;
}

/**
 * 列表信号的增删（两个清单走同一套逻辑）。
 * 用信号是为了让"加一个 / 删一个"自然驱动重绘——与焦点、选区同一手法。
 */
function createList() {
  const list = createSignal<readonly Pop2[]>(emptyArray);
  return {
    get: () => list.get(),
    append(render: Fc): Pop2 {
      const pop: Pop2 = { render };
      list.set(list.get().concat([pop]));
      return pop;
    },
    remove(pop: Pop2): boolean {
      const old = list.get();
      const index = old.indexOf(pop);
      if (index < 0) return false;
      const next = old.slice();
      next.splice(index, 1);
      list.set(next);
      return true;
    },
    clear() {
      list.set(emptyArray);
    },
  };
}

export function createPopRegistry(): PopRegistry {
  const pops = createList();
  const toasts = createList();
  return {
    popList: pops.get,
    toastList: toasts.get,
    appendPop: pops.append,
    removePop: pops.remove,
    appendToast: toasts.append,
    removeToast: toasts.remove,
    clear() {
      pops.clear();
      toasts.clear();
    },
  };
}

/** 浮层登记处的上下文（业务节点经它拿到登记处，不必层层传参） */
export const popRegistryContext = createContext<PopRegistry | null>(null);

/** 浮层清单 → 子表达式：动态增删按 key 增量复用 / 销毁（走 forEachNode） */
function layerOf(list: () => readonly Pop2[]): Fc {
  return forEachNode<Pop2, Pop2, void>(
    callback => {
      for (const pop of list()) {
        callback(pop, pop);
      }
    },
    function (pop) {
      pop.render(this);
    }
  );
}

/** Pop 层：渲染器把它放在根节点 children 的末尾（在 Toast 层之前） */
export function popLayer(registry: PopRegistry): Fc {
  return layerOf(registry.popList);
}

/** Toast 层清单（供 [toastContainer] 展开） */
export function toastLayer(registry: PopRegistry): Fc {
  return layerOf(registry.toastList);
}

/**
 * 在节点内取浮层登记处（对标 Kotlin `context.consume(engineGlobalContext)`）。
 * 拿不到时返回 null——headless 测试里没有渲染器也能安全构造节点。
 */
export function usePopRegistry(
  ctx: StateHolder<Node2, readonly Node2[]>
): PopRegistry | null {
  return ctx.consume(popRegistryContext);
}
