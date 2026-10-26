import { ShareConfig, StateHolder, StateHolderWithNode } from 'mve-core';
import { absoluteLayoutFun, emptyFun, LayoutError, memo } from 'wy-helper';
import type {
  GetValue,
  Layout,
  LayoutFun,
  LayoutInsideObject,
  PointKey,
} from 'wy-helper';
import { collectIndex, flatten } from '../canvasRender/Node';
import { CursorType as CursorType2 } from '../canvasCore/Cursor';
import { alawaysFalse, alawaysTrue, emptyArray } from 'wy-helper';
import type { KeyEvent2 } from './Focus';
import {
  isFocused as focusIsFocused,
  requestFocus as focusRequest,
} from './Focus';

export type { Layout, LayoutFun };

export type StartEnd = 'start' | 'end';

export type LayoutSize =
  | {
      readonly value: number;
      readonly fromInside: boolean;
    }
  | number;

export type LayoutSizeDirection = {
  direction: PointKey;
  value: number;
  fromInside: boolean;
};

export interface LayoutDirection2 {
  layout(d: PointKey): LayoutFun<Node2>;
}

/** 鼠标光标（= `canvasCore/Cursor` 的 CursorType，两套树共用；`2` 后缀保留以兼容本目录既有导入） */
export { CursorType2 };

export interface MouseEvent2 {
  readonly x: number;
  readonly y: number;
  readonly globalX: number;
  readonly globalY: number;
  readonly stoppedProgression: boolean;
  stopPropagation(): void;
}

export function createMouseEvent2(
  x: number,
  y: number,
  globalX: number,
  globalY: number
): MouseEvent2 {
  let stoppedProgression = false;
  return {
    x,
    y,
    globalX,
    globalY,
    get stoppedProgression() {
      return stoppedProgression;
    },
    stopPropagation() {
      stoppedProgression = true;
    },
  };
}

export interface Node2Parent {
  parent?: Node2Parent;
  x(): number;
  y(): number;
  layoutChildren(): readonly Node2[];
  layoutX(): Layout;
  layoutY(): Layout;
}
export interface Node2 extends Node2Parent {
  parent: Node2Parent | undefined;
  _index: number;
  _layoutIndex: number;
  draw(ctx2: CanvasRenderingContext2D): void;
  /**
   * 在父坐标系上的预绘制钩子（对标 Kotlin Node.drawAtParent 重写，默认空实现）：
   * 父节点 draw 循环在 translate 到本节点之前调用——如 ScrollContent 在此按
   * 容器 inner 区裁剪。基类只负责调用，不感知任何具体语义，行为由节点自身决定。
   */
  drawAtParent(ctx2: CanvasRenderingContext2D): void;
  hide(): any;
  index(): number;
  notInLayout(): boolean;
  skipDraw(): boolean;
  /** 是否参与文本选择（SelectionManager 遍历时false剪枝整棵子树） */
  selectionEnabled(): boolean;
  layoutIndex(): number;
  paddingInlineStart(): number;
  paddingInlineEnd(): number;
  paddingBlockStart(): number;
  paddingBlockEnd(): number;
  layout: LayoutDirection2;
  //尺寸只展示外面的，因为padding表达内部
  width(): number;
  height(): number;
  children(): readonly Node2[];
  acceptHit(x: number, y: number): boolean;
  acceptClip(x: number, y: number): boolean;
  mouseClick?(event: MouseEvent2): void;
  mouseDown?(event: MouseEvent2): void;
  mouseUp?(event: MouseEvent2): void;
  mouseMove?(event: MouseEvent2): void;
  /** 右键上下文菜单（对标 Kotlin onPointerContextMenu；右键不派发 mouseDown） */
  mouseContextMenu?(event: MouseEvent2): void;
  /** 双击（对标 Kotlin onPointerDoubleClick；不吞单击，浏览器先 click 再 dblclick） */
  mouseDoubleClick?(event: MouseEvent2): void;
  /** 捕获阶段钩子（根 → 叶，先于冒泡；对标旧版 canvasRender 的 mouse*Capture） */
  mouseClickCapture?(event: MouseEvent2): void;
  mouseDownCapture?(event: MouseEvent2): void;
  mouseUpCapture?(event: MouseEvent2): void;
  mouseMoveCapture?(event: MouseEvent2): void;
  /** 鼠标光标（悬停时）；不指定时由引擎按"编辑器→text / 可聚焦→pointer"派生 */
  cursor?: CursorType2 | GetValue<CursorType2>;
  // ---------- 焦点子系统（对标 Kotlin focusable/focusOrder/focusTrap） ----------
  /** 是否可被 Tab 焦点遍历拾取（相当于 web 的 tabindex >= 0） */
  focusable: boolean;
  /** Tab 遍历的显式顺序（值越小越先遍历；null 走文档序） */
  focusOrder: number | null;
  /** 是否圈定焦点（模态弹出层；Tab 只在圈定子树内循环） */
  focusTrap: boolean;
  /** 当前是否持有焦点（读取全局焦点信号，响应式） */
  isFocused(): boolean;
  /** 请求获得焦点（登记为活跃编辑器若为编辑器节点） */
  requestFocus(): void;
  /** 键盘事件处理；返回 true 表示已消费（默认不消费） */
  handleKey(e: KeyEvent2): boolean;
  /** IME 预编辑串上报（编辑器实现；非编辑器忽略） */
  onComposing?(text: string, cursor: number): void;
  exts: readonly any[];
}

export function tfc<
  F extends (
    ctx: StateHolder<Node2, readonly Node2[]>,
    n: Node2,
    ...vs: any[]
  ) => void,
>(f: F) {
  type Arg = Parameters<F> extends [any, any, ...infer Arg] ? Arg : never;
  return {
    of(...v: Arg) {
      const node = {} as Node2;
      return this.create(...v)(node);
    },
    create(...v: Arg) {
      //注入预定义的Node
      return function (n: Node2) {
        //注入使用场合的ctx
        return function (ctx: StateHolder<Node2, readonly Node2[]>) {
          f(ctx, n, ...v);
        };
      };
    },
  };
}

export type Fc = (ctx: StateHolder<Node2, readonly Node2[]>) => void | TFc;
export type TFc = (n: Node2) => Fc;
export const nodeConfig: ShareConfig<Node2, readonly Node2[]> = {
  after: collectIndex,
  purifyList(list) {
    const newList: Node2[] = [];
    flatten(list, newList);
    return newList;
  },
};

export const layoutSize0: LayoutSize = {
  value: 0,
  fromInside: true,
};

export function layoutSize(value: number, fromInside: boolean): LayoutSize {
  return { value, fromInside };
}

export function layoutSizeDirection(
  direction: PointKey,
  value: number,
  fromInside: boolean
): LayoutSizeDirection {
  return { direction, value, fromInside };
}

function createLayout(node: Node2, d: PointKey) {
  const inside: LayoutInsideObject<Node2> = {
    children: node.children,
    innerSize: () => innerSize(node, d),
  };
  return memo(() => node.layout.layout(d).createLayout(inside));
}

export function getPadding(node: Node2, d: PointKey, side: StartEnd): number {
  if (d === 'x') {
    return side === 'start'
      ? node.paddingInlineStart()
      : node.paddingInlineEnd();
  }
  return side === 'start' ? node.paddingBlockStart() : node.paddingBlockEnd();
}

export function paddingStart(node: Node2, d: PointKey): number {
  return getPadding(node, d, 'start');
}

export function paddingEnd(node: Node2, d: PointKey): number {
  return getPadding(node, d, 'end');
}

export function size(node: Node2, d: PointKey): number {
  if (d == 'x') {
    return node.width();
  }
  return node.height();
}

export function innerSize(node: Node2, d: PointKey): number {
  const value = size(node, d);
  return Math.max(
    0,
    value - getPadding(node, d, 'start') - getPadding(node, d, 'end')
  );
}

export function layoutValue(node: Node2Parent, d: PointKey): Layout {
  return d === 'x' ? node.layoutX() : node.layoutY();
}

export function sizeFromParent(node: Node2, d: PointKey): LayoutSize {
  const parent = node.parent;
  if (parent) {
    return {
      value: layoutValue(parent, d).childSize(node.layoutIndex()),
      fromInside: false,
    };
  }
  throw new Error('未找到父节点');
}

export function sizeFromChildren(node: Node2, d: PointKey): LayoutSize {
  return {
    value: layoutValue(node, d).sizeFromChildren(),
    fromInside: true,
  };
}

/**
 * node2 的默认尺寸逻辑（未显式传 size 时使用）：
 * 布局允许由内容推导时取内容尺寸，否则取父布局分配的子尺寸。
 * 抽出来供需要“只覆盖一个轴、另一个轴走默认”的工厂（如 scrollContent）复用。
 */
export function defaultSize(node: Node2, d: PointKey): LayoutSize {
  const x = layoutValue(node, d);
  if (x.allowSizeFromChildren()) {
    return {
      value: x.sizeFromChildren(),
      fromInside: true,
    };
  }
  const parent = node.parent;
  if (!parent) {
    throw new Error('未找到父节点');
  }
  return {
    value: layoutValue(parent, d).childSize(node.layoutIndex()),
    fromInside: false,
  };
}

/**
 * node2 的默认位置逻辑（未显式传 position 时使用）：
 * 父布局分配的子位置 + 父的 padding start；LayoutError（未参与布局）时退化为 padding start。
 */
export function defaultPosition(node: Node2, d: PointKey): number {
  const parent = node.parent;
  if (!parent) {
    throw new Error('未找到父节点');
  }
  // 运行期父节点必为完整 Node2（Node2Parent 只是父链遍历的最小接口）
  const p = parent as Node2;
  try {
    return (
      layoutValue(parent, d).childPosition(node.layoutIndex()) +
      getPadding(p, d, 'start')
    );
  } catch (e) {
    if (e instanceof LayoutError) {
      return getPadding(p, d, 'start');
    }
    throw e;
  }
}

export function absoluteInInner(node: Node2, x: number, y: number): boolean {
  const innerX = absolutePosition(node, 'x') + node.paddingInlineStart();
  const innerY = absolutePosition(node, 'y') + node.paddingBlockStart();
  return (
    innerX < x &&
    x < innerX + innerSize(node, 'x') &&
    innerY < y &&
    y < innerY + innerSize(node, 'y')
  );
}

export const alaways0 = () => 0;

export interface Node2Arg {
  //外部显式传递node,可能一些参数配置好了,当this来使用
  x?(): number;
  y?(): number;
  hide?(): any;
  acceptHit?(x: number, y: number): boolean;
  acceptClip?(x: number, y: number): boolean;
  skipDraw?(): boolean;
  paddingInlineStart?: GetValue<number>;
  paddingInlineEnd?: GetValue<number>;
  paddingBlockStart?: GetValue<number>;
  paddingBlockEnd?: GetValue<number>;
  width?: GetValue<number>;
  height?: GetValue<number>;
  layout?: LayoutDirection2;
  notInLayout?: GetValue<boolean>;
  selectionEnabled?: GetValue<boolean>;
  /** 是否可被 Tab 焦点遍历拾取（默认 false） */
  focusable?: boolean;
  /** Tab 遍历显式顺序（默认 null，走文档序） */
  focusOrder?: number | null;
  /** 是否圈定焦点（模态弹出层；默认 false） */
  focusTrap?: boolean;
  /** 键盘事件处理（编辑器实现；非编辑器默认不消费） */
  handleKey?: (e: KeyEvent2) => boolean;
  /** 布局扩展对象（grow/align 等），经 flex 的 findExt 识别 */
  exts?: readonly any[];
  draw?(ctx2: CanvasRenderingContext2D, n: Node2): void;
  /**
   * 在父坐标系上的预绘制钩子（可选，默认空实现，对标 Kotlin Node.drawAtParent）：
   * 父节点 draw 时在 translate 到本节点前调用。如 ScrollContent 传入按容器
   * inner 区裁剪的实现。
   */
  drawAtParent?(ctx2: CanvasRenderingContext2D): void;
  mouseClick?(event: MouseEvent2): void;
  mouseDown?(event: MouseEvent2): void;
  mouseUp?(event: MouseEvent2): void;
  mouseMove?(event: MouseEvent2): void;
  /** 捕获阶段钩子（根 → 叶，先于冒泡；对标旧版 canvasRender 的 mouse*Capture） */
  mouseClickCapture?(event: MouseEvent2): void;
  mouseDownCapture?(event: MouseEvent2): void;
  mouseUpCapture?(event: MouseEvent2): void;
  mouseMoveCapture?(event: MouseEvent2): void;
  /** 鼠标光标（悬停时）；不指定时由引擎按"编辑器→text / 可聚焦→pointer"派生 */
  cursor?: CursorType2 | GetValue<CursorType2>;

  size?(s: PointKey): LayoutSize;
  paddingInline?(s: StartEnd): number;
  paddingBlock?(s: StartEnd): number;
  padding?(p: PointKey, s: StartEnd): number;
  position?(s: PointKey): number;
  children?: readonly Fc[];
}

function toOuterSize(
  p: PointKey,
  n: Node2,
  argSize: (p: PointKey) => LayoutSize
) {
  const s = argSize(p);
  if (typeof s == 'number') {
    return s;
  }
  if (s.fromInside) {
    return s.value + paddingStart(n, p) + paddingEnd(n, p);
  }
  return s.value;
}

export function commonNode({
  node,
  draw = emptyFun,
  size: argSize = alaways0,
  position: argPosition = alaways0,
  padding = alaways0,
  paddingInline = s => padding('x', s),
  paddingBlock = s => padding('y', s),
}: {
  node: Node2;
  draw?(ctx2: CanvasRenderingContext2D, n: Node2): void;
  size?(s: PointKey): LayoutSize;
  position?(s: PointKey): number;
  paddingInline?(s: StartEnd): number;
  paddingBlock?(s: StartEnd): number;
  padding?(p: PointKey, s: StartEnd): number;
}) {
  node.exts = node.exts || emptyArray;
  node.draw = function (ctx2) {
    draw(ctx2, node);
    for (const child of node.children()) {
      if (child.skipDraw()) {
        continue;
      }
      ctx2.save();
      // 子节点在父坐标系上的预绘制钩子（对标 Kotlin Node.draw 里的
      // child.drawAtParent(canvas)）：裁剪等行为由子节点自己重写，基类零感知
      child.drawAtParent(ctx2);
      ctx2.translate(child.x(), child.y());
      child.draw(ctx2);
      ctx2.restore();
    }
  };
  node.notInLayout = node.notInLayout || alawaysFalse;
  node.selectionEnabled = node.selectionEnabled || alawaysTrue;
  if (!node.width) {
    node.width = () => toOuterSize('x', node, argSize);
  }
  if (!node.height) {
    node.height = () => toOuterSize('y', node, argSize);
  }
  if (!node.x) {
    node.x = () => argPosition('x');
  }
  if (!node.y) {
    node.y = () => argPosition('y');
  }
  if (!node.hide) {
    node.hide = alawaysFalse;
  }
  if (!node.skipDraw) {
    node.skipDraw = alawaysFalse;
  }
  if (!node.drawAtParent) {
    node.drawAtParent = emptyFun;
  }
  node.layoutChildren = memo(
    () => {
      return node.children().filter(n => !n.notInLayout());
    },
    list => {
      let i = 0;
      list.forEach(row => {
        row._layoutIndex = i++;
      });
    }
  );
  node.layoutIndex = () => {
    if (node.hide()) {
      throw new Error('已经隐藏不再显示');
    }
    if (node.notInLayout()) {
      throw new Error('当前节点不在Layout中');
    }
    node.parent?.layoutChildren();
    return node._layoutIndex;
  };
  if (!node.acceptHit) {
    node.acceptHit = (x, y) =>
      x > 0 && y > 0 && x < node.width() && y < node.height();
  }
  if (!node.acceptClip) {
    node.acceptClip = () => true;
  }
  if (!node.paddingInlineStart) {
    node.paddingInlineStart = () => paddingInline('start');
  }
  if (!node.paddingInlineEnd) {
    node.paddingInlineEnd = () => paddingInline('end');
  }
  if (!node.paddingBlockStart) {
    node.paddingBlockStart = () => paddingBlock('start');
  }
  if (!node.paddingBlockEnd) {
    node.paddingBlockEnd = () => paddingBlock('end');
  }
  if (!node.layout) {
    node.layout = {
      layout(d) {
        return absoluteLayoutFun;
      },
    };
  }
  node.layoutX = createLayout(node, 'x');
  node.layoutY = createLayout(node, 'y');
}
export function buildChildren(
  ctx: StateHolderWithNode<Node2, readonly Node2[]>,
  children: readonly Fc[]
) {
  children.forEach(child => child(ctx));
}
export const node2 = tfc(function (
  ctx,
  node,
  {
    size: argSize,
    position: argPosition,
    padding,
    paddingBlock,
    paddingInline,
    draw,
    children = emptyArray,
    ...rest
  }: Node2Arg
) {
  const parent = ctx.getParent() as Node2;
  Object.assign(node, rest);
  node.parent = parent;
  // 焦点字段与默认方法（对齐 Kotlin focusable/focusOrder/focusTrap/requestFocus）
  node.focusable = node.focusable ?? false;
  node.focusOrder = node.focusOrder ?? null;
  node.focusTrap = node.focusTrap ?? false;
  if (!node.isFocused) node.isFocused = () => focusIsFocused(node);
  if (!node.requestFocus) node.requestFocus = () => focusRequest(node);
  if (!node.handleKey) node.handleKey = () => false;
  if (!argSize) {
    argSize = d => defaultSize(node, d);
  }
  if (!argPosition) {
    argPosition = d => defaultPosition(node, d);
  }
  node.index = () => {
    if (node.hide()) {
      throw new Error('已经隐藏不再显示');
    }
    parent.children();
    return node._index;
  };
  ctx.addNode(node);
  node.children = ctx.renderNode(
    node,
    function (this: StateHolderWithNode<Node2, readonly Node2[]>) {
      const it = this;
      buildChildren(it, children);
    },
    nodeConfig
  );
  commonNode({
    node,
    draw,
    size: argSize,
    position: argPosition,
    padding,
    paddingBlock,
    paddingInline,
  });
});
export interface NodeWithPosition2 {
  node: Node2;
  x: number;
  y: number;
  next: NodeWithPosition2 | null;
}

export function hitest(
  node: Node2,
  x: number,
  y: number
): NodeWithPosition2 | null {
  const localX = x - node.x();
  const localY = y - node.y();
  const children = node.children();
  for (let i = children.length - 1; i >= 0; i--) {
    const child = children[i];
    if (child.acceptClip(localX, localY)) {
      const found = hitest(child, localX, localY);
      if (found) {
        return { node, x: localX, y: localY, next: found };
      }
    }
  }
  if (node.acceptHit(localX, localY)) {
    return { node, x: localX, y: localY, next: null };
  }
  return null;
}

export function absolutePosition(node: Node2, axis: 'x' | 'y'): number {
  let position = node[axis]();
  let parent: Node2Parent | undefined = node.parent;
  while (parent) {
    position += parent[axis]();
    parent = parent.parent;
  }
  return position;
}

export function absoluteX(node: Node2): number {
  return absolutePosition(node, 'x');
}

export function absoluteY(node: Node2): number {
  return absolutePosition(node, 'y');
}
