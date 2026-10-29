import { alawaysFalse, alawaysTrue, emptyFun } from 'wy-helper';
import type { PointKey } from 'wy-helper';
import type { Node2Messages } from './protocol';
import type { Node2, StartEnd } from './protocol';
import { defaultPosition, defaultSize } from './geometry';
import {
  isFocused as focusIsFocused,
  requestFocus as focusRequest,
} from './engineGlobal';

/**
 * 「参数对象」的兜底实现 + 合并规则（TS / ooc 共用的一层胶水）。
 *
 * 整体只有两步，和 ooc 完全同形：
 * ```ooc
 * p = merge $ arg defaults;   // 参数对象 + 兜底对象 → 中间对象
 * n = merge $ shell p;        // 结构消息优先，其余消息落到 p（见 assemble.ts）
 * ```
 */

/**
 * 消息接收者：装配完成后，节点自己既回答 `Node2` 的结构消息，也回答
 * `Node2Messages` 的参数消息（因为 `node = merge(shell, p)`）。
 * 默认实现里的 `this` 就是这个类型——只发消息、不读对象结构。
 */
export type NodeMessageTarget = Node2 & Node2Messages;

/**
 * `merge $ overrides defaults`：与 ooc 的宿主内建 `merge` 同义。
 *
 * overrides 的成员优先，defaults 兜底；**两侧的成员都在结果里**（overrides 独有
 * 的成员同样可用，对应 ooc 文档里的 `w fly`），这正是「节点 = shell merge p」
 * 能一次成型的前提。`this` 不在这里绑定——调用时由接收者决定（ooc 同样）。
 *
 * 键枚举只允许出现在这里和 [resolveMessages] 两个宿主级辅助里：ooc 不能反射
 * 属性、也不能后置给对象加成员，业务代码必须整对象委托，不能逐个拷。
 */
export function merge<A extends object, D extends object>(
  overrides: A,
  defaults: D
): A & D {
  const out: Record<string, unknown> = {};
  const base = defaults as unknown as Record<string, unknown>;
  for (const key of Object.keys(base)) {
    out[key] = base[key];
  }
  const over = overrides as unknown as Record<string, unknown>;
  for (const key of Object.keys(over)) {
    const value = over[key];
    // undefined ≈ 没写该成员（ooc：这个成员不存在；Rust：`None`），不覆盖默认
    if (value !== undefined) {
      out[key] = value;
    }
  }
  return out as A & D;
}

/**
 * 按**消息契约**解析参数：`Node2Messages` 的每个消息，`arg` 给了非 undefined
 * 值就用它，否则取 [nodeMessageDefaults]。
 *
 * 与 [merge] 的唯一差别是"要不要把 arg 的独有成员收进来"：这里不要——工厂配置
 * （`children` / `exts` / `layout`）不是消息，进了 `p` 就会顺着 `merge(shell, p)`
 * 漏成节点字段（尤其 `exts` 必须只经 `findExt` 暴露）。
 *
 * ooc 侧没有这一步：那里工厂是显式多参（parent / children / exts / layout / arg），
 * 参数对象本来就只装消息，构建设置根本不会混进来。
 */
export function resolveMessages(
  arg: Partial<Node2Messages>,
  defaults: Node2Messages
): Node2Messages {
  const out: Record<string, unknown> = {};
  const source = arg as unknown as Record<string, unknown>;
  const base = defaults as unknown as Record<string, unknown>;
  for (const key of Object.keys(base)) {
    const value = source[key];
    out[key] = value === undefined ? base[key] : value;
  }
  return out as unknown as Node2Messages;
}

function paddingOf(a: Node2Messages, d: PointKey, side: StartEnd): number {
  return d === 'x' ? a.paddingInline(side) : a.paddingBlock(side);
}

/**
 * 外尺寸：`size` 给数值直接用；给 `fromInside` 的尺寸则加上 padding。
 * 结果钳到 ≥ 0（负 padding / 负尺寸不该把盒子算成负数，对标 Kotlin `outerSize`）。
 * 只通过**参数对象**（`this`）求值、不碰节点结构，这样它在 ooc / Rust 里都能
 * 原样写成「给自己发消息」的默认实现。
 */
function outerSize(d: PointKey, a: Node2Messages): number {
  const s = a.size(d);
  if (typeof s === 'number') {
    return Math.max(0, s);
  }
  if (!s.fromInside) {
    return Math.max(0, s.value);
  }
  return Math.max(
    0,
    s.value + paddingOf(a, d, 'start') + paddingOf(a, d, 'end')
  );
}

/**
 * 兜底对象：`Node2Messages` 的默认实现，即「参数对象什么都没写时」的行为。
 *
 * **静态单例**（无闭包依赖）：所有默认实现一律通过 `this` 向下再发消息——
 * `paddingInline` → `this.padding`、`width` → `outerSize('x', this)`、
 * `size` → `defaultSize(this, …)`。所以不需要"先有节点才能造兜底对象"。
 *
 * 对应 ooc：顶层 `defaults = { hide { false }, width { outerSize this 'x' }, … }`；
 * 对应 Rust：`impl Default for Node2Messages`（每个字段一个具体闭包）。
 */
export const nodeMessageDefaults: Node2Messages = {
  // ---- 布局派生：尺寸 / 位置默认走父布局 ----
  size(this: NodeMessageTarget, d) {
    return defaultSize(this, d);
  },
  position(this: NodeMessageTarget, d) {
    return defaultPosition(this, d);
  },
  padding: () => 0,
  paddingInline(this: NodeMessageTarget, s) {
    return this.padding('x', s);
  },
  paddingBlock(this: NodeMessageTarget, s) {
    return this.padding('y', s);
  },
  paddingInlineStart(this: NodeMessageTarget) {
    return this.paddingInline('start');
  },
  paddingInlineEnd(this: NodeMessageTarget) {
    return this.paddingInline('end');
  },
  paddingBlockStart(this: NodeMessageTarget) {
    return this.paddingBlock('start');
  },
  paddingBlockEnd(this: NodeMessageTarget) {
    return this.paddingBlock('end');
  },
  x(this: NodeMessageTarget) {
    return this.position('x');
  },
  y(this: NodeMessageTarget) {
    return this.position('y');
  },
  width(this: NodeMessageTarget) {
    return outerSize('x', this);
  },
  height(this: NodeMessageTarget) {
    return outerSize('y', this);
  },
  // ---- 绘制 / 命中 ----
  draw: emptyFun,
  drawAtParent: emptyFun,
  hide: alawaysFalse,
  skipDraw: alawaysFalse,
  notInLayout: alawaysFalse,
  selectionEnabled: alawaysTrue,
  acceptHit(this: NodeMessageTarget, x, y) {
    // 半开区间：左/上边界含、右/下边界不含（避免相邻兄弟节点在边界上双命中）
    return x >= 0 && y >= 0 && x < this.width() && y < this.height();
  },
  acceptClip: () => true,
  cursor: () => null,
  // ---- 焦点（读取式，对齐 Kotlin focusable/focusOrder/focusTrap） ----
  focusable: alawaysFalse,
  focusOrder: () => null,
  focusTrap: alawaysFalse,
  isFocused(this: NodeMessageTarget) {
    return focusIsFocused(this);
  },
  requestFocus(this: NodeMessageTarget) {
    focusRequest(this);
  },
  handleKey: () => false,
  onComposing: emptyFun,
  debugName: () => null,
  // ---- 鼠标钩子：默认不响应 ----
  mouseClick: emptyFun,
  mouseDown: emptyFun,
  mouseUp: emptyFun,
  mouseMove: emptyFun,
  mouseWheel: emptyFun,
  mouseContextMenu: emptyFun,
  mouseDoubleClick: emptyFun,
  mouseClickCapture: emptyFun,
  mouseDownCapture: emptyFun,
  mouseUpCapture: emptyFun,
  mouseMoveCapture: emptyFun,
  mouseWheelCapture: emptyFun,
  mouseContextMenuCapture: emptyFun,
  mouseDoubleClickCapture: emptyFun,
};
