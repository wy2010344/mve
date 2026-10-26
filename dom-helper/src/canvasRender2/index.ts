import { Fc, Node2, TFc } from './Node';

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
export * from './ForEachNode';
export * from './UndoRedo';
export * from './TextDefaults';
export * from './UrlOpener';
export * from './TabRender';
export * from './Geometry';
export * from './Graphemes';
export * from './Clipboard';
export * from './Focus';
export * from './EditableTextNode';
export * from './util';
export type { PlatformImage } from '../canvasRender/PlatformImage';

export function nodeOf(callback: (node: Node2) => TFc) {
  const node = {} as Node2;
  // 第一次传递，充当this，供回调访问最终结果，
  // 第二次传递，在真实场合去应用
  return callback(node)(node);
}
