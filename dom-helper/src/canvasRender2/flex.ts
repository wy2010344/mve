import { createFlex } from '../canvasRender/layout/FlexLayout';
import { Node2, size } from './Node';

export const flex = createFlex<Node2>({
  size,
  findExt(n, c) {
    return n.exts.find(x => x instanceof c);
  },
});

// grow/align 是布局无关的 ext 对象（FlexLayout 经 exts 识别），
// canvasRender2 的 flex 直接复用，这里转出去方便 import
export { grow, align } from '../canvasRender/layout/FlexLayout';
