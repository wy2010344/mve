import { storeRef, StoreRef } from 'wy-helper';
import { Fc, Node2, TFc } from './Node';

/**
 * canvasRender2 的公开出口。
 *
 * 目录按「能不能原样搬去 ooc」分层：
 * - `tree/`     节点消息协议 + 纯消息算法（几何 / 派发 / 焦点 / 指针 / 键盘）
 * - `geom/`     点 / 矩形 / 路径（纯数据 + 消息）
 * - `selection/`可选文本标记 + 选择器（`createSelectionManager`）
 * - `editable/` 编辑器内核（显示层 / 段落 / 光标几何 / 交互状态机）
 * - 根目录       各节点工厂（`merge(arg, defaults)` + `merge(自有消息, p)`）
 */
export * from './Node';
export * from './Renderer';
export * from './SelectionManager';
export * from './flex';
export * from './ImageNode';
export * from './RichTextNode';
export * from './RectNode';
export * from './WrappedTextNode';
export * from './Scroll';
export * from './ScrollBar';
export * from './OverlayScrollBar';
export * from './ForEachNode';
export * from './UndoRedo';
export * from './TextDefaults';
export * from './UrlOpener';
export * from './Pop';
export * from './helper/Toast';
export * from './helper/Popover';
export * from './TabRender';
export * from './Geometry';
export * from './Graphemes';
export * from './Clipboard';
export * from './Focus';
export * from './EditableTextNode';
export * from './editable/params';
export * from './editable/view';
export * from './editable/paragraph';
export * from './editable/caret';
export * from './editable/selectable';
export * from './editable/editor';
export * from './editable/richSegments';
export * from './util';
export type { PlatformImage } from '../canvasCore/Image';
// 共用层（与树形态无关，两套树共用同一份实现）
export * from '../canvasCore/Timer';
export * from '../canvasCore/ImageLoader';
export * from '../canvasCore/Placement';

export function nodeOf<A, B>(
  callback: (ref: StoreRef<A>) => (node: StoreRef<A>) => B
) {
  const node = storeRef<A>(undefined!);
  // 第一次传递，充当this，供回调访问最终结果，
  // 第二次传递，在真实场合去应用
  return callback(node)(node);
}
