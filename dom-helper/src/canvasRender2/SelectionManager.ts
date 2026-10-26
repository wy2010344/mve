import { createSignal, memo } from 'wy-helper';
import { createContext } from 'mve-core';
import { RectF, unionRect } from './Geometry';
import type { Node2 } from './Node';

/** 选中矩形（全局坐标） */
export interface Rect2 {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * 可被 SelectionManager 统一管理的可选文本区域。
 * 对标 Kotlin 版 Selectable：节点是纯数据面，只提供坐标换算与文本查询；
 * 选区真相由 SelectionManager 持有（信号驱动拉模型），节点按需读取
 * [SelectionManager2.rangeOf] 并绘制高亮，没有任何反向写回。
 *
 * 业务层只需把这些方法挂到 Node2 上（见 richTextNode），自动享受：
 * - 跨组件拖拽选择与 selectedText 聚合读取
 * - 双击选词 / 三击选段 / Shift 锚点继承
 * - Cmd+A 全选等程序化指令
 */
export interface Selectable2 {
  /** 选中区域（全局坐标），供 popover 定位；无选区返回 null */
  selectionRect(): Rect2 | null;
  /** 文本总长度（越界钳制 / 全选） */
  textLength(): number;
  /** 全局坐标 → 本节点文本偏移（跨节点拖拽时由目标节点换算） */
  positionForPoint(globalX: number, globalY: number): number;
  /** 读取指定范围文本（selectedText 聚合拼接用） */
  textInRange(start: number, end: number): string;
  /** 包含 offset 的词边界（半开区间），供双击选词；无法分词返回 null */
  wordRangeAt?(offset: number): [number, number] | null;
  /** 包含 offset 的逻辑段落范围（半开，'\n' 分隔），供三击选段；不支持返回 null */
  paragraphRangeAt?(offset: number): [number, number] | null;
}

/** 选区端点：某个可选节点内的偏移位置 */
export interface SelPoint2 {
  readonly node: Selectable2;
  readonly offset: number;
}

/** 一对端点：锚点与焦点 */
export interface SelPair2 {
  readonly anchor: SelPoint2;
  readonly focus: SelPoint2;
}

/** 一次指针按下的命中快照；chain 为 root→leaf，x/y 为全局（canvas）坐标 */
export interface HitestResult2 {
  readonly chain: readonly {
    readonly node: Node2;
    readonly x: number;
    readonly y: number;
  }[];
  readonly x: number;
  readonly y: number;
  readonly time: number;
}

/**
 * 一次指针选择会话：按下快照 + 释放快照。
 * - release 为 null 表示仍在按住中：焦点端点跟随 moveHitTest；
 * - release 非 null 表示已松手定格：焦点冻结在释放位置，hover 不再影响选区；
 * - Shift+按下时引擎复用上一会话的 press（锚点继承），仅重新进入按住态。
 *
 * 由引擎在 mouseDown（创建 / 复用）与 mouseUp / mouseleave（填 release）写入，
 * 是"指针落在哪"这一原始事实的记录；选区由 SelectionManager 从它纯派生。
 */
export interface PointerSelect2 {
  readonly press: HitestResult2 | null;
  readonly release: HitestResult2 | null;
}

/** SelectionManager 的派生源（由渲染器提供；测试可直接用信号模拟指针序列） */
export interface SelectionSource2 {
  pointerSelect(): PointerSelect2 | null;
  moveHitTest(): HitestResult2 | null;
  /** 活跃编辑器的光标端点对；canvasRender2 暂无编辑器，恒 null */
  activeEditorSelPair(): SelPair2 | null;
  /** 渲染树根（可选集合遍历用） */
  rootNode(): Node2 | null;
  /** 撤除指针会话（程序化指令落装前调用，保证生效） */
  clearPointerSelect(): void;
}

/**
 * 双击后按住拖拽的词级扩展（纯函数）：锚词 [anchorStart, anchorEnd) 固定，
 * 目标偏移在锚词之外时，对应端吸附到目标处整词的边界；无分词能力时退化为字符粒度。
 */
export function expandWordSelection(
  anchorStart: number,
  anchorEnd: number,
  target: number,
  wordRangeAt: (offset: number) => [number, number] | null
): [number, number] {
  if (target < anchorStart) {
    const w = wordRangeAt(target);
    return [w ? w[0] : target, anchorEnd];
  }
  if (target > anchorEnd) {
    const w = wordRangeAt(target);
    return [anchorStart, w ? w[1] : target];
  }
  return [anchorStart, anchorEnd];
}

/** 节点是否为可选文本区域（Selectable2 的结构判定，无需注册） */
export function asSelectable2(node: Node2): Selectable2 | null {
  return typeof (node as any).positionForPoint == 'function'
    ? (node as unknown as Selectable2)
    : null;
}

function collectSelectables(node: Node2, out: Selectable2[]): void {
  for (const child of node.children()) {
    if (!child.selectionEnabled()) continue; // 声明性退出选择：剪枝整棵子树
    const sel = asSelectable2(child);
    if (sel) out.push(sel);
    collectSelectables(child, out); // 可选节点内仍可嵌套可选节点
  }
}

/**
 * SelectionManager：全局唯一的选中协调者（信号驱动，零命令式状态）。
 *
 * "什么地方被选中了"完全由初始原因**计算**得出，本类没有任何 setSelection 推送入口：
 * - **指针会话**：pointerSelect（press/release 快照）+ moveHitTest 推导两端。
 *   按住中焦点跟随移动；release 填入即定格（hover 自然失效）；
 *   press 落在可选文本之外 → 整个选区为空（浏览器语义：点击空白清除）；
 *   Shift 扩展的锚点继承由引擎在 mouseDown 时复用上一会话的 press 实现。
 * - **键盘选择**：活跃编辑器光标信号直接派生（canvasRender2 暂无编辑器）。
 * - **程序化指令**（selectAll / select / clear）：一次性脉冲事件物化为
 *   programmatic 信号，任何更高优先级的来源出现即自动失效。
 *
 * 各节点的范围分配（rangeOf）是端点与注册表的纯派生（memo），无反向写回：
 * 没有 applySelection 推送、没有本地副本，"谁被选中"只有这一份真相。
 */
export class SelectionManager2 {
  constructor(private readonly source: SelectionSource2) {}

  // ---------- 可选集合（纯派生，无命令式注册表） ----------

  /**
   * 当前可参与选择的节点集合（memo）：从渲染树根前序遍历计算。
   * 节点销毁（移出树）、隐藏（purifyList 过滤）即自动出局——
   * 不存在任何需要生命周期配对的注册/注销调用，从根上杜绝"过期注册表"。
   */
  private readonly selectables = memo(() => {
    const list: Selectable2[] = [];
    const root = this.source.rootNode();
    if (root) collectSelectables(root, list);
    return list;
  });

  /** 文档序下标（memo）：前序遍历序即文档序，拖拽过程中零排序成本 */
  private readonly order = memo(() => {
    const map = new Map<Selectable2, number>();
    this.selectables().forEach((s, i) => map.set(s, i));
    return map;
  });

  /** 对象当前是否在可选集合内（活性 + selectionEnabled 子树声明的统一判定） */
  isSelectable(node: unknown): boolean {
    return this.order().has(node as Selectable2);
  }

  // ---------- 派生源 → 端点对 ----------

  /** 命中链从深到浅找第一个"仍在树上"的可选文本节点，并把命中点换算为该节点的文本偏移 */
  private pointFrom(hit: HitestResult2 | null): SelPoint2 | null {
    if (!hit) return null;
    const order = this.order();
    for (let i = hit.chain.length - 1; i >= 0; i--) {
      const sel = asSelectable2(hit.chain[i].node);
      // 快照链可能引用已销毁/隐藏的节点，其布局坐标已失效，必须跳过
      if (sel && order.has(sel)) {
        const offset = Math.min(
          Math.max(sel.positionForPoint(hit.x, hit.y), 0),
          sel.textLength()
        );
        return { node: sel, offset };
      }
    }
    return null;
  }

  /**
   * 指针会话推导端点对；press 落在可选文本之外返回 null（整个选区清空）。
   * - 按住中（release 未填）：焦点跟随 moveHitTest，尚未移动时退化为锚点；
   * - 已松手（release 已填）：焦点冻结在释放位置，hover 不再影响。
   */
  private pointerPair(s: PointerSelect2): SelPair2 | null {
    const a = this.pointFrom(s.press);
    if (!a) return null;
    const f = s.release
      ? this.pointFrom(s.release)
      : this.pointFrom(this.source.moveHitTest());
    return { anchor: a, focus: f ?? a };
  }

  /**
   * 当前生效端点对。优先级从高到低（后者被前者自动压制，无需失效命令）：
   * 1. 按住中的指针会话 —— 拖拽进行时；
   * 2. 活跃编辑器的**非塌缩**本地光标 —— 键盘扩选 / 双击选词等显式选择；
   * 3. 已定格的指针会话 —— 松手后保留，hover 不影响；
   * 4. 活跃编辑器的**塌缩**本地光标 —— 仅压制 programmatic；
   * 5. 程序化会话 —— selectAll / select，任何交互发生即让位。
   */
  private get currentPair(): SelPair2 | null {
    const s = this.source.pointerSelect();
    // #1 按住中：实时跟随 moveHit
    if (s && s.release == null) return this.pointerPair(s);
    // #2 非塌缩光标：用户正在编辑器里显式选择（高于定格指针）
    const cursorPair = this.source.activeEditorSelPair();
    const cursorExpanded =
      cursorPair && cursorPair.anchor.offset != cursorPair.focus.offset
        ? cursorPair
        : null;
    if (cursorExpanded) return cursorExpanded;
    // #3 定格指针：拖选释放后的保留选区
    if (s) return this.pointerPair(s);
    // #4 塌缩光标：编辑器已聚焦但无选中（仅压制 #5）
    if (cursorPair) return cursorPair;
    // #5 程序化
    return this.programmatic.get();
  }

  /** 程序化指令的唯一落点：脉冲事件没有持续信号可供推导，物化为一个信号 */
  private readonly programmatic = createSignal<SelPair2 | null>(null);

  // ---------- 范围分配（纯派生） ----------

  /**
   * 全表分配快照（memo）：按文档序把 [anchor, focus] 区间映射到各节点。
   * - 起点/终点同节点 → 局部范围；仅起点 → [offset, len]；仅终点 → [0, offset]
   * - 夹在中间的节点 → 全文；其余不出现
   * Map 保持插入序即文档序，供 selectedText 直接按序拼接。
   */
  private readonly ranges = memo(() => {
    const map = new Map<Selectable2, [number, number]>();
    const pair = this.currentPair;
    if (!pair) return map;
    const order = this.order();
    const ia = order.get(pair.anchor.node);
    const ifo = order.get(pair.focus.node);
    if (ia == null || ifo == null) return map;
    const forward = ia <= ifo;
    const first = forward ? pair.anchor : pair.focus;
    const second = forward ? pair.focus : pair.anchor;
    const lo = Math.min(ia, ifo);
    const hi = Math.max(ia, ifo);
    for (const [node, idx] of order) {
      let range: [number, number] | null = null;
      if (node === first.node && node === second.node) {
        range = [
          Math.min(first.offset, second.offset),
          Math.max(first.offset, second.offset),
        ];
      } else if (node === first.node) {
        range = [first.offset, node.textLength()];
      } else if (node === second.node) {
        range = [0, second.offset];
      } else if (idx > lo && idx < hi) {
        range = [0, node.textLength()];
      }
      if (range && range[1] > range[0]) map.set(node, range);
    }
    return map;
  });

  /** 指定节点当前被分配的选中范围 [start, end)；null 表示未被选中 */
  rangeOf(selectable: Selectable2): [number, number] | null {
    return this.ranges().get(selectable) ?? null;
  }

  // ---------- 聚合读取 ----------

  /** 选中文本聚合：按文档序拼接各节点被分配片段 */
  get selectedText(): string | null {
    let text = '';
    for (const [s, r] of this.ranges()) {
      text += s.textInRange(r[0], r[1]);
    }
    return text.length > 0 ? text : null;
  }

  /** 是否存在选中 */
  get hasSelection(): boolean {
    return this.selectedText != null;
  }

  /** 选中区域的包围盒（供 popover 定位）：取所有选中片段的并集 */
  get selectedRect(): Rect2 | null {
    let result: RectF | null = null;
    for (const [s, range] of this.ranges()) {
      if (range[1] <= range[0]) continue;
      const rect = s.selectionRect();
      if (!rect) continue;
      const r = new RectF(rect.left, rect.top, rect.right, rect.bottom);
      result = result ? unionRect(result, r) : r;
    }
    return result;
  }

  // ---------- 程序化指令（脉冲事件的物化入口） ----------

  /** 全选：从首个可选节点开头到末节点末尾；无注册节点时不做任何事 */
  selectAll(): void {
    const all = this.selectables();
    if (all.length == 0) return;
    // 新指令物化即撤除旧指针会话（含定格），否则冻结端点会在派生链中压制本指令
    this.source.clearPointerSelect();
    const last = all[all.length - 1];
    this.programmatic.set({
      anchor: { node: all[0], offset: 0 },
      focus: { node: last, offset: last.textLength() },
    });
  }

  /** 清除程序化选区。（指针定格选区由下一次按下自动覆盖清除。） */
  clear(): void {
    this.programmatic.set(null);
  }

  /**
   * 编程式设置任意选区区间（声明式写入初始原因，非反向同步）：
   * 物化为 programmatic 会话，任何指针交互出现即自动让位，无需失效命令。
   * @return 节点未注册时返回 false
   */
  select(
    anchor: Selectable2,
    anchorOffset: number,
    focus: Selectable2 = anchor,
    focusOffset: number = anchorOffset
  ): boolean {
    if (!this.isSelectable(anchor) || !this.isSelectable(focus)) return false;
    this.source.clearPointerSelect();
    this.programmatic.set({
      anchor: {
        node: anchor,
        offset: Math.min(Math.max(anchorOffset, 0), anchor.textLength()),
      },
      focus: {
        node: focus,
        offset: Math.min(Math.max(focusOffset, 0), focus.textLength()),
      },
    });
    return true;
  }
}

export const selectionManagerContext = createContext<SelectionManager2 | null>(
  null
);
