import {
  LineRect,
  PlatformParagraph,
  RectStyle,
  TextRect,
} from '../../canvasCore/Paragraph';
import { coerce } from './view';

/**
 * # 光标几何：全是「向段落对象发消息」的纯函数
 *
 * 只依赖 [PlatformParagraph] 的查询接口（矩形 / 行盒 / 字形位置），
 * 不碰节点、不碰状态——所以这层可以原样搬到 ooc（那边把段落对象换成
 * 桥接出来的同形对象即可），也可以直接单测。
 *
 * 两个容易踩的点写在各函数注释里：
 * - 光标矩形要用「后一个字符」的 left，文末退回「前一个字符」的 right；
 * - 上下移动要用**行盒中心**命中所属行，不能拿光标矩形高度当行距。
 */

/**
 * 光标所在位置的矩形列表。
 * 优先取光标**后一个字符**的矩形（它的 left 就是插入点）；
 * 文末取不到时退回前一个字符的矩形（插入点在其 right）。
 */
export function caretRectsOf(
  paragraph: PlatformParagraph,
  dpos: number
): TextRect[] {
  const list = paragraph.getRectsForRange(dpos, dpos + 1, RectStyle.TIGHT);
  if (list.length) return list;
  if (dpos > 0) {
    return paragraph.getRectsForRange(dpos - 1, dpos, RectStyle.TIGHT);
  }
  return [];
}

/**
 * 光标插入点的横坐标（`preferredX` 的来源）。
 *
 * 用插入点而不是字符矩形中心：中心正好落在两个字符之间的临界点上，
 * CanvasKit 的取整方向会让列位置左右抖动。
 */
export function caretInsertXOf(
  paragraph: PlatformParagraph,
  dpos: number
): number | null {
  const at = paragraph.getRectsForRange(dpos, dpos + 1, RectStyle.TIGHT)[0];
  if (at) return at.left;
  if (dpos > 0) {
    const prev = paragraph.getRectsForRange(dpos - 1, dpos, RectStyle.TIGHT)[0];
    if (prev) return prev.right;
  }
  return null;
}

/** 全部软行（布局层行边界） */
export function linesOf(paragraph: PlatformParagraph): LineRect[] {
  return paragraph.getLineMetrics();
}

/**
 * 光标所在软行的行索引：拿光标矩形的**竖直中心**去命中行盒（top/bottom）。
 *
 * 不能拿光标矩形高度当行距——TIGHT 矩形高度由字形度量决定，与行高
 * （lineHeightMultiplier）无关；两者不相等时按「矩形高度」走一步会落到
 * 隔壁的隔壁行，表现就是上下键一次跳两行。
 * 命中不到（例如空行）时退化为竖直距离最近的一行。
 */
export function caretLineIndexOf(
  paragraph: PlatformParagraph,
  rect: { top: number; bottom: number }
): number {
  const lines = linesOf(paragraph);
  if (lines.length === 0) return -1;
  const cy = rect.top + (rect.bottom - rect.top) / 2;
  let nearest = 0;
  let nearestDist = Infinity;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (cy >= l.top && cy < l.bottom) return i;
    const d = cy < l.top ? l.top - cy : cy - l.bottom;
    if (d < nearestDist) {
      nearestDist = d;
      nearest = i;
    }
  }
  return nearest;
}

/**
 * 第 [index] 条软行、横坐标为 [x] 处的文本偏移（行盒中心高度处求字素位置）。
 * 越界的 index 会被钳制到合法范围。
 */
export function offsetOnLineAt(
  paragraph: PlatformParagraph,
  index: number,
  x: number
): number | null {
  const lines = linesOf(paragraph);
  if (lines.length === 0) return null;
  const line = lines[coerce(index, 0, lines.length - 1)];
  if (!line) return null;
  const y = (line.top + line.bottom) / 2;
  return paragraph.getGlyphPositionAtCoordinate(x, y);
}

/** 段落内某点（段落坐标系）对应的文本偏移 */
export function offsetAt(
  paragraph: PlatformParagraph,
  x: number,
  y: number
): number {
  return paragraph.getGlyphPositionAtCoordinate(x, y);
}

/**
 * 单行水平滚动偏移：让光标留在内容盒内，且不超过可滚范围。
 * [box] 是内容盒宽（已扣 padding），[caret] 是光标矩形（段落坐标系）。
 */
export function scrollXOf(
  paragraph: PlatformParagraph,
  box: number,
  caret: TextRect | null
): number {
  const left = caret?.left ?? 0;
  const right = caret?.right ?? left;
  let off = right > box ? right - box : 0;
  if (left - off < 0) off = left;
  return coerce(off, 0, Math.max(0, paragraph.width() - box));
}
