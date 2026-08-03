import { collectSignal, createSignal, emptyFun, EmptyFun } from 'wy-helper';
import { renderRoot, StateHolder } from 'mve-core';
import {
  Node,
  nodeConfig,
  hitest,
  NodeWithPosition,
  last,
} from './Node';
import { LayoutNode, LayoutNodeArg, outerSize } from './LayoutNode';
import {
  ComposingTextCallback,
  CursorType,
  EngineGlobal,
  KeyCode,
  KeyEvent,
  KeyPressCallback,
  MouseCallback,
  WheelCallback,
  engineGlobalContext,
} from './EngineGlobal';
import { MouseEvent } from './MouseEvent';
import { EditableTextNode } from './EditableTextNode';

function register<K>(map: Map<K, EmptyFun>, key: K): EmptyFun {
  const destroy: EmptyFun = () => map.delete(key);
  map.set(key, destroy);
  return destroy;
}

export interface RendererArgs<T = Renderer> extends LayoutNodeArg<T> {
  frameCallback(): void;
}

class Register {
  readonly pressed = createSignal(false);
  readonly moveHitest = createSignal<NodeWithPosition | null>(null);
  readonly focused = createSignal<Node | null>(null);

  private readonly moveList = new Map<MouseCallback, EmptyFun>();
  private readonly upList = new Map<MouseCallback, EmptyFun>();
  private readonly downList = new Map<MouseCallback, EmptyFun>();
  private readonly wheelList = new Map<WheelCallback, EmptyFun>();
  private readonly keyPressList = new Map<KeyPressCallback, EmptyFun>();
  private readonly composingList = new Map<ComposingTextCallback, EmptyFun>();

  private overlayShow:
    | ((x: number, y: number, w: number, h: number, fontSize: number) => void)
    | null = null;
  private overlayHide: (() => void) | null = null;
  private cursorHandler: ((type: CursorType) => void) | null = null;
  private lastCursor: CursorType | null = null;

  setOverlayHandler(
    show: (x: number, y: number, w: number, h: number, fontSize: number) => void,
    hide: () => void
  ) {
    this.overlayShow = show;
    this.overlayHide = hide;
  }

  setCursorHandler(handler: (type: CursorType) => void) {
    this.cursorHandler = handler;
  }

  requestCursor(type: CursorType) {
    if (this.lastCursor == type) return;
    this.lastCursor = type;
    this.cursorHandler?.(type);
  }

  provide(context: StateHolder<Node, readonly Node[]>) {
    context.provide(engineGlobalContext, this.createEngineGlobal());
  }

  private createEngineGlobal(): EngineGlobal {
    const that = this;
    return {
      registerMouseDown(callback) {
        return register(that.downList, callback);
      },
      registerMouseMove(callback) {
        return register(that.moveList, callback);
      },
      registerMouseUp(callback) {
        return register(that.upList, callback);
      },
      registerMouseWheel(callback) {
        return register(that.wheelList, callback);
      },
      registerKeyPress(callback) {
        return register(that.keyPressList, callback);
      },
      registerComposingText(callback) {
        return register(that.composingList, callback);
      },
      pressed() {
        return that.pressed.get();
      },
      moveHitest() {
        return that.moveHitest.get();
      },
      focused() {
        return that.focused.get();
      },
      setFocused(value: Node | null) {
        that.focused.set(value);
      },
      requestInputOverlay(x, y, w, h, fontSize) {
        that.overlayShow?.(x, y, w, h, fontSize);
      },
      hideInputOverlay() {
        that.overlayHide?.();
      },
      requestCursor(type) {
        that.requestCursor(type);
      },
    };
  }

  dispatchMouseUp(x: number, y: number) {
    for (const [cb, destroy] of this.upList) {
      cb({ x, y, destroy });
    }
  }
  dispatchMouseDown(x: number, y: number) {
    for (const [cb, destroy] of this.downList) {
      cb({ x, y, destroy });
    }
  }
  dispatchMouseMove(x: number, y: number) {
    for (const [cb, destroy] of this.moveList) {
      cb({ x, y, destroy });
    }
  }
  dispatchMouseWheel(x: number, y: number, deltaX: number, deltaY: number) {
    for (const [cb, destroy] of this.wheelList) {
      cb({ x, y, deltaX, deltaY, destroy });
    }
  }
  dispatchKeyPress(e: KeyEvent) {
    for (const [cb, destroy] of this.keyPressList) {
      cb(e);
    }
  }
  dispatchComposingText(text: string, cursorPosition: number) {
    for (const [cb, destroy] of this.composingList) {
      cb(text, cursorPosition);
    }
  }

  destroy() {
    this.moveList.clear();
    this.upList.clear();
    this.downList.clear();
    this.wheelList.clear();
    this.keyPressList.clear();
    this.composingList.clear();
  }
}

export class Renderer extends LayoutNode {
  private register: Register;
  private destroyState: () => void = emptyFun;
  constructor(args: RendererArgs, context?: StateHolder<Node, readonly Node[]>) {
    const register = new Register();
    if (context) {
      register.provide(context);
    }
    super(context, args as any);
    this.register = register;
    this.frameCallback = args.frameCallback;
    if (!context) {
      const that = this;
      const state = renderRoot(this, nodeConfig, function () {
        register.provide(this);
        that.argChildren.apply(this);
      });
      this.destroyState = state.destroy;
      this.children = state.target;
    }
  }

  frameCallback() {}

  scheduled = false;
  private readonly signal = collectSignal(() => {
    this.frameCallback();
  });

  setInputOverlayHandler(
    show: (x: number, y: number, w: number, h: number, fontSize: number) => void,
    hide: () => void
  ) {
    this.register.setOverlayHandler(show, hide);
  }

  setCursorHandler(handler: (type: CursorType) => void) {
    this.register.setCursorHandler(handler);
  }

  destroy(): void {
    this.register.destroy();
    this.destroyState();
  }

  render(canvas: CanvasRenderingContext2D): void {
    this.scheduled = true;
    try {
      this.signal.collect(() => {
        const w = outerSize.call(this, 'x');
        const h = outerSize.call(this, 'y');
        canvas.fillStyle = 'white';
        canvas.fillRect(0, 0, w, h);
        this.draw(canvas);
      });
    } catch (err) {
      console.error('渲染出错', err);
    }
    this.scheduled = false;
  }

  private setFocused(node: Node | null) {
    const old = this.register.focused.get();
    if (old === node) return;
    this.register.focused.set(node);
  }

  private focusableNodes(): Node[] {
    const result: Node[] = [];
    function collect(node: Node) {
      if (node.focusable() && !node.hide()) {
        result.push(node);
      }
      node.children().forEach(collect);
    }
    this.children().forEach(collect);
    if (result.some(it => it.focusOrder() != null)) {
      result.sort((a, b) => (a.focusOrder() ?? Number.MAX_SAFE_INTEGER) - (b.focusOrder() ?? Number.MAX_SAFE_INTEGER));
    }
    return result;
  }

  private moveFocus(next: boolean) {
    const nodes = this.focusableNodes();
    if (nodes.length == 0) return;
    const current = this.register.focused.get();
    const index = nodes.findIndex(it => it === current);
    const targetIndex =
      index < 0 ? (next ? 0 : nodes.length - 1) : next ? (index + 1) % nodes.length : (index - 1 + nodes.length) % nodes.length;
    this.setFocused(nodes[targetIndex]);
  }

  // -- Public event dispatch (for external callers like DOM events) --

  dispatchClick(x: number, y: number): void {
    try {
      const nwp = hitest(this, x, y);
      if (nwp) {
        mouseEventOf(nwp, 'click');
      }
    } catch (e) {
      console.error('全局mouseClick事件出错', e);
    }
  }

  dispatchMouseDown(x: number, y: number): void {
    try {
      this.register.pressed.set(true);
      const nwp = hitest(this, x, y);
      if (nwp) {
        this.setFocused(last.call(nwp).node);
        mouseEventOf(nwp, 'down');
      } else {
        this.setFocused(null);
      }
      this.register.dispatchMouseDown(x, y);
    } catch (e) {
      console.error('全局mouseDown事件出错', e);
    }
  }

  dispatchMouseUp(x: number, y: number): void {
    try {
      this.register.pressed.set(false);
      const nwp = hitest(this, x, y);
      if (nwp) {
        mouseEventOf(nwp, 'up');
      }
      this.register.dispatchMouseUp(x, y);
    } catch (e) {
      console.error('全局mouseUp事件出错', e);
    }
  }

  dispatchMouseMove(x: number, y: number): void {
    try {
      const nwp = hitest(this, x, y);
      this.register.moveHitest.set(nwp);
      this.register.requestCursor(cursorOf(nwp));
      if (nwp) {
        mouseEventOf(nwp, 'move');
      }
      this.register.dispatchMouseMove(x, y);
    } catch (e) {
      console.error('全局mouseMove事件出错', e);
    }
  }

  mouseExit(): void {
    this.register.pressed.set(false);
    this.register.moveHitest.set(null);
    this.register.requestCursor(CursorType.DEFAULT);
  }

  mouseWheel(x: number, y: number, deltaX: number, deltaY: number): void {
    try {
      this.register.dispatchMouseWheel(x, y, deltaX, deltaY);
    } catch (e) {
      console.error('全局mouseWheel事件出错', e);
    }
  }

  keyPress(
    key: string,
    code: KeyCode,
    ctrl: boolean,
    shift: boolean,
    alt: boolean,
    meta: boolean = false
  ): void {
    try {
      if (!alt && !meta && !ctrl && code == KeyCode.Tab) {
        this.moveFocus(!shift);
        return;
      }
      const e: KeyEvent = { key, code, ctrl, shift, alt, meta };
      this.register.dispatchKeyPress(e);
    } catch (e) {
      console.error('键盘事件出错', e);
    }
  }

  composingText(text: string, cursorPosition: number): void {
    try {
      this.register.dispatchComposingText(text, cursorPosition);
    } catch (e) {
      console.error('输入法事件出错', e);
    }
  }

  dispatchMouseWheel(x: number, y: number, deltaX: number, deltaY: number): void {
    this.mouseWheel(x, y, deltaX, deltaY);
  }
}

type MouseEventType = 'click' | 'down' | 'up' | 'move';

function mouseEventOf(nodeWithPosition: NodeWithPosition, type: MouseEventType) {
  const root = nodeWithPosition;
  let nwp: NodeWithPosition | null = nodeWithPosition;
  const list: NodeWithPosition[] = [];
  // 先捕获，再冒泡；中途 stopPropagation 则中断
  while (nwp) {
    const e = new MouseEvent(nwp.x, nwp.y, root.x, root.y);
    sendMouseEvent(nwp.node, type, e, true);
    if (e.stoppedProgression) {
      return;
    }
    list.push(nwp);
    nwp = nwp.next;
  }
  for (let i = list.length - 1; i >= 0; i--) {
    const it = list[i];
    const e = new MouseEvent(it.x, it.y, root.x, root.y);
    sendMouseEvent(it.node, type, e, false);
    if (e.stoppedProgression) {
      return;
    }
  }
}

function sendMouseEvent(node: Node, type: MouseEventType, e: MouseEvent, capture: boolean) {
  switch (type) {
    case 'click':
      if (capture) node.mouseClickCapture(e);
      else node.mouseClick(e);
      break;
    case 'down':
      if (capture) node.mouseDownCapture(e);
      else node.mouseDown(e);
      break;
    case 'up':
      if (capture) node.mouseUpCapture(e);
      else node.mouseUp(e);
      break;
    case 'move':
      if (capture) node.mouseMoveCapture(e);
      else node.mouseMove(e);
      break;
  }
}

function cursorOf(chain: NodeWithPosition | null): CursorType {
  let pointer = false;
  let n: NodeWithPosition | null = chain;
  while (n) {
    if (n.node instanceof EditableTextNode) {
      return CursorType.TEXT;
    }
    if (n.node.focusable()) {
      pointer = true;
    }
    n = n.next;
  }
  return pointer ? CursorType.POINTER : CursorType.DEFAULT;
}
