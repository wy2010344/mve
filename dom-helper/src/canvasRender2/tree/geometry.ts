import { memo } from 'wy-helper';
import type {
  Layout,
  LayoutFun,
  LayoutInsideObject,
  PointKey,
} from 'wy-helper';
import { LayoutError } from 'wy-helper';
import type {
  LayoutSize,
  LayoutSizeDirection,
  Node2,
  Node2Parent,
  StartEnd,
} from './protocol';

/**
 * 尺寸 / 位置 / 命中的**纯消息算法**（TS 与 ooc 共用）。
 *
 * 全部只向节点发消息，不读对象结构、不做存在性判断——所以这段逻辑可以原样
 * 搬到 ooc（`n width` / `n paddingInlineStart` / `n children`）与 Rust（方法转调）。
 */

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

/**
 * 取某个轴上的布局对象（记忆化：布局对象本身按需构造一次）。
 * `layoutChildren` 是协议里的结构消息，所有节点都答得出来。
 */
export function createLayout(node: Node2, d: PointKey) {
  const inside: LayoutInsideObject<Node2> = {
    // 必须与 layoutIndex() 的编号基准一致：用过滤后的 layoutChildren，
    // 否则 notInLayout 的节点会参与测量（占 gap / 撑大容器），
    // 且 StackLayout 的 children[index] 会取错节点。
    children: () => node.layoutChildren(),
    innerSize: () => innerSize(node, d),
  };
  // 探测模式下不记忆：每次都重新测量，"父级读子项尺寸"才会被记成 READ 边
  // （命中缓存就不会走到子项，依赖图会缺边）
  if (layoutDep.probeMode) {
    return () => node.layout(d).createLayout(inside);
  }
  return memo(() => node.layout(d).createLayout(inside));
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
  recordSizeRead(node, d);
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

/**
 * 「尺寸一律由自己的子项推导」——浮层面板这类节点用它（对标 Kotlin
 * `LayoutNode.sizeFromChildren`）。
 *
 * **必须包 [withReader]**：与 [defaultSize] 一样，子项尺寸的读取要记到 *本节点*
 * 头上。漏了它，探测模式下 READ 边会记到「此刻正在测量的外层祖先」头上
 * （成 `(祖父, 孙)`），与 ASK 边的 `(父, 子)` 配不上 → 审计漏报。
 */
export function sizeFromChildren(node: Node2, d: PointKey): LayoutSize {
  return {
    value: withReader(node, () => layoutValue(node, d).sizeFromChildren()),
    fromInside: true,
  };
}

/**
 * 布局依赖成环错误。
 *
 * 刻意**不继承** `LayoutError`：`defaultPosition` 会捕获 `LayoutError` 并降级成
 * "退化为 padding start"，那种异常会被吞掉；成环必须让人看见。
 */
export class LayoutCycleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LayoutCycleError';
  }
}

/** 探测模式下记录的一条依赖边：`child` 在 `d` 方向上与 `parent` 互依 */
export interface LayoutProbeEdge2 {
  /** 父级：父链遍历只需要 x/y/layout*，所以按最小父类型存（ooc 侧同样） */
  readonly parent: Node2Parent;
  readonly child: Node2;
  readonly d: PointKey;
}

/**
 * 布局依赖追踪器（对标 Kotlin `LayoutDep`）。
 *
 * 模块级可变状态一律挂在这个对象上（ooc / Rust 侧它就是一个 `storage ref`
 * 持有者，不会散成模块级裸变量——那种东西在 ooc 里没有对应的表达）：
 * - `enabled`：诊断开关，置 false 可完全关掉依赖追踪（只留原生栈溢出）；
 * - `stack`：当前正在求值的「向父级索要尺寸」边；
 * - `probeMode` 及其三组状态：**探测模式**（[auditLayout] 用）。
 *   探测模式下 [sizeFromParent] 不再递归回父级，只记一条 ASK 边并返回占位
 *   尺寸（对应 Kotlin 的 `LayoutDep.probeMode`）；父级测量子项时记 READ 边。
 *   于是整棵树可以安全测量一遍拿到完整依赖图，判环退化成图上的配对，
 *   不必等环闭合时抛异常（那样只能拿到第一个环）。
 */
export const layoutDep = {
  enabled: true,
  stack: [] as Array<{ node: Node2; d: PointKey }>,
  probeMode: false,
  /** 正在测量的容器栈：栈顶即"谁在读子项尺寸" */
  readers: [] as Node2Parent[],
  askEdges: [] as LayoutProbeEdge2[],
  readEdges: [] as LayoutProbeEdge2[],
};

/** 取走并清空探测边（对应 Kotlin `LayoutDep.takeProbeEdges`） */
export function takeProbeEdges(): {
  asks: LayoutProbeEdge2[];
  reads: LayoutProbeEdge2[];
} {
  const asks = layoutDep.askEdges;
  const reads = layoutDep.readEdges;
  layoutDep.askEdges = [];
  layoutDep.readEdges = [];
  return { asks, reads };
}

/**
 * 记录一条 READ 边（父级测量子项尺寸）。
 * 只在探测模式下记账：非探测模式下 readers 恒空，这里直接返回。
 */
function recordSizeRead(node: Node2, d: PointKey): void {
  if (!layoutDep.probeMode) return;
  const readers = layoutDep.readers;
  if (readers.length == 0) return;
  layoutDep.readEdges.push({
    parent: readers[readers.length - 1],
    child: node,
    d,
  });
}

/** 以 [node] 为"正在测量者"执行一段求值（期间子项的尺寸读取都记到它头上） */
function withReader<T>(node: Node2Parent, run: () => T): T {
  if (!layoutDep.probeMode) return run();
  const readers = layoutDep.readers;
  readers.push(node);
  try {
    return run();
  } finally {
    readers.pop();
  }
}

function describeSizeEdge(node: Node2, d: PointKey): string {
  const name = node.debugName() ?? '节点';
  const dir = d === 'x' ? '宽' : '高';
  return `${name}(${dir})`;
}

function trackSize<T>(node: Node2, d: PointKey, run: () => T): T {
  if (!layoutDep.enabled) return run();
  const stack = layoutDep.stack;
  const repeatedAt = stack.findIndex(it => it.node === node && it.d === d);
  if (repeatedAt >= 0) {
    throw new LayoutCycleError(
      `布局依赖成环：${describeSizeEdge(node, d)} 的尺寸依赖父级，而父级正在测量它。\n` +
        `依赖链：${stack
          .map(it => describeSizeEdge(it.node, it.d))
          .join(' → ')} → ${describeSizeEdge(node, d)}\n` +
        '修法（二选一）：\n' +
        '  1) 让该节点有确定尺寸（不依赖父级）：返回 { value: 测得值, fromInside: false }；\n' +
        '  2) 让它成为 grow 子节点（grow({ argGrow: 1 })），由父级分配尺寸。'
    );
  }
  stack.push({ node, d });
  try {
    return run();
  } finally {
    stack.pop();
  }
}

/**
 * 把「向父级索要尺寸」失败的错误补上父子节点与轴，变成能照着改的诊断信息。
 *
 * 裸的 [LayoutError]（"没有子节点的尺寸" / "child should have it's own size"）
 * 只报结果不报对象：真凶常常是**父容器**漏了 layout，看起来却像子节点的问题。
 */
function enrichSizeError(
  e: unknown,
  node: Node2,
  parent: Node2,
  d: PointKey
): unknown {
  if (!(e instanceof LayoutError)) return e;
  return new LayoutError(
    `${describeSizeEdge(node, d)} 向父级索要尺寸失败：父级 ${describeSizeEdge(
      parent,
      d
    )} 无法分配（${e.message}）。\n` +
      '按顺序排查：\n' +
      "  1) 父容器带 children 却没指定 layout —— 补 layout: flex({ direction: '…' })；\n" +
      "  2) 子节点在该轴上没有自身尺寸 —— 给显式尺寸，或让父容器 alignItem:'stretch' 分配、子节点 grow({ argGrow: 1 })；\n" +
      '  3) 该子节点本就不该参与布局 —— 标 notInLayout 或 ignoreFlex。'
  );
}

/**
 * 子节点是否真的参与父级的测量（`notInLayout` 的不参与）。
 *
 * 只发消息：`layoutChildren()` 是协议里的结构消息，父节点都答得出来。
 */
function inLayoutChildren(parent: Node2, child: Node2): boolean {
  return parent.layoutChildren().indexOf(child) >= 0;
}

/**
 * 向父级索要尺寸 —— 全仓库唯一会让「子节点回读父级」发生的位置。
 *
 * 两道护栏，都发生在真正回读父级**之前**，所以错误信息能点名节点：
 * 1. **提前判环**：父级该轴的尺寸也来自子节点 ⇒ 父要子、子要父，必然成环；
 * 2. **失败补上下文**：回读失败时把父子节点、轴、修法一并带出。
 *
 * 另有 [trackSize] 兜底：同一 `(节点, 方向)` 二次进入即成环（布局若绕开
 * [Layout.allowSizeFromChildren] 自行回读父级，靠它兜住）。
 */
export function sizeFromParent(node: Node2, d: PointKey): LayoutSize {
  const parent = node.parent;
  if (!parent) {
    throw new Error('未找到父节点');
  }
  if (layoutDep.probeMode) {
    // 探测模式：记一条 ASK 边就返回占位尺寸，绝不回头问父级——
    // 否则环闭合处会直接抛异常，一次只能拿到第一个环
    layoutDep.askEdges.push({ parent, child: node, d });
    return { value: 0, fromInside: true };
  }
  // 运行期父节点必为完整 Node2（Node2Parent 只是父链遍历的最小消息集）
  const p = parent as Node2;
  if (layoutDep.enabled) {
    // 提前判环：父级该轴的尺寸同样来自子节点 ⇒ 父要子、子要父。
    // 等重入再抛的话，很可能先被 wy-helper 的 memo 拦下，退化成
    // "循环调用 memo" 这种指不到对象的报错。
    //
    // 只在「该节点确实参与父级布局」时才判：notInLayout 的子节点不在父级的
    // 测量范围里，父级的尺寸并不依赖它，不该扣成环的帽子（真正的毛病是
    // layoutIndex 取不到，交给下面的自然报错说清楚）。
    if (
      layoutValue(parent, d).allowSizeFromChildren() &&
      inLayoutChildren(p, node)
    ) {
      throw new LayoutCycleError(
        `布局依赖成环：${describeSizeEdge(node, d)} 向父级索要尺寸，` +
          `而父级 ${describeSizeEdge(p, d)} 该轴的尺寸也来自子节点（父要子、子要父）。\n` +
          '修法（二选一）：\n' +
          `  1) 让 ${describeSizeEdge(node, d)} 有确定尺寸（显式尺寸或内容自测量），不再依赖父级；\n` +
          '  2) 让它成为 grow 子节点（grow({ argGrow: 1 })），由父级分配尺寸。'
      );
    }
  }
  return trackSize(node, d, () => {
    try {
      const v = withReader(parent, () =>
        layoutValue(parent, d).childSize(node.layoutIndex())
      );
      return { value: v, fromInside: false };
    } catch (e) {
      throw enrichSizeError(e, node, p, d);
    }
  });
}

/**
 * 默认尺寸逻辑（未显式传 size 时使用）：
 * 布局允许由内容推导时取内容尺寸，否则取父布局分配的子尺寸。
 * 抽出来供需要"只覆盖一个轴、另一个轴走默认"的工厂（如 scrollContent）复用。
 */
export function defaultSize(node: Node2, d: PointKey): LayoutSize {
  const x = layoutValue(node, d);
  if (x.allowSizeFromChildren()) {
    return {
      value: withReader(node, () => x.sizeFromChildren()),
      fromInside: true,
    };
  }
  return sizeFromParent(node, d);
}

/**
 * 默认位置逻辑（未显式传 position 时使用）：
 * 父布局分配的子位置 + 父的 padding start；LayoutError（未参与布局）时退化为 padding start。
 */
export function defaultPosition(node: Node2, d: PointKey): number {
  const parent = node.parent;
  if (!parent) {
    throw new Error('未找到父节点');
  }
  // 运行期父节点必为完整 Node2（Node2Parent 只是父链遍历的最小消息集）
  const p = parent as Node2;
  try {
    return (
      withReader(parent, () =>
        layoutValue(parent, d).childPosition(node.layoutIndex())
      ) + getPadding(p, d, 'start')
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

/**
 * 命中链的一节（结构化最小集）：`node` 是当前节点，`x/y` 是**相对该节点**的局部坐标。
 * 只声明成普通数据（不含消息），这样上层可以在不了解节点的前提下遍历命中链。
 */
export interface NodeHit2 {
  readonly node: Node2;
  readonly x: number;
  readonly y: number;
}

/** 链式命中结果：`next` 指向更深的节点（首节为根，末节为最深命中） */
export interface NodeWithPosition2 extends NodeHit2 {
  next: NodeWithPosition2 | null;
}

/**
 * 命中测试：自叶向根深度优先，返回命中链（首节为根，末节为最深命中节点）。
 * 只发消息：`children()` / `acceptClip()` / `x()` / `y()` / `acceptHit()`。
 */
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

/**
 * 命中链展平成数组（root → leaf）。派发与光标派生都按这个顺序走，
 * 比链式 `next` 更好读，也便于 ooc 侧用数组原样表达。
 */
export function hitPath(
  root: Node2,
  x: number,
  y: number
): NodeWithPosition2[] {
  const path: NodeWithPosition2[] = [];
  let cur = hitest(root, x, y);
  while (cur) {
    path.push(cur);
    cur = cur.next;
  }
  return path;
}

/** 全局坐标：沿父链累加（只发 `x()` / `y()` / `parent` 消息） */
export function absolutePosition(node: Node2, axis: PointKey): number {
  let position = axis === 'x' ? node.x() : node.y();
  let parent: Node2Parent | undefined = node.parent;
  while (parent) {
    position += axis === 'x' ? parent.x() : parent.y();
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

/**
 * 节点是否被**祖父**的内容盒完全裁掉（`border` 为外扩容差）。
 *
 * 用于绘制期剪枝：滚动列表里已经滚出视口的行，即使自己不透明也完全不可见，
 * 直接跳过绘制能省掉大量 CanvasKit 调用（对标 Kotlin `clipAtGradParentNode`）。
 */
export function clipAtGradParentNode(node: Node2, border = 0): boolean {
  const parent = node.parent as Node2 | undefined;
  if (!parent) return false;
  const grand = parent.parent as Node2 | undefined;
  if (!grand) return false;
  const nx = node.x() + parent.x() - border;
  const ny = node.y() + parent.y() - border;
  const nw = node.width() + border * 2;
  const nh = node.height() + border * 2;
  const cx = grand.paddingInlineStart();
  const cy = grand.paddingBlockStart();
  const cw = innerSize(grand, 'x');
  const ch = innerSize(grand, 'y');
  return nx + nw <= cx || nx >= cx + cw || ny + nh <= cy || ny >= cy + ch;
}
