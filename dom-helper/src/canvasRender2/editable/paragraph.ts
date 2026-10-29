import { memo } from 'wy-helper';
import {
  PlatformParagraph,
  RichTextSpan,
  TextAlign,
  buildParagraph,
} from '../../canvasCore/Paragraph';
import { MAX_LAYOUT_WIDTH } from '../util';
import type { EditableTextView } from './view';

/**
 * # 编辑器的「段落对象」：显示文本 → 可查询的排版结果
 *
 * 段落是 CanvasKit 的 WASM 对象，两个坑都在这里收口：
 * 1. **重建必须释放旧的**（Kotlin 侧有 native finalizer，Web 没有）；
 * 2. **排的是显示文本**（占位 / 掩码 / tab 展开之后），不是模型文本。
 *
 * 对上层只暴露两条消息：`get()` 取当前段落、`dispose()` 销毁时释放。
 * 其余查询（矩形 / 行盒 / 字形位置）是段落对象自己的能力，由
 * [./caret] 里的纯函数向它发消息，不在这里包一层转发。
 */

export interface EditableParagraph {
  /** 当前段落（显示文本为空时 null） */
  get(): PlatformParagraph | null;
  /** 释放 WASM 段落对象（节点销毁时调用，避免泄漏） */
  dispose(): void;
}

/** 段落构建所需的全部输入（都是消息，调用时求值） */
export interface EditableParagraphSource {
  /** 显示层：拿显示文本、判断是不是占位串 */
  view: EditableTextView;
  /**
   * 显示片段（已展开 tab 的显示文本 + 片段样式）。
   * - 普通编辑器：单片段、整段共享基础样式；
   * - 富文本编辑器：按样式段边界切成多片段（[richSegments.contentSpansIn]）。
   * 与 `RichTextNode` 同口径：段落排的是显示文本，不是模型文本。
   */
  spans(): readonly RichTextSpan[];
  /** 单行不折行：不限宽 */
  singleLine(): boolean;
  maxLines(): number;
  /** 节点 inner 宽（折行宽度） */
  innerWidth(): number;
}

export function createEditableParagraph(
  source: EditableParagraphSource
): EditableParagraph {
  const build = memo(() => {
    const spans = source.spans();
    if (spans.length === 0) return null;
    return buildParagraph(
      spans,
      // 单行不限宽：用 f32 安全的大数（Number.MAX_VALUE 转 f32 会变 Infinity，
      // 在换行/对齐路径里参与 Infinity 运算会产出 NaN）
      source.singleLine() ? MAX_LAYOUT_WIDTH : source.innerWidth(),
      source.maxLines(),
      '\u2026',
      TextAlign.START
    );
  });

  let live: PlatformParagraph | null = null;

  return {
    get() {
      const next = build();
      // 每次读取都对齐一次：重建了就把旧的 WASM 对象删掉
      if (next !== live) {
        live?.delete();
        live = next;
      }
      return next;
    },
    dispose() {
      live?.delete();
      live = null;
    },
  };
}
