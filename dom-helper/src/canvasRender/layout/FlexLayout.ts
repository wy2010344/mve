import { LayoutNode, outerSize } from '../LayoutNode';
import { createFlex } from '../../canvasCore/FlexLayout';

/**
 * flex 布局算法是**与树形态无关**的纯布局数学，两套树共用一份
 * （实现在 `src/canvasCore/FlexLayout.ts`）；这里只是把它实例化到旧版
 * LayoutNode 上（`createFlex` 需要一个"取外尺寸"的实现）。
 */
export * from '../../canvasCore/FlexLayout';

export const flex = createFlex<LayoutNode>({
  size(n, d) {
    return outerSize.call(n, d);
  },
});
