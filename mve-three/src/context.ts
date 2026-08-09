import {
  createContext,
  hookCurrentStateHolder,
  renderRoot,
  ShareConfig,
} from 'mve-core';
import { Mesh } from 'three';
import { EmptyFun } from 'wy-helper';

const ParentContext = createContext<Mesh>(undefined as any);

const scopedConfig: ShareConfig<any, any> = {
  purifyList(list) {
    return list;
  },
  after() {},
};

/**
 * 在子状态里渲染,使ParentContext只在当前作用域生效
 */
export function withParent(p: Mesh, fun: EmptyFun) {
  const state = hookCurrentStateHolder(true);
  const root = renderRoot(p, scopedConfig, function () {
    ParentContext.provide(p);
    fun();
  });
  state.addDestroy(() => {
    root.destroy();
  });
}

export function findParent() {
  return ParentContext.consume();
}
