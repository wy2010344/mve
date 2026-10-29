import {
  PlatformParagraph,
  RectStyle,
} from '../../canvasCore/Paragraph';
import { Graphemes, Words } from '../Graphemes';
import { Node2, absoluteX, absoluteY } from '../Node';
import { Selectable2, SelectionManager2 } from '../SelectionManager';
import { rectOf } from '../geom/rect';
import { EditableTextView, coerce } from './view';

/**
 * # 编辑器的「可选文本」能力对象
 *
 * 只做两件事：把全局坐标换算成文本偏移、把选中的一段汇报成矩形与文本。
 * **选区真相不在这里**——范围由 SelectionManager 分配，本对象只读
 * `rangeOf(自己)`，没有任何反向写回（所以跨组件拖选天然成立）。
 *
 * 之所以独立成模块：它是一个**能力对象**（塞进 exts，经 SelectableExt 识别），
 * 生命周期与编辑器的光标状态无关；移植到 ooc 时就是一个带六个方法的对象，
 * 依赖的五条消息（text / view / paragraph / node / scrollX）从闭包拿。
 */

/** 六条消息之外的依赖（都是"问一句就答"的读取） */
export interface EditableSelectableDeps {
  /** 模型文本（逻辑文本，未展开 tab） */
  text(): string;
  /** 显示层：逻辑索引 ↔ 显示索引 */
  view: EditableTextView;
  /** 当前段落（空文本时为 null） */
  paragraph(): PlatformParagraph | null;
  /** 本节点（取绝对坐标与 padding） */
  node(): Node2;
  /** 全局选择器（未提供时退化为单节点行为） */
  selectionManager(): SelectionManager2 | null;
  /** 单行水平滚动偏移（绘制时内容整体左移了多少） */
  scrollX(): number;
  /** 文本原点 y（内容盒上缘 + 单行墨迹补偿），必须与绘制共用 */
  textOriginY(): number;
}

export function createEditableSelectable(
  deps: EditableSelectableDeps
): Selectable2 {
  const selectable: Selectable2 = {
    selectionRect() {
      const range = deps.selectionManager()?.rangeOf(selectable) ?? null;
      if (!range || range[1] <= range[0]) return null;
      const para = deps.paragraph();
      if (!para) return null;
      const view = deps.view;
      const rects = para.getRectsForRange(
        view.logicToDisplay(range[0]),
        view.logicToDisplay(range[1]),
        RectStyle.TIGHT
      );
      if (rects.length === 0) return null;
      const self = deps.node();
      const first = rects[0];
      const last = rects[rects.length - 1];
      // 单行溢出时内容整体左移 scrollX，对外（浮层定位）坐标同样要左移
      const x = absoluteX(self) + self.paddingInlineStart() - deps.scrollX();
      const y = absoluteY(self) + deps.textOriginY();
      return rectOf(
        x + Math.min(first.left, last.left),
        y + Math.min(first.top, last.top),
        x + Math.max(first.right, last.right),
        y + Math.max(first.bottom, last.bottom)
      );
    },
    textLength() {
      return deps.text().length;
    },
    positionForPoint(globalX: number, globalY: number) {
      const para = deps.paragraph();
      if (!para) return 0;
      const self = deps.node();
      const offset = para.getGlyphPositionAtCoordinate(
        // 绘制时内容整体左移了 scrollX，命中测试要加回来
        globalX - absoluteX(self) - self.paddingInlineStart() + deps.scrollX(),
        globalY - absoluteY(self) - deps.textOriginY()
      );
      return coerce(deps.view.displayToLogic(offset), 0, deps.text().length);
    },
    textInRange(start: number, end: number) {
      const t = deps.text();
      return end > start ? t.substring(start, Math.min(end, t.length)) : '';
    },
    wordRangeAt(offset: number) {
      return Words.wordRangeAt(deps.text(), offset);
    },
    paragraphRangeAt(offset: number) {
      const t = deps.text();
      if (t.length === 0) return null;
      // '\n' 分隔的逻辑段落；点在换行符上归前段，末段延伸到文末
      const d = coerce(offset, 0, t.length);
      const start = d === 0 ? 0 : t.lastIndexOf('\n', d - 1) + 1;
      const nl = t.indexOf('\n', d);
      return [start, nl === -1 ? t.length : nl];
    },
  };
  return selectable;
}
