import { Node2, size } from './Node';
import { createFlex } from '../canvasCore/FlexLayout';

export const flex = createFlex<Node2>({
  size,
});

// grow/align 是布局无关的 ext 对象（FlexLayout 经 exts 识别），
// canvasRender2 的 flex 直接复用，这里转出去方便 import
export { grow, align } from '../canvasCore/FlexLayout';
