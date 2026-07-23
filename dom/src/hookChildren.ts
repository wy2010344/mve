import {
  createRenderChildren,
  hookCurrentStateHolder,
  renderListRoot,
} from 'mve-core';
import { diffMove, emptyFun, SetValue } from 'wy-helper';
import { renderChildrenOperate } from 'wy-dom-helper';
const a = createRenderChildren(
  diffMove(renderChildrenOperate),
  function (node, callback) {
    const state = hookCurrentStateHolder(true);
    state.addNode(node);
    return state.renderListNode(node, emptyFun, callback);
  },
  function (node, callback) {
    return renderListRoot(node, emptyFun, callback);
  }
);

export function renderChildren(n: Node, render: SetValue<Node>) {
  a.renderChildren(n, function () {
    render(this.node);
  });
}

export const renderPortal = a.renderPortal;

export const createRoot = a.createRoot;
