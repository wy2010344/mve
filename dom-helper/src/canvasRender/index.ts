import { hookCurrentStateHolder } from 'mve-core';
import { Renderer, RendererArgs } from './Renderer';
import { batchSignalEnd, createSignal } from 'wy-helper';
import { debounceRequestBatchAnimationFrame } from 'wy-dom-helper';
import { RectNode, RectNodeArg } from './RectNode';
import { Node, NodeArg } from './Node';
import {
  contentSize,
  maxScroll,
  registerScroll,
  Scroll,
  ScrollBarCalculate,
  ScrollContent,
  ScrollContentArg,
} from './Scroll';
import { EditableTextNode, EditableTextNodeArg } from './EditableTextNode';
import { RichTextNode, RichTextNodeArg } from './RichTextNode';
import { WrappedTextNode, WrappedTextNodeArg, WordBreak } from './WrappedTextNode';
import { ImageNode, ImageNodeArg } from './ImageNode';
import { decodeImage } from './PlatformImage';
import { SimpleScrollBar } from './helper/SimpleScrollBar';

// Core types
export type { ColorInt } from './Draw';
export { rgba, colorToCSS } from './Draw';
export { MouseEvent } from './MouseEvent';
export { inRange } from './util';
export type {
  EngineGlobal,
  GlobalMouseEvent,
  GlobalWheelEvent,
  MouseCallback,
  WheelCallback,
  KeyEvent,
  KeyPressCallback,
  ComposingTextCallback,
} from './EngineGlobal';
export { engineGlobalContext, KeyCode, CursorType } from './EngineGlobal';

// Node hierarchy
export { hitest, absolutePosition, collectIndex } from './Node';
export type { Node, NodeWithPosition } from './Node';
export { RectNode } from './RectNode';
export { Renderer } from './Renderer';

// Text nodes
export { RichTextNode } from './RichTextNode';
export type { RichTextNodeArg } from './RichTextNode';
export { WrappedTextNode, WordBreak } from './WrappedTextNode';
export type { WrappedTextNodeArg } from './WrappedTextNode';
export { EditableTextNode, getActiveEditor } from './EditableTextNode';
export type { EditableTextNodeArg } from './EditableTextNode';

// Scroll
export { Scroll, ScrollBarCalculate, ScrollContent, registerScroll, contentSize, maxScroll } from './Scroll';
export type { ScrollContentArg } from './Scroll';

// Image
export { ImageNode } from './ImageNode';
export type { ImageNodeArg } from './ImageNode';
export { decodeImage } from './PlatformImage';
export type { PlatformImage } from './PlatformImage';
export { configureCanvasKit, loadCanvasKit } from './CanvasKitLoader';
export type { CanvasKitConfig } from './CanvasKitLoader';
export { registerFont } from './PlatformParagraph';

// Undo / Redo
export {
  TextState,
  InsertTextAction,
  DeleteTextAction,
  ReplaceSelectionAction,
  ReplaceRangeAction,
  UndoRedo,
} from './UndoRedo';
export type { TextEditAction } from './UndoRedo';

// Layout
export { type StartEnd, layoutSize, layoutSizeDirection } from './LayoutNode';
export type {
  LayoutNode,
  LayoutSize,
  LayoutSize as SizeFromParent,
  Layout,
  LayoutFun,
  LayoutDirection,
  LayoutSizeDirection,
} from './LayoutNode';
export * from './LayoutNode';

// Helpers
export { drag } from './helper/drag';
export { SimpleScrollBar } from './helper/SimpleScrollBar';
export * from './layout/FlexLayout';

export function renderCanvas(
  canvas: HTMLCanvasElement,
  args: Omit<RendererArgs, 'frameCallback' | 'x' | 'y' | 'position'>
) {
  const stateHolder = hookCurrentStateHolder(true);

  const w = createSignal(canvas.clientWidth);
  const h = createSignal(canvas.clientHeight);
  const ob = new ResizeObserver(() => {
    w.set(canvas.clientWidth);
    h.set(canvas.clientHeight);
    batchSignalEnd();
  });
  ob.observe(canvas);
  stateHolder.addDestroy(() => {
    ob.disconnect();
  });

  const render = new Renderer(
    {
      ...args,
      width: w.get,
      height: h.get,
      frameCallback() {
        debounceRequestBatchAnimationFrame(redraw);
      },
    },
    stateHolder
  );

  const ctx = canvas.getContext('2d')!;
  function redraw() {
    render.render(ctx);
  }

  canvas.addEventListener('click', e => {
    render.dispatchClick(e.offsetX, e.offsetY);
  });
  canvas.addEventListener('mousedown', e => {
    render.dispatchMouseDown(e.offsetX, e.offsetY);
  });
  canvas.addEventListener('mouseup', e => {
    render.dispatchMouseUp(e.offsetX, e.offsetY);
  });
  canvas.addEventListener('mousemove', e => {
    render.dispatchMouseMove(e.offsetX, e.offsetY);
  });
  canvas.addEventListener('wheel', e => {
    render.dispatchMouseWheel(e.offsetX, e.offsetY, e.deltaX, e.deltaY);
  });
  return render;
}

export function renderNode(args: NodeArg) {
  return new Node(hookCurrentStateHolder(true), args);
}
export function renderRect(args: RectNodeArg) {
  return new RectNode(hookCurrentStateHolder(true), args);
}
export function renderRichText(args: RichTextNodeArg) {
  return new RichTextNode(hookCurrentStateHolder(true), args);
}
export function renderWrappedText(args: WrappedTextNodeArg) {
  return new WrappedTextNode(hookCurrentStateHolder(true), args);
}
export function renderEditableText(args: EditableTextNodeArg) {
  return new EditableTextNode(hookCurrentStateHolder(true), args);
}
export function renderImage(args: ImageNodeArg) {
  return new ImageNode(hookCurrentStateHolder(true), args);
}
export function renderScrollContent(args: ScrollContentArg) {
  return new ScrollContent(hookCurrentStateHolder(true), args);
}
