import { collectSignal, emptyFun, EmptyFun } from 'wy-helper';
import { renderListRoot, StateHolder } from 'mve-core';
import { Node, collectIndex, hitest, NodeWithPosition } from './Node';
import { LayoutNode, LayoutNodeArg, outerSize } from './LayoutNode';
import {
  MouseCallback,
  WheelCallback,
  engineGlobalContext,
} from './EngineGlobal';
import { MouseEvent } from './MouseEvent';

function register<K>(map: Map<K, EmptyFun>, key: K): EmptyFun {
  const destroy: EmptyFun = () => map.delete(key);
  map.set(key, destroy);
  return destroy;
}
export interface RendererArgs<T = Renderer> extends LayoutNodeArg<T> {
  frameCallback(): void;
}

class Register {
  dispatchMouseWheel(x: number, y: number, deltaX: number, deltaY: number) {
    for (const [cb, destroy] of this.wheelList) {
      cb({ x, y, deltaX, deltaY, destroy });
    }
  }
  dispatchMouseUp(x: number, y: number) {
    for (const [cb, destroy] of this.upList) {
      cb({ x, y, destroy });
    }
  }
  dispatchMouseMove(x: number, y: number) {
    for (const [cb, destroy] of this.moveList) {
      cb({ x, y, destroy });
    }
  }
  // -- EngineGlobal registration --
  private readonly moveList = new Map<MouseCallback, EmptyFun>();
  private readonly upList = new Map<MouseCallback, EmptyFun>();
  private readonly wheelList = new Map<WheelCallback, EmptyFun>();
  provide(context: StateHolder<Node>) {
    context.provide(engineGlobalContext, {
      registerMouseMove: cb => register(this.moveList, cb),
      registerMouseUp: cb => register(this.upList, cb),
      registerMouseWheel: cb => register(this.wheelList, cb),
    });
  }
  destroy() {
    this.moveList.clear();
    this.upList.clear();
    this.wheelList.clear();
  }
}
export class Renderer extends LayoutNode {
  private register: Register;
  private destroyState: () => void = emptyFun;
  constructor(args: RendererArgs, context?: StateHolder<Node>) {
    const register = new Register();
    if (context) {
      register.provide(context);
    }
    super(context, args as any);
    this.register = register;
    this.frameCallback = args.frameCallback;
    if (!context) {
      const that = this;
      const state = renderListRoot(this, collectIndex, function () {
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

  destroy(): void {
    this.register.destroy();
    this.destroyState();
  }

  render(canvas: CanvasRenderingContext2D): void {
    this.scheduled = true;
    try {
      this.signal.collect(() => {
        canvas.clearRect(
          0,
          0,
          outerSize.call(this, 'x'),
          outerSize.call(this, 'y')
        );
        this.draw(canvas);
      });
    } catch (err) {
      console.error('渲染出错', err);
    }
    this.scheduled = false;
  }

  // -- Public mouse event dispatch (for external callers like DOM events) --

  private mouseEventOf(x: number, y: number, type: string): void {
    try {
      let nwp: NodeWithPosition | null = hitest(this, x, y);
      if (!nwp) return;
      const list: NodeWithPosition[] = [];
      while (nwp) {
        const e = new MouseEvent(nwp.x, nwp.y, x, y);
        this.sendMouseEvent(nwp.node, type, e, true);
        if (e.stoppedProgression) return;
        list.push(nwp);
        nwp = nwp.next;
      }
      for (let i = list.length - 1; i >= 0; i--) {
        const it = list[i];
        const e = new MouseEvent(it.x, it.y, x, y);
        this.sendMouseEvent(it.node, type, e, false);
        if (e.stoppedProgression) return;
      }
    } catch (e) {
      console.error(`事件出错--${type}`, e);
    }
  }

  private sendMouseEvent(
    node: Node,
    type: string,
    e: MouseEvent,
    capture: boolean
  ): void {
    if (type === 'click') {
      if (capture) node.mouseClickCapture(e);
      else node.mouseClick(e);
    } else if (type === 'down') {
      if (capture) node.mouseDownCapture(e);
      else node.mouseDown(e);
    } else if (type === 'up') {
      if (capture) node.mouseUpCapture(e);
      else node.mouseUp(e);
    }
  }

  dispatchClick(x: number, y: number): void {
    this.mouseEventOf(x, y, 'click');
  }

  dispatchMouseDown(x: number, y: number): void {
    this.mouseEventOf(x, y, 'down');
  }

  dispatchMouseUp(x: number, y: number): void {
    try {
      this.mouseEventOf(x, y, 'up');
      this.register.dispatchMouseUp(x, y);
    } catch (e) {
      console.error('全局mouseup事件出错', e);
    }
  }

  dispatchMouseMove(x: number, y: number): void {
    try {
      this.register.dispatchMouseMove(x, y);
    } catch (e) {
      console.error('全局mousemove事件出错', e);
    }
  }

  dispatchMouseWheel(
    x: number,
    y: number,
    deltaX: number,
    deltaY: number
  ): void {
    try {
      this.register.dispatchMouseWheel(x, y, deltaX, deltaY);
    } catch (e) {
      console.error('全局mousewheel事件出错', e);
    }
  }
}
