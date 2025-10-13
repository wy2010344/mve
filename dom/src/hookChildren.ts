import { AppendList, createRenderChildren } from 'mve-core';
import { SetValue } from 'wy-helper';
import { renderChildrenOperate } from 'wy-dom-helper';
const a = createRenderChildren<Node>(renderChildrenOperate);

export function renderChildren(n: Node, render: SetValue<Node>) {
  (n as any)._mve_children_ = a.renderChildren(n, render);
}

export function collect<T extends Node, V = void>(n: T, fun: (n: T) => V) {
  const _mve_children_ = (n as any)._mve_children_ as AppendList<Node, T>;
  if (!_mve_children_) {
    throw '非定义节点';
  }
  return _mve_children_.collect(fun);
}

export const renderPortal = a.renderPortal;
