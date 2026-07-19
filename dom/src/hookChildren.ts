import { createRenderChildren, hookCurrentStateHolder } from 'mve-core';
import { diffMove, emptyFun, SetValue } from 'wy-helper';
import { renderChildrenOperate } from 'wy-dom-helper';
const a = createRenderChildren(
  diffMove(renderChildrenOperate),
  function (node, callback) {
    return hookCurrentStateHolder(true).renderNode(node, emptyFun, callback);
  }
);

export function renderChildren(n: Node, render: SetValue<Node>) {
  a.renderChildren(n, function (a) {
    render(a.node);
  });
}

export const renderPortal = a.renderPortal;
