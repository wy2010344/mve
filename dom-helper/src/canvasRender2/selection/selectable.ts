import type { Node2 } from '../tree/protocol';
import type { Selectable2 } from '../tree/interaction';

/**
 * 「可选文本」能力对象的三件事：标记扩展、兜底消息、从树里收集。
 *
 * 节点不把 positionForPoint / textInRange 这些挂到自己身上（那会让节点结构体
 * 长出一堆可选字段，强类型语言没法复刻），而是把能力对象塞进 `exts`，
 * 用 [SelectableExt] 这个**标记**告诉外面「我有这个能力」。
 * 外面一律经 [asSelectable2] 问节点要——节点只回答 `findExt` 一条消息。
 *
 * ```ooc
 * // exts 里的标记（类来自 JS 桥接，ooc 只是持有一个不透明值）
 * node = { exts = [...(p exts) (js new SelectableExt selectable)], ... }
 * ```
 */

/** 可选文本扩展：挂在节点 `exts` 上的标记载体 */
export class SelectableExt {
  constructor(readonly impl: Selectable2) {}
}

/**
 * 可选文本能力的**兜底消息**：不具备分词 / 分段能力的实现直接 merge 它。
 *
 * 这是「每条消息都答得出来」的落点——选择器因此可以直接
 * `sel wordRangeAt off`，不必先问"你有没有这个方法"（ooc 问不出来）。
 */
export const selectableDefaults: Pick<
  Selectable2,
  'wordRangeAt' | 'paragraphRangeAt'
> = {
  wordRangeAt: () => null,
  paragraphRangeAt: () => null,
};

/** 节点是否为可选文本区域（从 exts 里的 SelectableExt 识别，无需注册） */
export function asSelectable2(node: Node2): Selectable2 | null {
  // 统一走节点的 findExt 消息：exts 集合本身是隐藏实现，节点只回答"有没有这个扩展"
  return node.findExt(SelectableExt)?.impl ?? null;
}

/**
 * 文档序收集可选文本（前序遍历）：`selectionEnabled()` 为 false 的节点剪掉整棵子树。
 * 可选节点内部仍可嵌套可选节点，所以命中后继续往下走。
 */
export function collectSelectables(node: Node2, out: Selectable2[]): void {
  for (const child of node.children()) {
    if (!child.selectionEnabled()) continue;
    const sel = asSelectable2(child);
    if (sel) out.push(sel);
    collectSelectables(child, out);
  }
}
