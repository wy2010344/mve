import {
  hookCurrentStateHolder,
  renderRoot,
  StateHolderWithNode,
  createContext,
  type Context,
} from 'mve-core';
import {
  collectSignal,
  createSignal,
  emptyArray,
  EmptyFun,
  emptyFun,
  run,
} from 'wy-helper';
import { debounceRequestBatchAnimationFrame } from 'wy-dom-helper';
import {
  applyFocusDefaults,
  commonNode,
  createMouseEvent2,
  CursorType2,
  Fc,
  hitest,
  Node2,
  Node2Arg,
  MouseEvent2,
  NodeWithPosition2,
  nodeConfig,
  buildChildren,
} from './Node';
import {
  asSelectable2,
  expandWordSelection,
  HitestResult2,
  PointerSelect2,
  Selectable2,
  SelectionManager2,
  selectionManagerContext,
} from './SelectionManager';
import {
  activeEditorSignal,
  clearFocus,
  focusedSignal,
  isEditorHandle,
  KeyCode2,
  KeyEvent2,
  requestFocus,
} from './Focus';
import { clipboardSetText } from './Clipboard';
import { syncCanvasSize } from '../canvasRender';

export interface RendererArgs extends Omit<
  Node2Arg,
  'x' | 'y' | 'width' | 'height'
> {
  canvas: HTMLCanvasElement;
}

/**
 * 全局鼠标监听：坐标相对 canvas，不依赖命中测试。
 * 供拖拽场景使用——指针移出节点后仍要持续收到 move/up。
 */
export interface GlobalMouse2 {
  /** 全局按下：坐标相对 canvas，不依赖命中测试（拖拽起手后接管会话） */
  registerMouseDown(callback: (x: number, y: number) => void): EmptyFun;
  registerMouseMove(callback: (x: number, y: number) => void): EmptyFun;
  registerMouseUp(callback: EmptyFun): EmptyFun;
  /** 全局滚轮：坐标相对 canvas，不依赖命中测试（滚动容器按 absoluteInInner 自行判定） */
  registerMouseWheel(
    callback: (x: number, y: number, deltaX: number, deltaY: number) => void
  ): EmptyFun;
}

export const globalMouse2Context = createContext<GlobalMouse2 | null>(null);

/**
 * 通用拖拽助手（对标旧版 canvasRender 的 helper/drag）：
 * 按下后接管全局 move，松手时以最后坐标再回调一次并自动摘除注册，
 * 避免每次拖拽在注册表里残留闭包。返回一个提前终止拖拽的函数。
 */
export function dragMouse(
  ctx: { consume: <T>(context: Context<T>) => T },
  change: (x: number, y: number) => void
): EmptyFun {
  const g = ctx.consume(globalMouse2Context);
  if (!g) return emptyFun;
  let lastX = NaN;
  let lastY = NaN;
  const offMove = g.registerMouseMove((x, y) => {
    lastX = x;
    lastY = y;
    change(x, y);
  });
  const offUp = g.registerMouseUp(() => {
    offMove();
    offUp();
    if (!Number.isNaN(lastX)) change(lastX, lastY);
  });
  return () => {
    offMove();
    offUp();
  };
}

type MouseType2 = 'click' | 'down' | 'up' | 'move' | 'contextmenu' | 'dblclick';

/** 连击判定：同一叶子节点、400ms 内、位移 < 5px 则计数递增，否则重置（对标 Kotlin ClickTracker） */
function createClickCounter() {
  let last: {
    node: Node2 | null;
    x: number;
    y: number;
    time: number;
    count: number;
  } | null = null;
  return function record(leaf: Node2 | null, x: number, y: number): number {
    const now = Date.now();
    const prev = last;
    const count =
      prev &&
      leaf !== null &&
      prev.node === leaf &&
      Math.abs(x - prev.x) < 5 &&
      Math.abs(y - prev.y) < 5 &&
      now - prev.time < 400
        ? prev.count + 1
        : 1;
    last = { node: leaf, x, y, time: now, count };
    return count;
  };
}

export function renderCanvas({
  canvas,
  // ctx,
  children = emptyArray,
  draw = emptyFun,
  padding,
  paddingInline,
  paddingBlock,
  ...rest
}: RendererArgs) {
  const destroyList: EmptyFun[] = [];
  const { width, height, destroy } = syncCanvasSize(canvas);
  destroyList.push(destroy);
  const canvasContextValue = canvas.getContext('2d');
  if (!canvasContextValue) {
    throw new Error('当前浏览器不支持 Canvas 2D');
  }
  const canvasContext = canvasContextValue;
  const node = {
    ...rest,
    width,
    height,
  } as Node2;
  // 根节点是手工构造的，同样要补焦点默认实现（读取式 focusable/focusOrder/focusTrap）
  applyFocusDefaults(node);

  // 全局鼠标注册表，经 context 提供给节点树
  const downCallbacks = new Set<(x: number, y: number) => void>();
  const moveCallbacks = new Set<(x: number, y: number) => void>();
  const upCallbacks = new Set<EmptyFun>();
  const wheelCallbacks = new Set<
    (x: number, y: number, deltaX: number, deltaY: number) => void
  >();
  const globalMouse2: GlobalMouse2 = {
    registerMouseDown(callback) {
      downCallbacks.add(callback);
      return () => {
        downCallbacks.delete(callback);
      };
    },
    registerMouseMove(callback) {
      moveCallbacks.add(callback);
      return () => {
        moveCallbacks.delete(callback);
      };
    },
    registerMouseUp(callback) {
      upCallbacks.add(callback);
      return () => {
        upCallbacks.delete(callback);
      };
    },
    registerMouseWheel(callback) {
      wheelCallbacks.add(callback);
      return () => {
        wheelCallbacks.delete(callback);
      };
    },
  };
  destroyList.push(() => {
    downCallbacks.clear();
    moveCallbacks.clear();
    upCallbacks.clear();
    wheelCallbacks.clear();
  });

  // ---------- 指针选择会话（SelectionManager 的派生源） ----------
  // 只记录"指针落在哪"的原始事实，选区由 SelectionManager 从信号纯派生
  const pointerSelectSignal = createSignal<PointerSelect2 | null>(null);
  const moveHitTestSignal = createSignal<HitestResult2 | null>(null);
  const selectionManager = new SelectionManager2({
    pointerSelect: pointerSelectSignal.get,
    moveHitTest: moveHitTestSignal.get,
    // 编辑器光标（最高优先级）：活跃编辑器自己报的锚点/焦点对
    activeEditorSelPair: () =>
      activeEditorSignal.get()?.cursorSelPair() ?? null,
    rootNode: () => node,
    clearPointerSelect: () => pointerSelectSignal.set(null),
  });

  // ---------- 焦点子系统（对标 Kotlin register.focused / moveFocus） ----------

  /** 文档序收集全部可聚焦节点（跳过隐藏 / 不绘制的子树） */
  function focusableList(): Node2[] {
    const list: Node2[] = [];
    const walk = (n: Node2) => {
      if (n.hide?.()) return;
      if (n.focusable()) list.push(n);
      for (const c of n.children?.() ?? []) walk(c);
    };
    walk(node);
    return list;
  }

  /** 最近的外层焦点圈禁容器（自身算起；无则 null） */
  function closestTrap(from: Node2): Node2 | null {
    let cur: Node2 | null = from;
    while (cur) {
      if (cur.focusTrap()) return cur;
      cur = (cur.parent ?? null) as Node2 | null;
    }
    return null;
  }

  function isDescendantOf(n: Node2, ancestor: Node2): boolean {
    let cur: Node2 | null = (n.parent ?? null) as Node2 | null;
    while (cur) {
      if (cur === ancestor) return true;
      cur = (cur.parent ?? null) as Node2 | null;
    }
    return false;
  }

  /**
   * Tab / Shift+Tab 焦点遍历（对标 Kotlin moveFocus）：
   * 焦点在 focusTrap 子树内时只在圈内循环，否则全局循环。
   */
  function moveFocus(forward: boolean): boolean {
    const all = focusableList();
    if (all.length === 0) return false;
    let scope = all;
    const cur = focusedSignal.get();
    const trap = cur ? closestTrap(cur) : null;
    if (trap) {
      const inTrap = all.filter(n => n === trap || isDescendantOf(n, trap));
      if (inTrap.length) scope = inTrap;
    }
    // focusOrder 显式排序优先（未指定者保持文档序）；读取式，每项只求值一次
    const ordered = scope.map((n, i) => ({ n, i, order: n.focusOrder() }));
    if (ordered.some(it => it.order != null)) {
      scope = ordered
        .sort((a, b) => {
          const ao = a.order ?? Number.MAX_SAFE_INTEGER;
          const bo = b.order ?? Number.MAX_SAFE_INTEGER;
          return ao === bo ? a.i - b.i : ao - bo;
        })
        .map(it => it.n);
    }
    const idx = cur ? scope.indexOf(cur) : -1;
    const next =
      idx < 0
        ? forward
          ? scope[0]
          : scope[scope.length - 1]
        : scope[(idx + (forward ? 1 : -1) + scope.length) % scope.length];
    if (!next) return false;
    requestFocus(next);
    syncImeFocus();
    return true;
  }

  /** 命中链中最深的可聚焦节点（叶子优先，与 Kotlin focusable 查找一致） */
  function focusableLeaf(hit: HitestResult2 | null): Node2 | null {
    if (!hit) return null;
    for (let i = hit.chain.length - 1; i >= 0; i--) {
      const n = hit.chain[i].node as Node2;
      if (n.focusable() && !n.hide?.()) return n;
    }
    return null;
  }

  /** 焦点转移：旧编辑器塌缩本地选区，避免"点了别处选区还留着" */
  function assignFocus(target: Node2 | null) {
    const prevEditor = activeEditorSignal.get();
    if (target) {
      if (focusedSignal.get() === target) return;
      if (prevEditor && prevEditor !== (target as unknown)) {
        prevEditor.collapseExternalSelection();
      }
      requestFocus(target);
    } else {
      prevEditor?.collapseExternalSelection();
      clearFocus();
    }
    syncImeFocus();
  }

  /** 命中链快照：chain 为 root→leaf，x/y 为全局（canvas）坐标 */
  function hitestResult2(x: number, y: number): HitestResult2 | null {
    const head = hitest(node, x, y);
    if (!head) return null;
    const chain: NodeWithPosition2[] = [];
    let cur: NodeWithPosition2 | null = head;
    while (cur) {
      chain.push(cur);
      cur = cur.next;
    }
    return { chain, x, y, time: Date.now() };
  }

  /** 命中链中最深的、在册的可选文本节点 */
  function selectableLeaf(hit: HitestResult2 | null): Selectable2 | null {
    if (!hit) return null;
    for (let i = hit.chain.length - 1; i >= 0; i--) {
      const sel = asSelectable2(hit.chain[i].node);
      if (sel && selectionManager.isSelectable(sel)) return sel;
    }
    return null;
  }

  const state = renderRoot(node, nodeConfig, function () {
    this.provide(globalMouse2Context, globalMouse2);
    this.provide(selectionManagerContext, selectionManager);
    buildChildren(this, children);
  });
  node.children = state.target;
  commonNode({
    node,
    draw,
    padding,
    paddingInline,
    paddingBlock,
  });
  const signal = collectSignal(() => {
    debounceRequestBatchAnimationFrame(redraw);
  });
  destroyList.push(signal.destroy);

  function redraw() {
    try {
      signal.collect(() => {
        canvasContext.clearRect(0, 0, width(), height());
        node.draw(canvasContext);
      });
      // 光标可能已移动：让离屏输入框（输入法候选框）跟随
      positionImeTextarea();
    } catch (error) {
      console.error('canvasRender2 绘制失败', error);
    }
  }

  /**
   * 鼠标派发：命中链上先捕获（根 → 叶）再冒泡（叶 → 根），
   * 任一阶段 stopPropagation 即整体中断（对标旧版 canvasRender 的 mouseEventOf）。
   * 全局监听不受命中限制。
   */
  function dispatchMouse(type: MouseType2, x: number, y: number) {
    const chain = hitest(node, x, y);
    if (chain) {
      const path: NodeWithPosition2[] = [];
      let current: NodeWithPosition2 | null = chain;
      while (current) {
        path.push(current);
        current = current.next;
      }
      const send = (it: NodeWithPosition2, capture: boolean) => {
        const target = it.node as Node2 & {
          mouseClick?: (event: MouseEvent2) => void;
          mouseDown?: (event: MouseEvent2) => void;
          mouseUp?: (event: MouseEvent2) => void;
          mouseMove?: (event: MouseEvent2) => void;
          mouseContextMenu?: (event: MouseEvent2) => void;
          mouseDoubleClick?: (event: MouseEvent2) => void;
          mouseClickCapture?: (event: MouseEvent2) => void;
          mouseDownCapture?: (event: MouseEvent2) => void;
          mouseUpCapture?: (event: MouseEvent2) => void;
          mouseMoveCapture?: (event: MouseEvent2) => void;
        };
        const event = createMouseEvent2(it.x, it.y, chain.x, chain.y);
        if (type == 'click') {
          if (capture) target.mouseClickCapture?.(event);
          else target.mouseClick?.(event);
        } else if (type == 'down') {
          if (capture) target.mouseDownCapture?.(event);
          else target.mouseDown?.(event);
        } else if (type == 'up') {
          if (capture) target.mouseUpCapture?.(event);
          else target.mouseUp?.(event);
        } else if (type == 'contextmenu') {
          if (!capture) target.mouseContextMenu?.(event);
        } else if (type == 'dblclick') {
          if (!capture) target.mouseDoubleClick?.(event);
        } else {
          if (capture) target.mouseMoveCapture?.(event);
          else target.mouseMove?.(event);
        }
        return event.stoppedProgression;
      };
      // 捕获阶段：根 → 叶
      for (let index = 0; index < path.length; index++) {
        if (send(path[index], true)) return;
      }
      // 冒泡阶段：叶 → 根
      for (let index = path.length - 1; index >= 0; index--) {
        if (send(path[index], false)) return;
      }
    }
    if (type == 'down') {
      downCallbacks.forEach(cb => cb(x, y));
    } else if (type == 'move') {
      moveCallbacks.forEach(cb => cb(x, y));
    } else if (type == 'up') {
      upCallbacks.forEach(run);
    }
  }

  /**
   * 光标派生（对标旧版 canvasRender cursorOf）：
   * 节点显式 cursor 优先；其次编辑器 → text，可聚焦 → pointer，否则 default。
   */
  function cursorOf(
    chain: readonly { readonly node: Node2 }[] | null
  ): CursorType2 {
    let pointer = false;
    if (chain) {
      // 叶子优先（chain[0] 为根，末位为命中最深节点）
      for (let i = chain.length - 1; i >= 0; i--) {
        const n = chain[i].node as Node2;
        const c = n.cursor?.();
        if (c) return c;
        if (isEditorHandle(n)) return CursorType2.TEXT;
        if (n.focusable()) pointer = true;
      }
    }
    return pointer ? CursorType2.POINTER : CursorType2.DEFAULT;
  }

  /** 把派生出的光标写回 canvas（旧版由宿主经 requestCursor 处理） */
  function applyCursor(type: CursorType2) {
    if (typeof canvas.style === 'object' && canvas.style) {
      canvas.style.cursor = type;
    }
  }

  // ---------- 指针事件 → 选择会话 ----------

  const recordClick = createClickCounter();
  /** 双击选词后的词级拖拽扩展会话（仅同节点内生效，松手即结束） */
  let wordDrag: { sel: Selectable2; start: number; end: number } | null = null;

  const onMouseDown = (event: globalThis.MouseEvent) => {
    const x = event.offsetX;
    const y = event.offsetY;
    // 先刷新 hover 命中（任何按键都更新，含非左键——与 Kotlin mouseDown 顺序一致）
    const hit = hitestResult2(x, y);
    moveHitTestSignal.set(hit);
    if (event.button != 0) {
      // 非左键不派发 Down：否则右键按下会顺带启动文本拖选、滑块拖动等
      // 左键专属行为，退化成"假左键"（对标 Kotlin PointerButton 语义）。
      // 右键的上下文菜单由原生 contextmenu 事件单独派发（见 onContextMenu）
      return;
    }
    // 焦点先于 down 派发：节点的 mouseDown 能读到 isFocused()，编辑器由此接管光标
    assignFocus(focusableLeaf(hit));
    // 焦点落到编辑器后由离屏 textarea 接管真实 DOM 焦点（接输入法）。
    // canvas 有 tabIndex，mousedown 的默认动作会把焦点抢回 canvas 导致 IME 收不到组合串，
    // 因此这里阻止默认行为（旧版 canvasRender 的 canvas 无 tabIndex，不存在该问题）。
    if (activeEditorSignal.get()) {
      event.preventDefault();
      syncImeFocus();
    }
    dispatchMouse('down', x, y);
    const leaf =
      hit && hit.chain.length ? hit.chain[hit.chain.length - 1].node : null;
    const count = recordClick(leaf, x, y);
    wordDrag = null;

    if (count >= 3) {
      // 三击选段：一次性物化整个逻辑段落（'\n' 分隔），不开拖拽会话
      const sel = selectableLeaf(hit);
      if (sel) {
        const off = sel.positionForPoint(x, y);
        const para = sel.paragraphRangeAt ? sel.paragraphRangeAt(off) : null;
        const range = para ?? [0, sel.textLength()];
        if (range[1] > range[0]) {
          selectionManager.select(sel, range[0], sel, range[1]);
        }
      }
      return;
    }
    if (count == 2) {
      // 双击选词：物化整词；词拖扩展由 mouseMove 驱动，松手即结束
      const sel = selectableLeaf(hit);
      if (sel) {
        const off = sel.positionForPoint(x, y);
        const word = sel.wordRangeAt ? sel.wordRangeAt(off) : null;
        if (word && word[1] > word[0]) {
          selectionManager.select(sel, word[0], sel, word[1]);
          wordDrag = { sel, start: word[0], end: word[1] };
        } else {
          // 无分词能力时退化为选中整个节点文本
          selectionManager.select(sel, 0, sel, sel.textLength());
        }
      }
      return;
    }

    // 开启选择会话；Shift+按下复用上一会话的 press（锚点继承，焦点重新跟随移动）
    const prev = pointerSelectSignal.get();
    pointerSelectSignal.set(
      event.shiftKey && prev
        ? { press: prev.press, release: null }
        : { press: hit, release: null }
    );
  };

  const onMouseMove = (event: globalThis.MouseEvent) => {
    const x = event.offsetX;
    const y = event.offsetY;
    const hit = hitestResult2(x, y);
    // 跨节点拖拽选择靠 moveHitTest 定位指针下的目标文本节点
    moveHitTestSignal.set(hit);
    // 双击后的词级拖拽扩展：以锚词为基准按词粒度扩展（仅同节点内生效）
    const drag = wordDrag;
    if (
      drag &&
      hit &&
      hit.chain.some(it => asSelectable2(it.node) === drag.sel)
    ) {
      const off = drag.sel.positionForPoint(x, y);
      const range = expandWordSelection(drag.start, drag.end, off, o =>
        drag.sel.wordRangeAt ? drag.sel.wordRangeAt(o) : null
      );
      if (range[1] > range[0]) {
        selectionManager.select(drag.sel, range[0], drag.sel, range[1]);
      }
    }
    // 光标随命中链派生（编辑器 → text，可聚焦 → pointer）
    applyCursor(cursorOf(hit ? hit.chain : null));
    dispatchMouse('move', x, y);
  };

  const onMouseUp = (event: globalThis.MouseEvent) => {
    const x = event.offsetX;
    const y = event.offsetY;
    const hit = hitestResult2(x, y);
    moveHitTestSignal.set(hit);
    wordDrag = null;
    // 松手定格：填入 release 后 hover 不再影响选区（纯数据变化，无命令）
    const s = pointerSelectSignal.get();
    if (s) {
      pointerSelectSignal.set({ press: s.press, release: hit });
    }
    dispatchMouse('up', x, y);
  };

  const onMouseLeave = () => {
    // 按住拖出 canvas：把当前进度定格（选区保持连续），再清理 hover 位置
    const s = pointerSelectSignal.get();
    if (s && s.release == null) {
      pointerSelectSignal.set({
        press: s.press,
        release: moveHitTestSignal.get(),
      });
    }
    wordDrag = null;
    moveHitTestSignal.set(null);
    applyCursor(CursorType2.DEFAULT);
  };

  const onWheel = (event: WheelEvent) => {
    // 滚轮广播给全局注册表（不 preventDefault，与旧版一致：页面滚动由外层决定）
    wheelCallbacks.forEach(cb =>
      cb(event.offsetX, event.offsetY, event.deltaX, event.deltaY)
    );
  };

  const onClick = (event: globalThis.MouseEvent) => {
    dispatchMouse('click', event.offsetX, event.offsetY);
  };
  const onContextMenu = (event: globalThis.MouseEvent) => {
    // 消费浏览器默认菜单，右键改由节点经 mouseContextMenu 响应
    // （对标 Kotlin PointerType.ContextMenu：右键按下时派发，不派发 Down）
    event.preventDefault();
    dispatchMouse('contextmenu', event.offsetX, event.offsetY);
  };
  const onDoubleClick = (event: globalThis.MouseEvent) => {
    // 双击不吞单击（浏览器同样先派发 click 再派发 dblclick），
    // 只关心单击的节点无需特殊处理（对标 Kotlin onPointerDoubleClick）
    dispatchMouse('dblclick', event.offsetX, event.offsetY);
  };
  // ---------- 键盘 / IME（对标 Kotlin handleKey + ComposingTextHandler） ----------
  // canvas 自身无法收键盘与输入法，借一个离屏 textarea 承接：键盘事件统一转成
  // KeyEvent2 路由给焦点节点，输入法组合串经 onComposing 上报给活跃编辑器。
  const imeListeners: Array<() => void> = [];
  let imeTextarea: HTMLTextAreaElement | null = null;
  /** 输入法组合进行中：期间键盘归输入法独占，不再路由给节点 */
  let imeComposing = false;

  function ensureImeTextarea(): HTMLTextAreaElement | null {
    if (imeTextarea) return imeTextarea;
    if (typeof document === 'undefined') return null;
    const ta = document.createElement('textarea');
    // node / SSR 垫片里 createElement 可能返回不完整对象：拿不到 setAttribute 就放弃 IME
    if (!ta || typeof ta.setAttribute !== 'function') return null;
    ta.setAttribute('autocapitalize', 'off');
    ta.setAttribute('autocomplete', 'off');
    ta.setAttribute('autocorrect', 'off');
    ta.setAttribute('spellcheck', 'false');
    // 与旧版 canvasRender 一致：透明、不可交互、但可被聚焦（接输入法组合串）
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    ta.style.pointerEvents = 'none';
    ta.style.resize = 'none';
    ta.style.border = 'none';
    ta.style.outline = 'none';
    ta.style.background = 'transparent';
    ta.style.overflow = 'hidden';
    ta.style.whiteSpace = 'pre';
    ta.style.fontFamily = 'sans-serif';
    ta.style.width = '1px';
    ta.style.height = '1px';
    ta.style.padding = '0';
    document.body?.appendChild(ta);
    imeTextarea = ta;

    const onImeKeyDown = (event: KeyboardEvent) => onKeyDown(event);
    // 组合开始：缓冲归零，避免上一轮残留串混入
    const onImeCompositionStart = () => {
      imeComposing = true;
      ta.value = '';
    };
    const onImeCompositionUpdate = (event: CompositionEvent) => {
      const editor = activeEditorSignal.get();
      if (!editor) return;
      // textarea.value 是当前预编辑串（含候选未上屏部分），event.data 兜底
      const t = ta.value || event.data || '';
      editor.onComposing(t, ta.selectionStart ?? 0);
    };
    const onImeCompositionEnd = (event: CompositionEvent) => {
      imeComposing = false;
      const editor = activeEditorSignal.get();
      const finalText = event.data ?? ta.value ?? '';
      if (editor) editor.commitComposingText(finalText);
      ta.value = '';
    };
    const onImeInput = (event: Event) => {
      // 非组合输入由 keydown 路由（handleKey 已 preventDefault），此处只清缓冲
      if ((event as InputEvent).isComposing) return;
      ta.value = '';
    };
    const onImePaste = (event: ClipboardEvent) => {
      const editor = activeEditorSignal.get();
      if (!editor) return;
      event.preventDefault();
      const data = event.clipboardData?.getData('text') ?? '';
      if (!data) return;
      clipboardSetText(data);
      editor.paste();
    };
    const onImeCopyCut = (event: ClipboardEvent) => {
      const editor = activeEditorSignal.get();
      if (!editor) return;
      event.preventDefault();
      if (event.type === 'cut') editor.cut();
      else editor.copy();
    };
    ta.addEventListener('keydown', onImeKeyDown);
    ta.addEventListener('compositionstart', onImeCompositionStart);
    ta.addEventListener('compositionupdate', onImeCompositionUpdate);
    ta.addEventListener('compositionend', onImeCompositionEnd);
    ta.addEventListener('input', onImeInput);
    ta.addEventListener('paste', onImePaste);
    ta.addEventListener('copy', onImeCopyCut);
    ta.addEventListener('cut', onImeCopyCut);
    imeListeners.push(() => {
      ta.removeEventListener('keydown', onImeKeyDown);
      ta.removeEventListener('compositionstart', onImeCompositionStart);
      ta.removeEventListener('compositionupdate', onImeCompositionUpdate);
      ta.removeEventListener('compositionend', onImeCompositionEnd);
      ta.removeEventListener('input', onImeInput);
      ta.removeEventListener('paste', onImePaste);
      ta.removeEventListener('copy', onImeCopyCut);
      ta.removeEventListener('cut', onImeCopyCut);
      ta.remove();
      imeTextarea = null;
    });
    return ta;
  }

  /**
   * 把 textarea 挪到光标处：输入法候选框才会跟随光标
   * （对齐旧版 EngineGlobal.requestInputOverlay(x, y, w, h, fontSize)）。
   * 每帧绘制后调用，光标移动 / 文本变化都会自动跟随。
   */
  function positionImeTextarea() {
    const ta = imeTextarea;
    if (!ta) return;
    const editor = activeEditorSignal.get();
    if (!editor) return;
    const o = editor.inputOverlay?.() ?? null;
    if (!o) return;
    const rect =
      typeof canvas.getBoundingClientRect === 'function'
        ? canvas.getBoundingClientRect()
        : null;
    if (!rect) return;
    ta.style.left = `${rect.left + o.x}px`;
    ta.style.top = `${rect.top + o.y}px`;
    ta.style.width = `${Math.max(1, o.w)}px`;
    ta.style.height = `${Math.max(1, o.h)}px`;
    ta.style.fontSize = `${o.fontSize}px`;
  }

  /** 焦点转移后同步真实 DOM 焦点：有编辑器则让 textarea 接管（接 IME），否则回到 canvas */
  function syncImeFocus() {
    const editor = activeEditorSignal.get();
    if (editor) {
      const ta = ensureImeTextarea();
      if (!ta) return;
      positionImeTextarea();
      if (typeof document !== 'undefined' && document.activeElement !== ta) {
        ta.focus({ preventScroll: true });
      }
    } else if (typeof document !== 'undefined') {
      if (document.activeElement === imeTextarea) {
        imeTextarea?.blur();
      }
      // 焦点还在画布内但不再是编辑器：把真实焦点交回 canvas，
      // 否则 canvas 收不到 keydown（Tab 到按钮后键盘就失灵了）
      if (
        focusedSignal.get() &&
        document.activeElement !== canvas &&
        typeof (canvas as { focus?: unknown }).focus === 'function'
      ) {
        canvas.focus({ preventScroll: true });
      }
    }
  }

  const onKeyDown = (event: KeyboardEvent) => {
    // 输入法组合期间键盘归输入法独占（旧版 canvasRender 同口径：composing 时 keydown 直接返回）
    if (imeComposing) return;
    const editor = activeEditorSignal.get();
    const keyEvent: KeyEvent2 = {
      key: event.key,
      code: event.code,
      ctrl: event.ctrlKey,
      shift: event.shiftKey,
      alt: event.altKey,
      meta: event.metaKey,
    };
    const accel = event.ctrlKey || event.metaKey;
    if (accel && !event.altKey) {
      const k = event.key.toLowerCase();
      if (k === 'a') {
        event.preventDefault();
        if (editor) editor.selectAll();
        else selectionManager.selectAll();
        return;
      }
      if (k === 'c' || k === 'x') {
        event.preventDefault();
        if (editor) {
          if (k === 'c') editor.copy();
          else editor.cut();
        } else {
          const t = selectionManager.selectedText;
          if (t) clipboardSetText(t);
        }
        return;
      }
      if (k === 'v') {
        // 粘贴内容由 paste 事件异步提供，这里只吞默认行为
        event.preventDefault();
        return;
      }
    }
    if (event.code === KeyCode2.Tab) {
      if (moveFocus(!event.shiftKey)) {
        event.preventDefault();
        return;
      }
    }
    if (editor && editor.handleKey(keyEvent)) {
      event.preventDefault();
      return;
    }
    const focused = focusedSignal.get();
    if (
      focused &&
      (focused as unknown) !== editor &&
      focused.handleKey(keyEvent)
    ) {
      event.preventDefault();
    }
  };

  const onWindowMouseDown = (event: globalThis.MouseEvent) => {
    // 点空白（非 canvas / 非 IME textarea）：放弃画布内焦点
    const t = event.target;
    if (t === canvas || t === imeTextarea) return;
    if (focusedSignal.get()) assignFocus(null);
  };

  // canvas 可聚焦，无编辑器时键盘事件由它承接
  canvas.tabIndex = 0;
  // 兜底：若浏览器把真实焦点设回 canvas（如 click 默认行为）而当前活跃的是编辑器，
  // 立刻还给 textarea，否则输入法收不到组合串。
  const onCanvasFocus = () => {
    if (activeEditorSignal.get()) syncImeFocus();
  };
  canvas.addEventListener('focus', onCanvasFocus);
  canvas.addEventListener('keydown', onKeyDown);
  canvas.addEventListener('click', onClick);
  canvas.addEventListener('contextmenu', onContextMenu);
  canvas.addEventListener('dblclick', onDoubleClick);
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('mouseleave', onMouseLeave);
  canvas.addEventListener('wheel', onWheel);
  // window 可能只是垫片（SSR / node 冒烟）：拿不到 addEventListener 就不挂
  const hasWindow =
    typeof window !== 'undefined' &&
    typeof window.addEventListener === 'function';
  if (hasWindow) {
    window.addEventListener('mousedown', onWindowMouseDown);
  }
  destroyList.push(() => {
    if (hasWindow) {
      window.removeEventListener('mousedown', onWindowMouseDown);
    }
    imeListeners.forEach(run);
    canvas.removeEventListener('keydown', onKeyDown);
    canvas.removeEventListener('focus', onCanvasFocus);
    canvas.removeEventListener('click', onClick);
    canvas.removeEventListener('contextmenu', onContextMenu);
    canvas.removeEventListener('dblclick', onDoubleClick);
    canvas.removeEventListener('mousedown', onMouseDown);
    canvas.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('mouseup', onMouseUp);
    canvas.removeEventListener('mouseleave', onMouseLeave);
    canvas.removeEventListener('wheel', onWheel);
  });

  redraw();
  return {
    node,
    selectionManager,
    destroy() {
      destroyList.forEach(run);
    },
  };
}
