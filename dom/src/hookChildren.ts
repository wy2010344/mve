import {
  createRenderChildren,
  hookCurrentStateHolder,
  purifyList,
  renderRoot,
  ShareConfig,
  StateHolderWithNode,
} from 'mve-core';
import { alawaysFalse, diffMove, SetValue } from 'wy-helper';
import { renderChildrenOperate } from 'wy-dom-helper';
const config: ShareConfig<Node, readonly Node[]> = {
  purifyList(list) {
    const newList: Node[] = [];
    purifyList(list, newList, alawaysFalse);
    return newList;
  },
  after(a) {},
};
const a = createRenderChildren(
  diffMove(renderChildrenOperate),
  function (node, callback, didAdd) {
    const state = hookCurrentStateHolder(true);
    if (didAdd) {
      state.addNode(node);
    }
    return state.renderNode(node, callback);
  },
  function (node, callback) {
    return renderRoot(node, config, callback);
  }
);

export function renderChildren(
  n: Node,
  render: (this: StateHolderWithNode<Node, readonly Node[]>, n: Node) => void
) {
  a.renderChildren(n, function () {
    render.call(this, this.node);
  });
}

export const renderPortal = a.renderPortal;

export const createRoot = a.createRoot;
