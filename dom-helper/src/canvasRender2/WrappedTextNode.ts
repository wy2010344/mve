import { GetValue } from 'wy-helper';
import { ColorInt } from '../canvasRender/Draw';
import { RichTextSpan } from '../canvasRender/PlatformParagraph';
import { Node2, tfc } from './Node';
import { textDefaults } from './TextDefaults';
import { RichTextNodeArg, richTextNode } from './RichTextNode';

export interface WrappedTextNodeArg extends RichTextNodeArg {
  /** 文本内容，默认 '' */
  text?: GetValue<string>;
  /** 字体族，默认 null（用系统默认；wasm 版 CanvasKit 需注册字体并显式指定） */
  fontFamily?: GetValue<string | null>;
  /** 字号，默认 16 */
  fontSize?: GetValue<number>;
  /** 字重，默认 400 */
  fontWeight?: GetValue<number>;
  /** 斜体，默认 false（对标 Kotlin WrappedTextNode.italic） */
  italic?: GetValue<boolean>;
  /** 颜色，默认 TextDefaults.text（核心中性默认色，组件主题可回写） */
  color?: GetValue<ColorInt>;
  /** 行高倍数，默认 1.4 */
  lineHeightMultiplier?: GetValue<number | null>;
  /** 字距，默认 0 */
  letterSpacing?: GetValue<number>;
  /** 词距，默认 0 */
  wordSpacing?: GetValue<number>;
}

/**
 * canvasRender2 版的单片段文本节点（对标旧版 WrappedTextNode）：
 * 把 text + 样式参数合成一个 span 委托给 richTextNode，
 * 因此自动获得 richTextNode 的全部能力（自动换行、autoWidth、
 * 跨组件文本选择、双击选词等）。
 *
 * 用法：nodeOf(node => wrappedTextNode({
 *   width: () => 200,
 *   text: () => '一段会自动换行的文本',
 *   fontFamily: () => 'Noto Sans SC',
 *   fontSize: () => 14,
 * }))
 */
export const wrappedTextNode = tfc(function (
  ctx,
  node,
  arg: WrappedTextNodeArg
) {
  const {
    text = () => '',
    fontFamily = () => null,
    fontSize = () => 16,
    fontWeight = () => 400,
    italic = () => false,
    color = () => textDefaults.text,
    lineHeightMultiplier = () => 1.4,
    letterSpacing = () => 0,
    wordSpacing = () => 0,
    spans,
    ...rest
  } = arg;
  // 委托给 richTextNode：本节点只做参数合成，节点身份由 richTextNode 创建
  richTextNode.create({
    ...rest,
    // 未显式传 spans 时，由单文本参数合成；传了则以 spans 为准
    spans: (): RichTextSpan[] =>
      spans?.() ?? [
        {
          text: text(),
          style: {
            fontFamily: fontFamily(),
            fontSize: fontSize(),
            fontWeight: fontWeight(),
            italic: italic(),
            color: color(),
            letterSpacing: letterSpacing(),
            wordSpacing: wordSpacing(),
            lineHeightMultiplier: lineHeightMultiplier(),
          },
        },
      ],
  })(node)(ctx);
});
