import type { PlatformParagraph } from './Paragraph';
import { RectStyle } from './Paragraph';

/**
 * 布局用的"无限宽"：CanvasKit 按 float32 解释，Number.MAX_VALUE 会溢出成
 * Infinity，参与减法/对齐后产出 NaN。取 f32 可表示的最大有限值。
 */
export const MAX_LAYOUT_WIDTH = 3.4028234663852886e38;

/**
 * 单行文本的**光学垂直居中补偿**（对标 Kotlin `RichTextNode.inkShiftY`）。
 *
 * Skia 对小字号（≤16px）的段落行高有约 19px 的下限，且多出来的留白全部堆在
 * 字形上方：行盒垂直居中时墨迹会整体下沉 1~2px——这就是"按钮 / 标签文字
 * 看着没上下居中"的根因。这里按**紧致墨迹盒**把绘制原点平移到内容盒中心。
 *
 * 只对"单行语义"生效（[optical] 为真）；多行保持自然行高（段落排版语义）。
 * 绘制、选区、命中必须共用同一个原点，否则点击位置会和看到的字错开。
 */
export function inkShiftYOf(
  paragraph: PlatformParagraph | null,
  textLength: number,
  innerHeight: number,
  optical: boolean
): number {
  if (!optical || !paragraph || textLength === 0) return 0;
  const rects = paragraph.getRectsForRange(0, textLength, RectStyle.TIGHT);
  if (rects.length === 0) return 0;
  let top = rects[0].top;
  let bottom = rects[0].bottom;
  for (const r of rects) {
    if (r.top < top) top = r.top;
    if (r.bottom > bottom) bottom = r.bottom;
  }
  return (innerHeight - (bottom - top)) / 2 - top;
}
