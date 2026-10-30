import {
  emptyArray,
  emptyFun,
  GetValue,
  memo,
  PointKey,
  storeRef,
  StoreRef,
} from 'wy-helper';
import { ColorInt, colorToCSS, rgba } from '../canvasCore/Draw';
import {
  INT_MAX_VALUE,
  RectStyle,
  RichTextSpan,
  TextAlign,
  buildParagraph,
} from '../canvasCore/Paragraph';
import { drawParagraph } from '../canvasCore/DrawParagraph';
import { wordRangeAt as wordRangeAtIn } from '../canvasCore/Graphemes';
import {
  absoluteX,
  absoluteY,
  defaultSize,
  fc,
  innerSize,
  LayoutSize,
  layoutSize,
  merge,
  MouseEvent2,
  Node2,
  node2,
} from './Node';
import { expandTabs } from './TabRender';
import { openUrl } from './UrlOpener';
import { rectOf } from './Geometry';
import { MAX_LAYOUT_WIDTH, inkShiftYOf } from './util';
import {
  Selectable2,
  SelectableExt,
  selectionManagerContext,
} from './SelectionManager';
import { Node2Arg } from './NodeArg';

/** 富文本节点的参数消息（没写的由 [richTextNodeDefaults] 兜底） */
export interface RichTextNodeArg extends Partial<Node2Arg> {
  /** 文本片段，每个片段可带独立样式 */
  spans?: GetValue<readonly RichTextSpan[]>;
  /** 选区颜色 */
  selectionColor?: GetValue<ColorInt>;
  /** 宽度是否由内容决定；false 时由父布局分配（需父布局支持） */
  autoWidth?: GetValue<boolean>;
  /**
   * 单行不折行：宽度由父布局决定，超出部分裁剪隐藏（对齐仍生效）。
   * 与 `maxLines = 1` 的区别是截断策略——后者按盒宽折行后只留首行并补省略号。
   */
  noWrap?: GetValue<boolean>;
  /** 最大行数 */
  maxLines?: GetValue<number>;
  /** 省略号 */
  ellipsis?: GetValue<string>;
  /** 对齐方式 */
  textAlign?: GetValue<TextAlign>;
}

/** 参数消息的兜底实现 */
export const richTextNodeDefaults = {
  spans: (): readonly RichTextSpan[] => emptyArray,
  selectionColor: () => rgba(100, 100, 200, 60),
  autoWidth: () => false,
  noWrap: () => false,
  maxLines: () => INT_MAX_VALUE,
  ellipsis: () => '\u2026',
  textAlign: () => TextAlign.START,
  /** 用户自己的绘制 / 点击回调 */
  draw: emptyFun as (ctx2: CanvasRenderingContext2D, n: Node2) => void,
  mouseClick: emptyFun as (event: MouseEvent2) => void,
  /** 构建设置（不是消息）：与用户传入的 exts 合并 */
  exts: emptyArray as readonly unknown[],
};

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
 * 用法：`nodeOf(node => richTextNode({ spans, nodeRef: node }))`
 */
export const richTextNode = fc(function (ctx, arg: RichTextNodeArg) {
  const ref = arg.nodeRef ?? storeRef(undefined!);
  const p = merge(arg, richTextNodeDefaults);

  /** 全文（tab 展开后的显示文本；对标 Kotlin fullText memo） */
  const fullText = () =>
    p
      .spans()
      .map(s => expandTabs(s.text))
      .join('');

  const maxFontSizeInSpans = () => {
    let maxFs = 0;
    for (const span of p.spans()) {
      maxFs = Math.max(maxFs, span.style?.fontSize ?? 0);
    }
    return Math.max(maxFs, 1);
  };

  /** 段落（含信号缓存）；依赖文本、可用宽度、行数等配置 */
  const paragraph = memo(() => {
    const ft = fullText();
    if (ft.length == 0) return null;
    // 无限宽排版（autoWidth / noWrap）下"要不要折行"由节点语义决定，不由盒宽决定
    const infinite = p.autoWidth() || p.noWrap();
    return buildParagraph(
      // 段落排的是显示文本：tab 展开（CanvasKit 对 '\t' 宽度未定义）
      p
        .spans()
        .map(s =>
          s.text.includes('\t') ? { ...s, text: expandTabs(s.text) } : s
        ),
      infinite ? MAX_LAYOUT_WIDTH : innerSize(ref.get(), 'x'),
      p.maxLines(),
      p.ellipsis(),
      // 无限宽排版下行对齐是在无穷宽坐标系里算的，END/CENTER 会把字形推到盒外被裁掉
      // （整段文字消失）。这里统一按 START 排版，再用 textOriginX 平移补偿对齐。
      infinite ? TextAlign.START : p.textAlign()
    );
  });

  /**
   * 单行文本的光学垂直居中补偿：Skia 小字号行高留白全堆在字形上方，
   * 不补偿的话按钮 / 标签文字会下沉 1~2px（见 [inkShiftYOf]）。
   * 多行保持自然行高。
   */
  const inkShiftY = memo(() =>
    inkShiftYOf(
      paragraph(),
      fullText().length,
      innerSize(ref.get(), 'y'),
      p.autoWidth() || p.maxLines() === 1
    )
  );

  /** 文本绘制原点 y：内容盒上缘 + 墨迹补偿（绘制 / 选区 / 命中共用） */
  const textOriginY = (): number => ref.get().paddingBlockStart() + inkShiftY();

  /**
   * 无限宽排版下的行对齐平移量。
   * 段落按无限宽排、又强制 START，所以 CENTER/END 得靠原点平移补回来；
   * 绘制、选区、命中同源，才能"看到的 = 点到的"。
   */
  const noWrapAlignShift = (): number => {
    if (p.autoWidth() || !p.noWrap()) return 0;
    const para = paragraph();
    if (!para) return 0;
    const align = p.textAlign();
    const box = innerSize(ref.get(), 'x');
    if (align === TextAlign.CENTER) return (box - para.width()) / 2;
    if (align === TextAlign.END) return box - para.width();
    return 0;
  };

  /** 文本绘制原点 x：padding 起点 + 对齐平移 */
  const textOriginX = (): number =>
    ref.get().paddingInlineStart() + noWrapAlignShift();

  /** 选区协调者：统一持有跨组件选区真相，本节点只读被分配的范围 */
  const selectionManager = ctx.consume(selectionManagerContext);

  // ---------- 链接：RichTextSpan.url 标记的片段（对标 Kotlin linkRanges/linkAt） ----------

  /** url 链接区间列表（偏移按展开后的 span 文本累计，半开区间 [start, end)） */
  const linkRanges = memo(() => {
    const result: Array<{ range: [number, number]; url: string }> = [];
    let offset = 0;
    for (const span of p.spans()) {
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
    for (const it of linkRanges()) {
      if (offset >= it.range[0] && offset < it.range[1]) return it.url;
    }
    return null;
  }

  // ---------- Selectable2：全树遍历由 SelectionManager 发现 ----------
  // 可选集合由 SelectionManager 从渲染树遍历派生，节点无需注册/注销；
  // 销毁（移出树）与隐藏（purifyList 过滤）即自动退出分配与聚合。

  const selectable: Selectable2 = {
    selectionRect() {
      const range = selectionManager?.rangeOf(selectable) ?? null;
      if (!range) return null;
      const para = paragraph();
      if (!para) return null;
      const rects = para.getRectsForRange(range[0], range[1], RectStyle.TIGHT);
      if (rects.length == 0) return null;
      const node = ref.get();
      const first = rects[0];
      const last = rects[rects.length - 1];
      const x = absoluteX(node) + textOriginX();
      const y = absoluteY(node) + textOriginY();
      return rectOf(
        x + Math.min(first.left, last.left),
        y + Math.min(first.top, last.top),
        x + Math.max(first.right, last.right),
        y + Math.max(first.bottom, last.bottom)
      );
    },
    textLength() {
      return fullText().length;
    },
    positionForPoint(globalX: number, globalY: number) {
      const para = paragraph();
      if (!para) return 0;
      const node = ref.get();
      const offset = para.getGlyphPositionAtCoordinate(
        globalX - absoluteX(node) - textOriginX(),
        globalY - absoluteY(node) - textOriginY()
      );
      return Math.min(Math.max(offset, 0), fullText().length);
    },
    textInRange(start: number, end: number) {
      const t = fullText();
      return end > start ? t.substring(start, Math.min(end, t.length)) : '';
    },
    wordRangeAt(offset: number) {
      return wordRangeAtIn(fullText(), offset);
    },
    paragraphRangeAt(offset: number) {
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
  // 不往节点对象上挂未知字段：经 exts 里的 SelectableExt 标记
  // （asSelectable2 从 exts 识别），节点结构体保持干净、可移植。

  node2(
    merge(
      {
        // 句柄经 arg.nodeRef 入场，node2 负责 ref.set(node)（对齐旧 tfc 的 node2.create(...)(ref)）
        nodeRef: ref,
        // 可选文本能力经 exts 声明（与用户传入的 exts 合并），而非节点字段
        exts: p.exts.concat([new SelectableExt(selectable)]),
        // 点击：用户回调先行（对标 Kotlin super.onPointerClick），
        // 命中链接片段时再经 UrlOpener 打开（宿主未注册则静默忽略）
        mouseClick(event: MouseEvent2) {
          p.mouseClick(event);
          const url = linkAt(
            selectable.positionForPoint(event.globalX, event.globalY)
          );
          if (url != null) openUrl(url);
        },
        size(d: PointKey): LayoutSize {
          // 宽度交给父布局时直接走默认尺寸逻辑（与 node2 的默认一致）
          if (d == 'x' && !p.autoWidth()) {
            return defaultSize(ref.get(), d);
          }
          // autoWidth 的 x 与所有 y 均由内容推导
          const para = paragraph();
          if (d == 'x') {
            return layoutSize(para ? para.width() : 0, true);
          }
          const h = para ? para.height() : maxFontSizeInSpans() * 1.4;
          return layoutSize(h, true);
        },
        draw(ctx2: CanvasRenderingContext2D, n: Node2) {
          p.draw(ctx2, n);
          const para = paragraph();
          if (!para) return;
          // 单行不折行：溢出部分裁到内容盒（对齐平移后的字形也不该画出边框）
          const clip = p.noWrap() && !p.autoWidth();
          if (clip) {
            ctx2.save();
            ctx2.beginPath();
            ctx2.rect(
              n.paddingInlineStart(),
              n.paddingBlockStart(),
              Math.max(0, innerSize(n, 'x')),
              Math.max(0, innerSize(n, 'y'))
            );
            ctx2.clip();
          }

          // 高亮：选区由 SelectionManager 按文档序分配（支持跨组件拖选）
          const range = selectionManager?.rangeOf(selectable) ?? null;
          if (range) {
            ctx2.fillStyle = colorToCSS(p.selectionColor());
            for (const rect of para.getRectsForRange(
              range[0],
              range[1],
              RectStyle.TIGHT
            )) {
              ctx2.fillRect(
                rect.left + textOriginX(),
                rect.top + textOriginY(),
                rect.right - rect.left,
                rect.bottom - rect.top
              );
            }
          }

          drawParagraph(para.paragraph, ctx2, textOriginX(), textOriginY());
          if (clip) ctx2.restore();
        },
      },
      p
    )
  )(ctx);
});
