import { hookCurrentStateHolder } from 'mve-core';
import { Renderer, RendererArgs } from './Renderer';
import { batchSignalEnd, createSignal } from 'wy-helper';
import { debounceRequestBatchAnimationFrame } from 'wy-dom-helper';
import { RectNode, RectNodeArg } from './RectNode';
import {
  ScrollContent,
  ScrollContentArg,
  ScrollNode,
  ScrollNodeArg,
} from './ScrollNode';

// Core types
export type { ColorInt } from './Draw';
export { rgba, colorToCSS } from './Draw';
export { MouseEvent } from './MouseEvent';
export { measureText } from './PlatformCanvas';
export { inRange } from './util';
export type {
  EngineGlobal,
  GlobalMouseEvent,
  GlobalWheelEvent,
  MouseCallback,
  WheelCallback,
} from './EngineGlobal';
export { engineGlobalContext } from './EngineGlobal';

// Node hierarchy
export { hitest, absolutePosition, collectIndex } from './Node';
export type { Node, NodeWithPosition } from './Node';
export { RectNode } from './RectNode';
export { Renderer } from './Renderer';

// Text nodes
// export { TextNode } from './TextNode';
// export { WrappedTextNode, WordBreak } from './WrappedTextNode';
// export { RichTextNode } from './RichTextNode';

// Scroll
// export { ScrollNode, ScrollBarCalculate } from './ScrollNode';

// Layout
export { type StartEnd, layoutSize } from './LayoutNode';
export type {
  LayoutNode,
  LayoutSize,
  LayoutSize as SizeFromParent,
  Layout,
  LayoutFun,
} from './LayoutNode';

// Helpers
export { drag } from './helper/drag';
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

  const render = new Renderer({
    ...args,
    width: w.get,
    height: h.get,
    frameCallback() {
      debounceRequestBatchAnimationFrame(redraw);
    },
  });

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

export function renderRect(args: RectNodeArg) {
  return new RectNode(hookCurrentStateHolder(true), args);
}

export function renderScroll(args: ScrollNodeArg) {
  return new ScrollNode(hookCurrentStateHolder(true), args);
}

export function renderScrollContent(args: ScrollContentArg) {
  return new ScrollContent(hookCurrentStateHolder(true), args);
}
