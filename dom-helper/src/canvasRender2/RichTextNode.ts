import { alawaysFalse, emptyArray, GetValue, memo, PointKey } from 'wy-helper';
import { ColorInt, colorToCSS, rgba } from '../canvasRender/Draw';
import {
  INT_MAX_VALUE,
  RectStyle,
  RichTextSpan,
  TextAlign,
  buildParagraph,
} from '../canvasRender/PlatformParagraph';
import { drawParagraph } from '../canvasRender/CanvasKitLoader';
import { wordRangeAt as wordRangeAtIn } from '../canvasCore/Graphemes';
import {
  absoluteX,
  absoluteY,
  innerSize,
  LayoutSize,
  layoutSize,
  layoutValue,
  MouseEvent2,
  Node2,
  Node2Arg,
  node2,
  tfc,
} from './Node';
import { expandTabs } from './TabRender';
import { openUrl } from './UrlOpener';
import { RectF } from './Geometry';
import {
  Rect2,
  Selectable2,
  selectionManagerContext,
} from './SelectionManager';

export interface RichTextNodeArg extends Node2Arg {
  /** 文本片段，每个片段可带独立样式 */
  spans?: GetValue<RichTextSpan[]>;
  /** 选区颜色，默认 rgba(100, 100, 200, 60) */
  selectionColor?: GetValue<ColorInt>;
  /** 宽度是否由内容决定；false 时由父布局分配（需父布局支持） */
  autoWidth?: GetValue<boolean>;
  /** 最大行数，默认 INT_MAX_VALUE */
  maxLines?: GetValue<number>;
  /** 省略号，默认 '…' */
  ellipsis?: GetValue<string>;
  /** 对齐方式，默认 START */
  textAlign?: GetValue<TextAlign>;
}

/**
 * canvasRender2 版的富文本节点（对标 Kotlin 版 RichTextNode）。
 *
 * 文本选择能力放在本节点，保证"所有文本区域都可选择"：
 * - 节点是纯数据面：只负责把全局坐标换算成文本偏移（positionForPoint）、
 *   提供文本与矩形查询（Selectable2）；
 * - 选区真相统一由 SelectionManager 持有（信号驱动拉模型），本节点通过
 *   rangeOf 派生读取自己被分配的范围并绘制高亮，没有任何反向写回；
 * - 因此天然支持**跨组件选择**：从一个富文本节点拖到另一个节点，
 *   选区按文档序自动分配到各节点，selectedText 按序聚合。
 *
 * 用法：nodeOf(node => richTextNode({ spans, ... }))
 */
export const richTextNode = tfc(function (ctx, node, arg: RichTextNodeArg) {
  const {
    spans = () => emptyArray,
    selectionColor = () => rgba(100, 100, 200, 60),
    autoWidth = alawaysFalse,
    maxLines = () => INT_MAX_VALUE,
    ellipsis = () => '\u2026',
    textAlign = () => TextAlign.START,
    ...rest
  } = arg;

  /** 全文（tab 展开后的显示文本；对标 Kotlin fullText memo） */
  const fullText = () =>
    spans()
      .map(s => expandTabs(s.text))
      .join('');

  const maxFontSizeInSpans = () => {
    let maxFs = 0;
    for (const span of spans()) {
      maxFs = Math.max(maxFs, span.style?.fontSize ?? 0);
    }
    return Math.max(maxFs, 1);
  };

  /** 段落（含信号缓存）；依赖文本、可用宽度、行数等配置 */
  const paragraph = memo(() => {
    const ft = fullText();
    if (ft.length == 0) return null;
    return buildParagraph(
      // 段落排的是显示文本：tab 展开（CanvasKit 对 '\t' 宽度未定义）
      spans().map(s =>
        s.text.includes('\t') ? { ...s, text: expandTabs(s.text) } : s
      ),
      autoWidth() ? Number.MAX_VALUE : innerSize(node, 'x'),
      maxLines(),
      ellipsis(),
      textAlign()
    );
  });

  /** 选区协调者：统一持有跨组件选区真相，本节点只读被分配的范围 */
  const selectionManager = ctx.consume(selectionManagerContext);

  // ---------- Selectable2：挂到 node 上，供 SelectionManager 全树遍历发现 ----------
  // 可选集合由 SelectionManager 从渲染树遍历派生，节点无需注册/注销；
  // 销毁（移出树）与隐藏（purifyList 过滤）即自动退出分配与聚合。

  const self = node as Node2 & Selectable2;

  const selectable: Selectable2 = {
    selectionRect(): Rect2 | null {
      const range = selectionManager?.rangeOf(self) ?? null;
      if (!range) return null;
      const p = paragraph();
      if (!p) return null;
      const rects = p.getRectsForRange(range[0], range[1], RectStyle.TIGHT);
      if (rects.length == 0) return null;
      const first = rects[0];
      const last = rects[rects.length - 1];
      const x = absoluteX(self) + self.paddingInlineStart();
      const y = absoluteY(self) + self.paddingBlockStart();
      return new RectF(
        x + Math.min(first.left, last.left),
        y + Math.min(first.top, last.top),
        x + Math.max(first.right, last.right),
        y + Math.max(first.bottom, last.bottom)
      );
    },
    textLength(): number {
      return fullText().length;
    },
    positionForPoint(globalX: number, globalY: number): number {
      const p = paragraph();
      if (!p) return 0;
      const offset = p.getGlyphPositionAtCoordinate(
        globalX - absoluteX(self) - self.paddingInlineStart(),
        globalY - absoluteY(self) - self.paddingBlockStart()
      );
      return Math.min(Math.max(offset, 0), fullText().length);
    },
    textInRange(start: number, end: number): string {
      const t = fullText();
      return end > start ? t.substring(start, Math.min(end, t.length)) : '';
    },
    wordRangeAt(offset: number): [number, number] | null {
      return wordRangeAtIn(fullText(), offset);
    },
    paragraphRangeAt(offset: number): [number, number] | null {
      const t = fullText();
      if (t.length == 0) return null;
      // '\n' 分隔的逻辑段落；点在换行符上归前段，末段延伸到文末
      const d = Math.min(Math.max(offset, 0), t.length);
      const start = d == 0 ? 0 : t.lastIndexOf('\n', d - 1) + 1;
      const nl = t.indexOf('\n', d);
      const end = nl == -1 ? t.length : nl;
      return [start, end];
    },
  };
  Object.assign(self, selectable);

  // ---------- 链接：RichTextSpan.url 标记的片段（对标 Kotlin linkRanges/linkAt） ----------

  /** url 链接区间列表（偏移按展开后的 span 文本累计，半开区间 [start, end)） */
  const linkRanges = memo(() => {
    const result: Array<{ range: [number, number]; url: string }> = [];
    let offset = 0;
    for (const span of spans()) {
      const len = expandTabs(span.text).length;
      if (len > 0 && span.url != null) {
        result.push({ range: [offset, offset + len], url: span.url });
      }
      offset += len;
    }
    return result;
  });

  /** 命中 [offset] 的链接 url；未命中返回 null */
  function linkAt(offset: number): string | null {
    for (const { range, url } of linkRanges()) {
      if (offset >= range[0] && offset < range[1]) return url;
    }
    return null;
  }

  node2.create({
    ...rest,
    // 点击：用户回调先行（对标 Kotlin super.onPointerClick），
    // 命中链接片段时再经 UrlOpener 打开（宿主未注册则静默忽略）
    mouseClick(event: MouseEvent2) {
      rest.mouseClick?.(event);
      const url = linkAt(
        selectable.positionForPoint(event.globalX, event.globalY)
      );
      if (url != null) openUrl(url);
    },
    size(d: PointKey): LayoutSize {
      if (d == 'x' && !autoWidth()) {
        // 宽度交给父布局（与 node2 的默认尺寸逻辑一致）
        const x = layoutValue(node, d);
        if (x.allowSizeFromChildren()) {
          return {
            value: x.sizeFromChildren(),
            fromInside: true,
          };
        }
        const parent = node.parent!;
        return {
          value: layoutValue(parent, d).childSize(node.layoutIndex()),
          fromInside: false,
        };
      }
      // autoWidth 的 x 与所有 y 均由内容推导
      const p = paragraph();
      if (d == 'x') {
        return layoutSize(p ? p.width() : 0, true);
      }
      const h = p ? p.height() : maxFontSizeInSpans() * 1.4;
      return layoutSize(h, true);
    },
    draw(ctx2: CanvasRenderingContext2D, n) {
      rest.draw?.(ctx2, n);
      const p = paragraph();
      if (!p) return;

      // 高亮：选区由 SelectionManager 按文档序分配（支持跨组件拖选）
      const range = selectionManager?.rangeOf(self) ?? null;
      if (range) {
        ctx2.fillStyle = colorToCSS(selectionColor());
        for (const rect of p.getRectsForRange(
          range[0],
          range[1],
          RectStyle.TIGHT
        )) {
          ctx2.fillRect(
            rect.left + self.paddingInlineStart(),
            rect.top + self.paddingBlockStart(),
            rect.right - rect.left,
            rect.bottom - rect.top
          );
        }
      }

      drawParagraph(
        p.paragraph,
        ctx2,
        self.paddingInlineStart(),
        self.paddingBlockStart()
      );
    },
  })(node)(ctx);
});
