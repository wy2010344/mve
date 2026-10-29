import { StoreRef } from 'wy-helper';
import { colorToCSS, rgba } from '../canvasCore/Draw';
import { RectStyle } from '../canvasCore/Paragraph';
import { drawParagraph } from '../canvasCore/DrawParagraph';
import {
  LayoutSize,
  MouseEvent2,
  Node2,
  innerSize,
  layoutSize,
  merge,
  node2,
  tfc,
} from './Node';
import { EditorHandleExt } from './tree/protocol';
import { RichEditableHandleExt, focusedSignal } from './Focus';
import { SelectableExt, selectionManagerContext } from './SelectionManager';
import { textDefaults } from './TextDefaults';
import {
  EditableParams,
  EditableTextNodeArg,
  editableTextNodeDefaults,
} from './editable/params';
import { CURSOR_WIDTH, createEditableEditor } from './editable/editor';

/**
 * canvasRender2 版可编辑文本节点（对标 Kotlin EditableTextNode）。
 *
 * 与 Kotlin 类继承不同，这里是函数式工厂：
 * - **节点表现**在本文件：draw / size / mouseDown / 把两条能力塞进 exts；
 * - **交互规则**在 `editable/editor`：光标、选区、编辑动作、键盘、IME、撤销；
 * - **显示层换算**在 `editable/view`，**段落**在 `editable/paragraph`，
 *   **光标几何**在 `editable/caret`（纯函数，只向段落发消息）。
 *
 * 选区真相双轨（详见 editor 的模块注释）：
 * - 跨组件拖选 / 全选由全局 SelectionManager 派生（rangeOf 读取）；
 * - 编辑器本地光标经 activeEditorSignal 喂给 SelectionManager 的
 *   activeEditorSelPair，键盘扩选 / 双击选词时优先级更高。
 *
 * 用法：`nodeOf(node => editableTextNode({ text, onTextChange, singleLine: () => true }))`
 */
export const editableTextNode = tfc(function (
  ctx,
  ref: StoreRef<Node2>,
  arg: EditableTextNodeArg
) {
  // 参数对象 + 兜底：之后每条参数消息都答得出来，不再判断"有没有传"
  const p: EditableParams = merge(arg, editableTextNodeDefaults);
  const selectionManager = ctx.consume(selectionManagerContext);

  const editor = createEditableEditor({
    arg: p,
    node: () => ref.get(),
    selectionManager: () => selectionManager,
    addDestroy: fn => ctx.addDestroy(fn),
  });

  node2.create(
    merge(
      {
        // 可选文本 + 编辑器句柄都经 exts 标记（asSelectable2 / asEditorHandle2 识别），
        // 而不是把 positionForPoint / cursorSelPair 挂到节点上——节点结构体保持干净。
        exts: p.exts.concat([
          new SelectableExt(editor.selectable()),
          new EditorHandleExt(editor.handle()),
          // 富文本句柄：即使未传 segments 也挂上（默认空表，setStyleRange 可随时启用样式）
          new RichEditableHandleExt({
            getSegments: () => editor.getSegments(),
            setStyleRange: (s, e, style) => editor.setStyleRange(s, e, style),
          }),
        ]),
        mouseDown(event: MouseEvent2) {
          editor.placeCursorAt(event.globalX, event.globalY);
        },
        size(d: 'x' | 'y'): LayoutSize {
          const para = editor.paragraph();
          if (d === 'x') return layoutSize(para ? para.width() : 0, true);
          return layoutSize(para ? para.height() : p.fontSize() * 1.4, true);
        },
        draw(ctx2: CanvasRenderingContext2D, node: Node2) {
          const para = editor.paragraph();
          const view = editor.view();
          const padX = node.paddingInlineStart();
          // 文本原点含单行墨迹补偿：绘制、光标、选区、命中共用同一原点
          const padY = editor.textOriginY();
          const scrollX = editor.scrollX();
          ctx2.save();
          // 单行（noWrap）裁到内容盒：溢出部分（文字/光标/组合串）不应画出边框
          // （对齐 Kotlin RichTextNode.drawInContentBox）
          if (p.singleLine()) {
            ctx2.beginPath();
            ctx2.rect(
              padX,
              padY,
              Math.max(0, innerSize(node, 'x')),
              Math.max(0, innerSize(node, 'y'))
            );
            ctx2.clip();
          }
          ctx2.translate(-scrollX, 0);
          if (para) {
            // 先画选区高亮（在文字之下），再画文字；顺序与 RichTextNode / Kotlin 一致
            const range = editor.selectionRange();
            if (range && range[1] > range[0]) {
              ctx2.fillStyle = colorToCSS(p.selectionColor());
              for (const r of para.getRectsForRange(
                view.logicToDisplay(range[0]),
                view.logicToDisplay(range[1]),
                RectStyle.TIGHT
              )) {
                ctx2.fillRect(
                  r.left + padX,
                  r.top + padY,
                  r.right - r.left,
                  r.bottom - r.top
                );
              }
            }
            drawParagraph(para.paragraph, ctx2, padX, padY);
          }
          // 光标：无选区、有焦点、闪烁相位为亮时绘制
          if (
            !editor.selectionRange() &&
            focusedSignal.get() === node &&
            editor.cursorVisible()
          ) {
            const dpos = editor.cursorDisplayPos();
            const cp = editor.paragraph();
            if (cp) {
              let caret: {
                left: number;
                top: number;
                right: number;
                bottom: number;
              } | null = null;
              const rects = cp.getRectsForRange(
                dpos,
                dpos + 1,
                RectStyle.TIGHT
              );
              if (rects.length) caret = rects[0];
              else if (dpos > 0) {
                // 文末：用前一个字符的右边缘当插入点
                const prev = cp.getRectsForRange(
                  dpos - 1,
                  dpos,
                  RectStyle.TIGHT
                );
                if (prev.length) {
                  caret = {
                    left: prev[0].right - CURSOR_WIDTH,
                    top: prev[0].top,
                    right: prev[0].right,
                    bottom: prev[0].bottom,
                  };
                }
              }
              if (caret) {
                ctx2.fillStyle = colorToCSS(textDefaults.text());
                ctx2.fillRect(
                  caret.left + padX,
                  caret.top + padY,
                  CURSOR_WIDTH,
                  caret.bottom - caret.top
                );
              }
            }
          }
          // 输入法组合串：底色 + 下划线（覆盖在文字之上）
          const composing = editor.composingDisplayRange();
          if (composing) {
            const cp = editor.paragraph();
            if (cp) {
              for (const r of cp.getRectsForRange(
                composing[0],
                composing[1],
                RectStyle.TIGHT
              )) {
                ctx2.fillStyle = colorToCSS(COMPOSING_BACKGROUND());
                ctx2.fillRect(
                  r.left + padX,
                  r.top + padY,
                  r.right - r.left,
                  r.bottom - r.top
                );
                ctx2.fillStyle = colorToCSS(COMPOSING_UNDERLINE());
                ctx2.fillRect(
                  r.left + padX,
                  Math.max(r.top, r.bottom - 2) + padY,
                  r.right - r.left,
                  2
                );
              }
            }
          }
          ctx2.restore();
        },
      },
      p
    )
  )(ref)(ctx);
});

/** 组合串底色（半透明淡蓝） */
const COMPOSING_BACKGROUND = () => rgba(200, 200, 255, 50);
/** 组合串下划线（半透明深色） */
const COMPOSING_UNDERLINE = () => rgba(0, 0, 0, 140);
