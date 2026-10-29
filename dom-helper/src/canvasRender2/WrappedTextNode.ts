import { GetValue, StoreRef } from 'wy-helper';
import { ColorInt } from '../canvasCore/Draw';
import { RichTextSpan } from '../canvasCore/Paragraph';
import { Node2, merge, tfc } from './Node';
import { textDefaults } from './TextDefaults';
import { RichTextNodeArg, richTextNode } from './RichTextNode';

/**
 * 单片段文本的参数消息：文本 + 一套样式。
 *
 * `spans` 在这里的语义是「**没给**（nil）就由 text + 样式合成一段」，
 * 而不是"成员不存在"——ooc 没有成员探测，但 nil 是正常值，
 * 于是判断写成 `#guard (p spans); … #else; 合成`。
 */
export interface WrappedTextNodeArg extends Omit<RichTextNodeArg, 'spans'> {
  /** 显式片段；nil 表示由下面的 text + 样式合成 */
  spans?: GetValue<readonly RichTextSpan[] | null>;
  /** 文本内容 */
  text?: GetValue<string>;
  /** 字体族（null = 系统默认；wasm 版 CanvasKit 需注册字体并显式指定） */
  fontFamily?: GetValue<string | null>;
  /** 字号 */
  fontSize?: GetValue<number>;
  /** 字重 */
  fontWeight?: GetValue<number>;
  /** 斜体（对标 Kotlin WrappedTextNode.italic） */
  italic?: GetValue<boolean>;
  /** 颜色（默认取 TextDefaults.text，组件主题可回写） */
  color?: GetValue<ColorInt>;
  /** 行高倍数 */
  lineHeightMultiplier?: GetValue<number | null>;
  /** 字距 */
  letterSpacing?: GetValue<number>;
  /** 词距 */
  wordSpacing?: GetValue<number>;
}

/** 参数消息的兜底实现 */
export const wrappedTextNodeDefaults = {
  spans: (): readonly RichTextSpan[] | null => null,
  text: (): string => '',
  fontFamily: (): string | null => null,
  fontSize: () => 16,
  fontWeight: () => 400,
  italic: () => false,
  color: (): ColorInt => textDefaults.text(),
  lineHeightMultiplier: (): number | null => 1.4,
  letterSpacing: () => 0,
  wordSpacing: () => 0,
};

/**
 * canvasRender2 版的单片段文本节点（对标旧版 WrappedTextNode）：
 * 把 text + 样式合成一个 span 委托给 richTextNode，
 * 因此自动获得 richTextNode 的全部能力（自动换行、autoWidth、
 * 跨组件文本选择、双击选词等）。
 *
 * 用法：`nodeOf(node => wrappedTextNode({ width: () => 200, text: () => '…' }))`
 */
export const wrappedTextNode = tfc(function (
  ctx,
  ref: StoreRef<Node2>,
  arg: WrappedTextNodeArg
) {
  const p = merge(arg, wrappedTextNodeDefaults);

  /** 合成单片段：样式全部经 p 发消息，不必判断调用方写了哪几项 */
  const singleSpan = (): RichTextSpan => ({
    text: p.text(),
    style: {
      fontFamily: p.fontFamily(),
      fontSize: p.fontSize(),
      fontWeight: p.fontWeight(),
      italic: p.italic(),
      color: p.color(),
      letterSpacing: p.letterSpacing(),
      wordSpacing: p.wordSpacing(),
      lineHeightMultiplier: p.lineHeightMultiplier(),
    },
  });

  // 委托给 richTextNode：本节点只做参数合成，节点身份由 richTextNode 创建。
  // 显式给出的 spans 优先（merge 的第一个参数优先），nil 时用合成片段。
  richTextNode.create(
    merge(
      {
        spans: (): readonly RichTextSpan[] => p.spans() ?? [singleSpan()],
      },
      p
    )
  )(ref)(ctx);
});
