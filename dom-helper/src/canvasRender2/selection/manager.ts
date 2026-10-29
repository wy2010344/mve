import { createSignal, memo } from 'wy-helper';
import { rectOf, unionRect } from '../geom/rect';
import type { Rect2 } from '../geom/rect';
import type { Node2 } from '../tree/protocol';
import type {
  HitestResult2,
  PointerSelect2,
  SelPair2,
  SelPoint2,
  Selectable2,
} from '../tree/interaction';
import { asSelectable2, collectSelectables } from './selectable';

/**
 * 全局唯一的选中协调者（信号驱动，零命令式状态）。
 *
 * 这里没有 class：`createSelectionManager(source)` 返回一个对象，私有状态
 * （memo / 信号）藏在闭包里——ooc 侧对应「对象字面量 + `storage ref`」，
 * 每条能力都是一条可发消息的成员。
 *
 * 「什么地方被选中了」完全由初始原因**计算**得出，本对象没有任何
 * setSelection 推送入口：
 * - **指针会话**：pointerSelect（press/release 快照）+ moveHitTest 推导两端。
 *   按住中焦点跟随移动；release 填入即定格（hover 自然失效）；
 *   press 落在可选文本之外 → 整个选区为空（原生文本编辑器语义：Flutter `EditableText`
 *   / Compose `TextField` 点击空白处即清除选区）；
 *   Shift 扩展的锚点继承由指针路由在 mouseDown 时复用上一会话的 press 实现。
 * - **键盘选择**：活跃编辑器光标信号直接派生。
 * - **程序化指令**（selectAll / select / clear）：一次性脉冲事件物化为
 *   programmatic 信号，任何更高优先级的来源出现即自动失效。
 *
 * 各节点的范围分配（rangeOf）是端点与注册表的纯派生（memo），无反向写回：
 * 没有 applySelection 推送、没有本地副本，「谁被选中」只有这一份真相。
 */

/** 派生源（由渲染器提供；测试可直接用信号模拟指针序列） */
export interface SelectionSource2 {
  pointerSelect(): PointerSelect2 | null;
  moveHitTest(): HitestResult2 | null;
  /** 活跃编辑器的光标端点对；无编辑器时 null */
  activeEditorSelPair(): SelPair2 | null;
  /** 渲染树根（可选集合遍历用） */
  rootNode(): Node2 | null;
  /** 撤除指针会话（程序化指令落装前调用，保证生效） */
  clearPointerSelect(): void;
  /** 活跃编辑器（程序化选区路由目标）；无则 undefined */
  activeEditor(): EditorSelectionRoute | undefined;
}

/**
 * 程序化选区落到编辑器本地光标的最小契约（与 EditableTextHandle 结构兼容，
 * 避免 SelectionManager 反向依赖 Focus 产生循环 import）。
 */
export interface EditorSelectionRoute {
  selectRange(anchorOffset: number, focusOffset: number): void;
  selectAll(): void;
}

/** 选择器对外能力（全部是消息） */
export interface SelectionManager2 {
  /** 对象当前是否在可选集合内（活性 + selectionEnabled 子树声明的统一判定） */
  isSelectable(node: unknown): boolean;
  /** 指定节点当前被分配的选中范围 [start, end)；null 表示未被选中 */
  rangeOf(selectable: Selectable2): [number, number] | null;
  /** 选中文本聚合（按文档序拼接各节点被分配片段）；无选中返回 null */
  selectedText(): string | null;
  /** 当前生效端点对的**锚点**（对标 Kotlin `anchorSel`）：与焦点是派生结果，不是状态 */
  anchorSel(): SelPoint2 | null;
  /** 当前生效端点对的**焦点**（对标 Kotlin `focusSel`） */
  focusSel(): SelPoint2 | null;
  /** 是否存在选中 */
  hasSelection(): boolean;
  /** 选中区域的包围盒（供 popover 定位）；无选中返回 null */
  selectedRect(): Rect2 | null;
  /** 全选：从首个可选节点开头到末节点末尾 */
  selectAll(): void;
  /** 清除程序化选区（指针定格选区由下一次按下自动覆盖清除） */
  clear(): void;
  /** 编程式设置选区区间；返回 false 表示目标节点不在可选集合内 */
  select(
    anchor: Selectable2,
    anchorOffset: number,
    focus: Selectable2,
    focusOffset: number
  ): boolean;
}

export function createSelectionManager(
  source: SelectionSource2
): SelectionManager2 {
  // ---------- 可选集合（纯派生，无命令式注册表） ----------

  /**
   * 当前可参与选择的节点集合（memo）：从渲染树根前序遍历计算。
   * 节点销毁（移出树）、隐藏（purifyList 过滤）即自动出局——
   * 不存在任何需要生命周期配对的注册/注销调用，从根上杜绝"过期注册表"。
   */
  const selectables = memo(() => {
    const list: Selectable2[] = [];
    const root = source.rootNode();
    if (root) collectSelectables(root, list);
    return list;
  });

  /** 文档序下标（memo）：前序遍历序即文档序，拖拽过程中零排序成本 */
  const order = memo(() => {
    const map = new Map<Selectable2, number>();
    selectables().forEach((s, i) => map.set(s, i));
    return map;
  });

  /** 程序化指令的唯一落点：脉冲事件没有持续信号可供推导，物化为一个信号 */
  const programmatic = createSignal<SelPair2 | null>(null);

  // ---------- 派生源 → 端点对 ----------

  /** 命中链从深到浅找第一个"仍在树上"的可选文本节点，并把命中点换算为该节点的文本偏移 */
  function pointFrom(hit: HitestResult2 | null): SelPoint2 | null {
    if (!hit) return null;
    const ord = order();
    for (let i = hit.chain.length - 1; i >= 0; i--) {
      const sel = asSelectable2(hit.chain[i].node);
      // 快照链可能引用已销毁/隐藏的节点，其布局坐标已失效，必须跳过
      if (sel && ord.has(sel)) {
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
  function pointerPair(s: PointerSelect2): SelPair2 | null {
    const a = pointFrom(s.press);
    if (!a) return null;
    const f = s.release
      ? pointFrom(s.release)
      : pointFrom(source.moveHitTest());
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
  function currentPair(): SelPair2 | null {
    const s = source.pointerSelect();
    // #1 按住中：实时跟随 moveHit
    if (s && s.release == null) return pointerPair(s);
    // #2 非塌缩光标：用户正在编辑器里显式选择（高于定格指针）
    const cursorPair = source.activeEditorSelPair();
    const cursorExpanded =
      cursorPair && cursorPair.anchor.offset != cursorPair.focus.offset
        ? cursorPair
        : null;
    if (cursorExpanded) return cursorExpanded;
    // #3 定格指针：拖选释放后的保留选区
    if (s) return pointerPair(s);
    // #4 塌缩光标：编辑器已聚焦但无选中（仅压制 #5）
    if (cursorPair) return cursorPair;
    // #5 程序化
    return programmatic.get();
  }

  // ---------- 范围分配（纯派生） ----------

  /**
   * 全表分配快照（memo）：按文档序把 [anchor, focus] 区间映射到各节点。
   * - 起点/终点同节点 → 局部范围；仅起点 → [offset, len]；仅终点 → [0, offset]
   * - 夹在中间的节点 → 全文；其余不出现
   * Map 保持插入序即文档序，供 selectedText 直接按序拼接。
   */
  const ranges = memo(() => {
    const map = new Map<Selectable2, [number, number]>();
    const pair = currentPair();
    if (!pair) return map;
    const ord = order();
    const ia = ord.get(pair.anchor.node);
    const ifo = ord.get(pair.focus.node);
    if (ia == null || ifo == null) return map;
    const forward = ia <= ifo;
    const first = forward ? pair.anchor : pair.focus;
    const second = forward ? pair.focus : pair.anchor;
    const lo = Math.min(ia, ifo);
    const hi = Math.max(ia, ifo);
    for (const [node, idx] of ord) {
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

  /** 选中文本聚合：按文档序拼接各节点被分配片段 */
  function selectedText(): string | null {
    let text = '';
    for (const [s, r] of ranges()) {
      text += s.textInRange(r[0], r[1]);
    }
    return text.length > 0 ? text : null;
  }

  return {
    isSelectable(node) {
      return order().has(node as Selectable2);
    },

    rangeOf(selectable) {
      return ranges().get(selectable) ?? null;
    },

    selectedText,

    anchorSel() {
      return currentPair()?.anchor ?? null;
    },

    focusSel() {
      return currentPair()?.focus ?? null;
    },

    hasSelection() {
      return selectedText() != null;
    },

    selectedRect() {
      let result: Rect2 | null = null;
      for (const [s, range] of ranges()) {
        if (range[1] <= range[0]) continue;
        const rect = s.selectionRect();
        if (!rect) continue;
        result = result ? unionRect(result, rect) : rect;
      }
      return result;
    },

    // ---------- 程序化指令（脉冲事件的物化入口） ----------

    selectAll() {
      // 活跃编辑器存在时，全选写进编辑器本地光标（对齐 Kotlin SelectionManager.selectAll）
      const ed = source.activeEditor();
      if (ed) {
        ed.selectAll();
        return;
      }
      const all = selectables();
      if (all.length == 0) return;
      // 新指令物化即撤除旧指针会话（含定格），否则冻结端点会在派生链中压制本指令
      source.clearPointerSelect();
      const last = all[all.length - 1];
      programmatic.set({
        anchor: { node: all[0], offset: 0 },
        focus: { node: last, offset: last.textLength() },
      });
    },

    clear() {
      programmatic.set(null);
    },

    select(anchor, anchorOffset, focus, focusOffset) {
      // 活跃编辑器存在时，程序化选区必须写进编辑器本地光标（对齐 Kotlin），
      // 否则会被"塌缩光标"（优先级 #4）压制 → 双击选词/三击选段永不显示。
      const ed = source.activeEditor();
      if (ed) {
        if (
          (anchor as unknown) !== (ed as unknown) ||
          (focus as unknown) !== (ed as unknown)
        ) {
          return false;
        }
        ed.selectRange(anchorOffset, focusOffset);
        return true;
      }
      if (!order().has(anchor) || !order().has(focus)) return false;
      source.clearPointerSelect();
      programmatic.set({
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
    },
  };
}
