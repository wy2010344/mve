import type { Node2 } from './protocol';
import {
  CursorType2,
  pointerButtonMask,
  POINTER_BUTTON_LEFT,
  POINTER_BUTTON_RIGHT,
} from './protocol';
import type { PointerDevice } from './protocol';
import type { NodeHit2 } from './geometry';
import { cursorOfPath, dispatchMousePath } from './dispatch';
import type { MouseDispatchInit } from './dispatch';
import { focusableLeafOf } from './focusWalk';
import type {
  HitestResult2,
  PointerInput2,
  PointerSelect2,
  Selectable2,
} from './interaction';

/**
 * # 指针交互状态机（TS / ooc 共用）
 *
 * 职责：把"指针原始动作"翻译成"树上的语义"——更新 hover、派发指针消息、
 * 开/关选择会话、连击计数（双击选词 / 三击选段）、双击后的词级拖拽扩展、
 * 光标派生、按住键位掩码。
 *
 * 之所以能共用：这一整块**没有任何宿主 API**。输入是 [PointerInput2]
 * （x/y/button/shift/time/device 几个纯字段），输出是对 `deps` 里那组能力的调用。
 * ooc 侧宿主把它的指针事件填成同样字段、实现同样 deps，规则代码可原样搬。
 *
 * 与 `dispatch.ts` 的分工：那边只管"沿命中链按捕获→冒泡发消息"，
 * 这边管"什么时候该发、发给谁、附带什么状态"。
 */

/** 连击判定窗口（毫秒）与位移容差（画布像素），对标 Kotlin ClickTracker */
const CLICK_INTERVAL = 400;
const CLICK_DISTANCE = 5;

/**
 * 路由需要的外部能力。全部是"函数"而不是对象字段访问 ——
 * 状态机只**调用**它们，不关心它们背后是信号、变量还是别的东西
 * （ooc 侧就是一组方法，`this` 是宿主自己的壳）。
 */
export interface PointerRouterDeps {
  /** 命中链（root→leaf，每节含相对自身坐标）；空数组表示未命中 */
  hit(x: number, y: number): readonly NodeHit2[];
  /** 该节点上的可选文本能力；非可选返回 null */
  selectableOf(node: Node2): Selectable2 | null;
  /** 该可选对象当前是否在册（在树上、未隐藏、未被剪枝） */
  isSelectable(sel: Selectable2): boolean;
  /** 聚焦到该节点（null = 清除焦点） */
  focus(node: Node2 | null): void;
  /** 焦点是否落在编辑器上（是则宿主需要接管真实输入焦点） */
  hasActiveEditor(): boolean;
  /** 编辑器接管后的钩子（宿主同步 IME 焦点） */
  onEditorFocus(): void;
  /** 派发指针消息（内部走 dispatchMousePath）；返回是否被 stopPropagation 中断 */
  dispatch(init: MouseDispatchInit): boolean;
  /** 按下 / 抬起 / 离开时同步按住态信号（供绘制层做按压反馈） */
  setPressed(node: Node2 | null): void;
  pointerSelect(): PointerSelect2 | null;
  setPointerSelect(s: PointerSelect2 | null): void;
  moveHitTest(): HitestResult2 | null;
  setMoveHitTest(hit: HitestResult2 | null): void;
  /** 程序化选区（写进选择器） */
  selectRange(sel: Selectable2, start: number, end: number): void;
  /** 光标派生结果交给宿主落到 UI 上 */
  cursor(type: CursorType2): void;
}

export interface PointerRouter2 {
  /** 按下：返回 true 表示宿主需要 `preventDefault`（焦点落到编辑器） */
  down(input: PointerInput2): boolean;
  move(input: PointerInput2): void;
  up(input: PointerInput2): void;
  /** 指针离开画布 */
  leave(): void;
  /** 滚轮：返回 true 表示节点已消费（宿主不必再交给页面滚动） */
  wheel(
    x: number,
    y: number,
    deltaX: number,
    deltaY: number,
    device?: PointerDevice
  ): boolean;
  /** 指针被系统取消（触摸被打断等）：按抬起收尾，并清掉会话 */
  cancel(x: number, y: number, device?: PointerDevice, time?: number): void;
  click(x: number, y: number): void;
  doubleClick(x: number, y: number): void;
}

/** 双击后按住拖拽的词级扩展（纯函数）：锚词固定，另一端吸附到目标处整词边界 */
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

/** 连击计数：同一叶子、窗口内、位移容差内则递增，否则重置为 1 */
function createClickCounter() {
  let last: {
    node: Node2 | null;
    x: number;
    y: number;
    time: number;
    count: number;
  } | null = null;
  return function record(
    leaf: Node2 | null,
    x: number,
    y: number,
    time: number
  ): number {
    const prev = last;
    const count =
      prev &&
      leaf !== null &&
      prev.node === leaf &&
      Math.abs(x - prev.x) < CLICK_DISTANCE &&
      Math.abs(y - prev.y) < CLICK_DISTANCE &&
      time - prev.time < CLICK_INTERVAL
        ? prev.count + 1
        : 1;
    last = { node: leaf, x, y, time, count };
    return count;
  };
}

export function createPointerRouter(deps: PointerRouterDeps): PointerRouter2 {
  const recordClick = createClickCounter();
  /** 双击选词后的词级拖拽会话（同一节点内生效，松手即结束） */
  let wordDrag: { sel: Selectable2; start: number; end: number } | null = null;
  /**
   * 当前按住的按键位掩码。
   *
   * 由状态机自己维护而不直接透传平台掩码：各平台位序不同（DOM / AWT 各一套），
   * 而且"按下 / 抬起成对"只有引擎知道；节点侧只需认识一套编码。
   */
  let heldButtons = 0;
  /** 最近一次输入的设备类型（click / wheel 这类无设备参数的入口沿用） */
  let lastDevice: PointerDevice = 'mouse';
  let lastPointerId = 0;

  function hitAt(x: number, y: number, time: number): HitestResult2 | null {
    const chain = deps.hit(x, y);
    return chain.length ? { chain, x, y, time } : null;
  }

  function leafNodeOf(hit: HitestResult2 | null): Node2 | null {
    if (!hit || !hit.chain.length) return null;
    return hit.chain[hit.chain.length - 1].node;
  }

  /** 命中链中最深的、在册的可选文本节点 */
  function selectableLeaf(hit: HitestResult2 | null): Selectable2 | null {
    if (!hit) return null;
    for (let i = hit.chain.length - 1; i >= 0; i--) {
      const sel = deps.selectableOf(hit.chain[i].node);
      if (sel && deps.isSelectable(sel)) return sel;
    }
    return null;
  }

  function initOf(
    type: MouseDispatchInit['type'],
    x: number,
    y: number,
    button: number,
    wheelDeltaX: number,
    wheelDeltaY: number
  ): MouseDispatchInit {
    return {
      type,
      globalX: x,
      globalY: y,
      device: lastDevice,
      pointerId: lastPointerId,
      button,
      buttons: heldButtons,
      wheelDeltaX,
      wheelDeltaY,
    };
  }

  /** 普通派发（无滚轮量） */
  function fire(
    type: MouseDispatchInit['type'],
    x: number,
    y: number,
    button: number
  ) {
    deps.dispatch(initOf(type, x, y, button, 0, 0));
  }

  return {
    down(input) {
      lastDevice = input.device;
      lastPointerId = input.pointerId;
      heldButtons = heldButtons | pointerButtonMask(input.button);
      // 先刷新 hover 命中（任何按键都更新，含非主键——与 Kotlin mouseDown 顺序一致）
      const hit = hitAt(input.x, input.y, input.time);
      deps.setMoveHitTest(hit);
      if (input.button != POINTER_BUTTON_LEFT) {
        // 非左键不派发 down：否则右键按下会顺带启动文本拖选、滑块拖动等
        // 左键专属行为，退化成"假左键"。右键只派发上下文菜单。
        if (input.button === POINTER_BUTTON_RIGHT) {
          fire('contextmenu', input.x, input.y, input.button);
        }
        return false;
      }
      const leaf = leafNodeOf(hit);
      // 焦点先于 down 与选择两步：
      // ① 节点的 mouseDown 能读到 isFocused()，编辑器由此接管光标；
      // ② 双击/三击要把选区写进**编辑器本地光标**，那要求 activeEditor 此刻已更新
      //    ——否则 SelectionManager.select 发现目标不是活跃编辑器，直接返回 false。
      //    （Kotlin 把 setFocused 放在 select 之后，这里刻意提前，是 TS 侧的修正）
      deps.focus(hit ? focusableLeafOf(hit.chain) : null);
      const takeOver = deps.hasActiveEditor();
      if (takeOver) deps.onEditorFocus();
      deps.setPressed(leaf);

      const count = recordClick(leaf, input.x, input.y, input.time);
      wordDrag = null;

      if (count >= 3) {
        // 三击选段：一次性物化整个逻辑段落（'\n' 分隔），不开拖拽会话
        const sel = selectableLeaf(hit);
        if (sel) {
          const off = sel.positionForPoint(input.x, input.y);
          // 分段能力是能力对象自己的消息（不具备时兜底返回 null）
          const para = sel.paragraphRangeAt(off);
          const range = para ?? [0, sel.textLength()];
          if (range[1] > range[0]) {
            deps.selectRange(sel, range[0], range[1]);
          }
        }
        // down 必须在选区物化**之后**派发：编辑器在 mouseDown 里读 rangeOf(self)，
        // 看到非塌缩选区就返回（不抢光标），三击选段才不会被随后的 down 抹掉。
        fire('down', input.x, input.y, input.button);
        return takeOver;
      }

      if (count == 2) {
        // 双击选词：物化整词；词拖扩展由 move 驱动，松手即结束
        const sel = selectableLeaf(hit);
        if (sel) {
          const off = sel.positionForPoint(input.x, input.y);
          const word = sel.wordRangeAt(off);
          if (word && word[1] > word[0]) {
            deps.selectRange(sel, word[0], word[1]);
            wordDrag = { sel, start: word[0], end: word[1] };
          } else {
            // 无分词能力时退化为选中整个节点文本
            deps.selectRange(sel, 0, sel.textLength());
          }
        }
        fire('down', input.x, input.y, input.button);
        return takeOver;
      }

      // 开启选择会话；Shift+按下复用上一会话的 press（锚点继承，焦点重新跟随移动）
      //
      // 顺序上必须**先建会话再派发 down**（对齐 Kotlin Renderer.mouseDown）：
      // 否则编辑器在 mouseDown 里经 rangeOf(self) 读到的是上一次定格的旧选区，
      // 于是"拖选过文本后再点新位置 → 光标不动、输入却仍作用在旧选区上"。
      const prev = deps.pointerSelect();
      deps.setPointerSelect(
        input.shift && prev
          ? { press: prev.press, release: null }
          : { press: hit, release: null }
      );
      fire('down', input.x, input.y, input.button);
      return takeOver;
    },

    move(input) {
      lastDevice = input.device;
      lastPointerId = input.pointerId;
      const hit = hitAt(input.x, input.y, input.time);
      // 跨节点拖拽选择靠 moveHitTest 定位指针下的目标文本节点
      deps.setMoveHitTest(hit);
      // 双击后的词级拖拽扩展：以锚词为基准按词粒度扩展（仅同节点内生效）
      const drag = wordDrag;
      if (
        drag &&
        hit &&
        hit.chain.some(it => deps.selectableOf(it.node) === drag.sel)
      ) {
        const off = drag.sel.positionForPoint(input.x, input.y);
        const range = expandWordSelection(drag.start, drag.end, off, o =>
          drag.sel.wordRangeAt(o)
        );
        if (range[1] > range[0]) {
          deps.selectRange(drag.sel, range[0], range[1]);
        }
      }
      // 光标随命中链派生（编辑器 → text，可聚焦 → pointer）
      deps.cursor(cursorOfPath(hit ? hit.chain : null));
      fire('move', input.x, input.y, 0);
    },

    up(input) {
      lastDevice = input.device;
      lastPointerId = input.pointerId;
      heldButtons = heldButtons & ~pointerButtonMask(input.button);
      const hit = hitAt(input.x, input.y, input.time);
      const s = deps.pointerSelect();
      // 松手落空（画布空白）时用最后一次有效 hover / 按下点兜底：
      // release 留 null 会被派生链当作"仍在按住中"，导致松手后不按键移动仍改选区
      const release = hit ?? deps.moveHitTest() ?? s?.press ?? null;
      deps.setMoveHitTest(hit);
      deps.setPressed(null);
      wordDrag = null;
      // 松手定格：填入 release 后 hover 不再影响选区（纯数据变化，无命令）
      if (s) deps.setPointerSelect({ press: s.press, release });
      fire('up', input.x, input.y, input.button);
    },

    leave() {
      // 按住拖出画布：把当前进度定格（选区保持连续），再清理 hover 位置
      const s = deps.pointerSelect();
      if (s && s.release == null) {
        deps.setPointerSelect({
          press: s.press,
          // 从未有过有效 hover 时退化为按下点，避免 release 长期为 null 造成"按住中"假象
          release: deps.moveHitTest() ?? s.press,
        });
      }
      wordDrag = null;
      // 按住状态无法再收到配对的 up（窗口外松手），一并复位防残留
      heldButtons = 0;
      deps.setPressed(null);
      deps.setMoveHitTest(null);
      deps.cursor(CursorType2.DEFAULT);
    },

    wheel(x, y, deltaX, deltaY, device) {
      lastDevice = device ?? lastDevice;
      // 滚轮不改 hover 快照：它不改变"指针在哪"，只借命中链找接收者。
      // 返回 true = 某节点 stopPropagation（宿主就不该再让页面滚动）。
      return deps.dispatch(initOf('wheel', x, y, 0, deltaX, deltaY));
    },

    cancel(x, y, device, time) {
      lastDevice = device ?? lastDevice;
      const hit = hitAt(x, y, time ?? Date.now());
      deps.setPressed(null);
      deps.setPointerSelect(null);
      deps.setMoveHitTest(hit);
      wordDrag = null;
      heldButtons = 0;
      fire('cancel', x, y, 0);
    },

    click(x, y) {
      fire('click', x, y, 0);
    },
    doubleClick(x, y) {
      fire('dblclick', x, y, 0);
    },
  };
}
