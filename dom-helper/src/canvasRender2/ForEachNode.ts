import type {
  Creater,
  EachTime,
  RenderForEachArg,
  StateHolder,
  StateHolderWithNode,
} from 'mve-core';
import { emptyFun, GetValue } from 'wy-helper';
import type { Fc, Node2 } from './Node';
/**
 * 列表组件（Fc 形态，对标 mve-core 的 renderForEach）：
 * 自身不产生节点，直接在父节点的 children 里动态管理一组子节点——
 * 数据变化时按 key 增量复用/销毁（新增只建一个、删除只毁一个），
 * 节点生命周期挂在渲染树上，容器销毁即全部清理。
 *
 * 用法（children 数组里的一项）：
 *   rectNode({
 *     children: [
 *       forEachNode<Todo, number>(
 *         cb => todos().forEach(t => cb(t.id, t)),
 *         function (key, eachTime) {
 *           // this 即该项的 Fc 上下文（父节点为外层容器节点）
 *           todoItem({ todo: eachTime.getValue() })(this);
 *         }
 *       ),
 *     ],
 *   })
 */
export function forEachNode<T, K, O = void>(
  forEach: (callback: (key: K, value: T) => GetValue<O>) => void,
  creater: Creater<Node2, readonly Node2[], T, K, O>,
  arg?: RenderForEachArg<K>
): Fc {
  return function (ctx: StateHolder<Node2, readonly Node2[]>) {
    ctx.renderForEach(forEach, creater, arg);
  };
}

export function ifNode(
  condition: () => any,
  whenTrue: (this: StateHolder<Node2, readonly Node2[]>) => void,
  whenFalse: (this: StateHolder<Node2, readonly Node2[]>) => void = emptyFun
) {
  return forEachNode(
    callback => {
      const v = Boolean(condition());
      callback(v, v);
    },
    function (key) {
      if (key) {
        whenTrue.call(this);
      } else {
        whenFalse.call(this);
      }
    }
  );
}
