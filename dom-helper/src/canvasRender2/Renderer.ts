import { renderRoot } from 'mve-core';
import {
  collectSignal,
  createSignal,
  emptyArray,
  emptyFun,
  run,
  storeRef,
} from 'wy-helper';
import type { EmptyFun, GetValue } from 'wy-helper';
import { debounceRequestBatchAnimationFrame } from 'wy-dom-helper';
import {
  alaways0,
  assembleNode,
  buildChildren,
  CursorType2,
  dispatchMousePath,
  emptyChildren,
  hitPath,
  nextFocusNode,
  Node2,
  nodeConfig,
  POINTER_BUTTON_LEFT,
  POINTER_BUTTON_MIDDLE,
  POINTER_BUTTON_RIGHT,
} from './Node';
import {
  asSelectable2,
  createSelectionManager,
  HitestResult2,
  PointerSelect2,
  selectionManagerContext,
} from './SelectionManager';
import { KeyEvent2 } from './tree/protocol';
import {
  applyModifiers,
  clearFocus,
  clearModifiers,
  focusedSignal,
  getActiveEditor,
  notifyKeyPress,
  pressedSignal,
  requestFocus,
} from './Focus';
import { clipboardSetText } from './Clipboard';
import { syncCanvasSize } from '../canvasRender';
import { createImeInput } from './ImeInput';
import type { Node2Arg } from './NodeArg';
import { createGlobalMouse2, globalMouse2Context } from './tree/globalMouse';
import {
  createPopRegistry,
  popLayer,
  popRegistryContext,
} from './Pop';
import type { PopRegistry } from './Pop';
import { toastContainer } from './helper/Toast';
import { createPointerRouter } from './tree/pointer';
import type { PointerInput2 } from './tree/interaction';
import { routeKeyEvent } from './tree/keyboard';
import type { KeyRouterDeps } from './tree/keyboard';

export { dragMouse } from './tree/globalMouse';
export type { GlobalMouse2 } from './tree/globalMouse';
export { globalMouse2Context };

export interface RendererArgs extends Omit<
  Partial<Node2Arg>,
  'x' | 'y' | 'width' | 'height'
> {
  canvas: HTMLCanvasElement;
}

/**
 * DOM 按钮编号 → 引擎按钮编号。
 *
 * DOM 的 `MouseEvent.button` 是 0=左 / 1=中 / 2=右（3、4 是后退 / 前进）；
 * 引擎层沿用 Kotlin `PointerButton`：1=左 / 2=中 / 3=右，**0 = 无按键**
 * （移动、滚轮、双击这类"不来自某个键"的事件用 0）。
 *
 * 规则层只认引擎编号，翻译只发生在宿主适配器这一处 —— 换宿主（Android / ooc）
 * 时各自翻译自己的编号，规则代码不用动。
 */
function engineButtonOf(domButton: number): number {
  switch (domButton) {
    case 0:
      return POINTER_BUTTON_LEFT;
    case 1:
      return POINTER_BUTTON_MIDDLE;
    case 2:
      return POINTER_BUTTON_RIGHT;
    default:
      // 后退 / 前进等无对应键位：当作"无按键"，规则层不会把它当主键
      return 0;
  }
}

/** DOM 鼠标事件 → 指针路由的纯数据输入（坐标相对 canvas） */
function pointerInputOf(event: globalThis.MouseEvent): PointerInput2 {
  return {
    x: event.offsetX,
    y: event.offsetY,
    button: engineButtonOf(event.button),
    shift: event.shiftKey,
    time: Date.now(),
    // canvasRender2 的 DOM 宿主只接鼠标；触摸 / 触控笔走 Pointer Events 时
    // 由宿主填 'touch' / 'pen'（规则层不区分设备，只透传）
    device: 'mouse',
    pointerId: 0,
  };
}

/** 修饰键是纯键盘状态：每个事件都上报权威快照（与鼠标事件解耦） */
function syncModifiers(event: KeyboardEvent | MouseEvent | WheelEvent) {
  applyModifiers(event.ctrlKey, event.shiftKey, event.altKey, event.metaKey);
}

/**
 * canvasRender2 的宿主绑定层。
 *
 * 这里只做三件事：
 * 1. **把 DOM 事件抽成纯数据**（`PointerInput2` / `KeyEvent2`）交给共用层；
 * 2. **实现共用层要的动作**（焦点信号、选择器、剪贴板、IME、光标）；
 * 3. **接线与销毁**（canvas 尺寸、事件监听、重绘调度）。
 *
 * 树算法与交互规则不在这里：命中/测量在 `tree/geometry`，鼠标捕获冒泡在
 * `tree/dispatch`，焦点遍历在 `tree/focusWalk`，指针状态机在 `tree/pointer`，
 * 键盘规则在 `tree/keyboard`，全局鼠标注册表在 `tree/globalMouse`。
 * 那些模块只发消息、只认纯数据，可以原样搬去 ooc / Rust。
 */
export function renderCanvas({
  canvas,
  children = emptyArray,
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

  // 根节点与工厂节点走同一套装配（assembleNode）：它没有父节点，所以位置固定 0、
  // 尺寸取画布同步出来的 getter；其余消息由参数对象 + 兜底对象回答。
  const childGetter = storeRef<GetValue<readonly Node2[]>>(emptyChildren);
  const node = assembleNode(
    undefined,
    { ...rest, x: alaways0, y: alaways0, width, height },
    childGetter
  );

  // 全局鼠标注册表（纯集合 + 广播，不含宿主 API）
  const globalMouse = createGlobalMouse2();
  destroyList.push(globalMouse.clear);

  // 浮层登记处（Pop / Toast 两份清单，是信号驱动的）
  const popRegistry: PopRegistry = createPopRegistry();
  destroyList.push(popRegistry.clear);

  // ---------- 选择会话的原始事实（选区由 SelectionManager 纯派生） ----------
  const pointerSelectSignal = createSignal<PointerSelect2 | null>(null);
  const moveHitTestSignal = createSignal<HitestResult2 | null>(null);
  const selectionManager = createSelectionManager({
    pointerSelect: pointerSelectSignal.get,
    moveHitTest: moveHitTestSignal.get,
    // 编辑器光标（最高优先级）：活跃编辑器自己报的锚点/焦点对
    activeEditorSelPair: () =>
      getActiveEditor()?.cursorSelPair() ?? null,
    // 程序化选区（双击/三击/全选）落到编辑器本地光标，否则会被塌缩光标压制
    activeEditor: getActiveEditor,
    rootNode: () => node,
    clearPointerSelect: () => pointerSelectSignal.set(null),
  });

  const state = renderRoot(node, nodeConfig, function () {
    this.provide(globalMouse2Context, globalMouse.api);
    this.provide(selectionManagerContext, selectionManager);
    this.provide(popRegistryContext, popRegistry);
    buildChildren(this, children);
    // 浮层两层放在业务 children 之后：绘制顺序即层叠顺序，
    // Pop（下拉 / 菜单）在下、Toast 永远在最上
    popLayer(popRegistry)(this);
    toastContainer(popRegistry)(this);
  });
  childGetter.set(state.target);

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
      ime.position();
    } catch (error) {
      console.error('canvasRender2 绘制失败', error);
    }
  }

  // ---------- 动作：焦点 ----------
  // 规则（圈定/排序）在 tree/focusWalk，这里只落焦点 + 同步真实 DOM 焦点
  function moveFocus(forward: boolean): boolean {
    const next = nextFocusNode(node, focusedSignal.get(), forward);
    if (!next) return false;
    requestFocus(next);
    ime.sync();
    return true;
  }

  /** 焦点转移：旧编辑器塌缩本地选区，避免"点了别处选区还留着" */
  function assignFocus(target: Node2 | null) {
    const prevEditor = getActiveEditor();
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
    ime.sync();
  }

  // ---------- 动作：光标 ----------
  function applyCursor(type: CursorType2) {
    if (typeof canvas.style === 'object' && canvas.style) {
      canvas.style.cursor = type;
    }
  }

  // ---------- 指针路由（规则在 tree/pointer，这里只给能力） ----------
  const router = createPointerRouter({
    hit: (x, y) => hitPath(node, x, y),
    selectableOf: asSelectable2,
    isSelectable: sel => selectionManager.isSelectable(sel),
    focus: assignFocus,
    hasActiveEditor: () => Boolean(getActiveEditor()),
    onEditorFocus: () => ime.sync(),
    dispatch(init) {
      // 命中链的捕获/冒泡顺序由 dispatchMousePath 负责（纯消息）；
      // 全局监听不受命中限制，按类型广播（拖拽会话靠它持续收到 move/up）
      const consumed = dispatchMousePath(
        hitPath(node, init.globalX, init.globalY),
        init
      );
      if (init.type == 'down') globalMouse.emitDown(init.globalX, init.globalY);
      else if (init.type == 'move') {
        globalMouse.emitMove(init.globalX, init.globalY);
      } else if (init.type == 'up' || init.type == 'cancel') {
        globalMouse.emitUp();
      }
      return consumed;
    },
    setPressed: target => pressedSignal.set(target),
    pointerSelect: pointerSelectSignal.get,
    setPointerSelect: pointerSelectSignal.set,
    moveHitTest: moveHitTestSignal.get,
    setMoveHitTest: moveHitTestSignal.set,
    selectRange: (sel, start, end) => {
      selectionManager.select(sel, start, sel, end);
    },
    cursor: applyCursor,
  });

  // ---------- 键盘 / IME ----------
  // 宿主绑定（离屏 textarea + 输入法事件 + 真实焦点归属）在 ImeInput.ts；
  // 规则（谁先拿按键、快捷键、Tab 门槛）在 tree/keyboard，这里只做动作。
  const ime = createImeInput({
    canvas,
    activeEditor: getActiveEditor,
    hasFocus: () => Boolean(focusedSignal.get()),
    handleKey: event => onKeyDown(event),
  });

  const keyDeps: KeyRouterDeps = {
    composing: () => ime.isComposing(),
    activeEditor: getActiveEditor,
    focused: focusedSignal.get,
    selectAll() {
      const editor = getActiveEditor();
      if (editor) editor.selectAll();
      else selectionManager.selectAll();
    },
    copy() {
      const editor = getActiveEditor();
      if (editor) editor.copy();
      else {
        const t = selectionManager.selectedText();
        if (t) clipboardSetText(t);
      }
    },
    cut() {
      const editor = getActiveEditor();
      if (editor) editor.cut();
      else {
        const t = selectionManager.selectedText();
        if (t) clipboardSetText(t);
      }
    },
    // 粘贴内容由 paste 事件异步提供，这里只吞默认行为
    pastePending: emptyFun,
    moveFocus: forward => moveFocus(forward),
    notifyUnhandled: event => notifyKeyPress(event),
  };

  const onKeyDown = (event: KeyboardEvent) => {
    syncModifiers(event);
    const keyEvent: KeyEvent2 = {
      key: event.key,
      code: event.code,
      ctrl: event.ctrlKey,
      shift: event.shiftKey,
      alt: event.altKey,
      meta: event.metaKey,
    };
    if (routeKeyEvent(keyDeps, keyEvent)) {
      event.preventDefault();
    }
  };

  // ---------- DOM 事件 → 纯数据 → 路由 ----------
  const onMouseDown = (event: globalThis.MouseEvent) => {
    syncModifiers(event);
    if (router.down(pointerInputOf(event))) {
      // 焦点落到编辑器后由离屏 textarea 接管真实 DOM 焦点（接输入法）。
      // canvas 有 tabIndex，mousedown 的默认动作会把焦点抢回 canvas 导致 IME
      // 收不到组合串，因此这里阻止默认行为。
      event.preventDefault();
    }
  };
  const onMouseMove = (event: globalThis.MouseEvent) => {
    syncModifiers(event);
    router.move(pointerInputOf(event));
  };
  const onMouseUp = (event: globalThis.MouseEvent) => {
    router.up(pointerInputOf(event));
  };
  const onMouseLeave = () => {
    router.leave();
  };
  /** 修饰键松开也要上报（否则 Shift 会一直"按住"） */
  const onKeyUp = (event: KeyboardEvent) => {
    syncModifiers(event);
  };
  /** 窗口失焦：修饰键与按压态一律清空，防止残留 */
  const onWindowBlur = () => {
    clearModifiers();
    pressedSignal.set(null);
  };
  const onWheel = (event: WheelEvent) => {
    syncModifiers(event);
    // 归一化滚轮增量：DOM `WheelEvent.deltaX/deltaY` 单位取决于 `deltaMode`
    // （0=像素，1=行，2=页）。Firefox 默认走行模式，不归一化会让滚动量相差十几倍。
    let dx = event.deltaX;
    let dy = event.deltaY;
    if (event.deltaMode === 1) {
      dx *= 16;
      dy *= 16;
    } else if (event.deltaMode === 2) {
      const h =
        (event.currentTarget as HTMLElement | null)?.clientHeight ?? 800;
      dx *= h;
      dy *= h;
    }
    // 滚轮沿命中链派发：节点自己决定滚多少、滚到底要不要交给外层。
    // 有节点 stopPropagation（= 已消费）才阻止页面滚动，否则让页面自己滚。
    if (router.wheel(event.offsetX, event.offsetY, dx, dy)) {
      event.preventDefault();
    }
  };
  const onClick = (event: globalThis.MouseEvent) => {
    router.click(event.offsetX, event.offsetY);
  };
  const onContextMenu = (event: globalThis.MouseEvent) => {
    // 只吞掉浏览器菜单。右键的 mouseContextMenu 已在 mousedown 时派发过
    // （与 Kotlin 一致：平台层不会二次上报 contextmenu）；这里若再派发一次，
    // 节点的上下文菜单处理器会被触发两遍。
    event.preventDefault();
  };
  const onDoubleClick = (event: globalThis.MouseEvent) => {
    // 双击不吞单击：同一次双击仍会先派发 click（与 Flutter/Compose 手势一致）
    router.doubleClick(event.offsetX, event.offsetY);
  };

  const onWindowMouseDown = (event: globalThis.MouseEvent) => {
    // 点空白（非 canvas / 非 IME textarea）：放弃画布内焦点
    const t = event.target;
    if (t === canvas || t === ime.textarea()) return;
    if (focusedSignal.get()) assignFocus(null);
  };

  // canvas 可聚焦，无编辑器时键盘事件由它承接
  canvas.tabIndex = 0;
  // 兜底：若浏览器把真实焦点设回 canvas（如 click 默认行为）而当前活跃的是编辑器，
  // 立刻还给 textarea，否则输入法收不到组合串。
  const onCanvasFocus = () => {
    if (getActiveEditor()) ime.sync();
  };
  canvas.addEventListener('focus', onCanvasFocus);
  canvas.addEventListener('keydown', onKeyDown);
  canvas.addEventListener('keyup', onKeyUp);
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
    window.addEventListener('blur', onWindowBlur);
  }
  destroyList.push(() => {
    if (hasWindow) {
      window.removeEventListener('mousedown', onWindowMouseDown);
      window.removeEventListener('blur', onWindowBlur);
    }
    ime.destroy();
    canvas.removeEventListener('keydown', onKeyDown);
    canvas.removeEventListener('keyup', onKeyUp);
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
    /** 浮层登记处：业务侧经它 appendPop / showToast */
    popRegistry,
    destroy() {
      destroyList.forEach(run);
    },
  };
}
