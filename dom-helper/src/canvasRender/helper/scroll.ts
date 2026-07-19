import { hookCurrentStateHolder } from 'mve-core';
import { ScrollNode } from '../ScrollNode';

export function renderScroll(arg: Partial<ScrollNode>) {
  const node = new ScrollNode(hookCurrentStateHolder(true), arg);
  return node;
}
