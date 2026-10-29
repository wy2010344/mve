import { createContext } from 'mve-core';
import type { SelectionManager2 } from './selection/manager';

/**
 * 选择器的公共门面（只做 re-export + context，不放实现）。
 *
 * 实现拆在 `selection/` 下：
 * - `selection/selectable`  可选文本标记（`SelectableExt`）、兜底消息、树遍历收集
 * - `selection/manager`     `createSelectionManager(source)`：范围分配与聚合
 *
 * 交互数据的形状（`Rect2` / `Selectable2` / `SelPair2` / `HitestResult2` /
 * `PointerSelect2`）住在 `tree/interaction`：那一层只认数据、不认识选择器，
 * TS 与 ooc 共用。这里再导出一次，既有 `from './SelectionManager'` 的导入路径不变。
 */
export * from './selection/selectable';
export * from './selection/manager';
export type {
  HitestResult2,
  PointerSelect2,
  Rect2,
  SelPair2,
  SelPoint2,
  Selectable2,
} from './tree/interaction';
/** 双击后的词级拖拽扩展（实现随指针状态机在 tree/pointer） */
export { expandWordSelection } from './tree/pointer';

/** 选择器实例的注入点（Renderer 提供，节点读取） */
export const selectionManagerContext = createContext<SelectionManager2 | null>(
  null
);
