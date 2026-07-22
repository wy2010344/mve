import { collectSignal, EmptyFun } from 'wy-helper';
import { renderListRoot } from 'mve-core';
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
export class Renderer extends LayoutNode {
  constructor(args: RendererArgs) {
    super(undefined, args as any);
    this.frameCallback = args.frameCallback;
    const that = this;
    this.state = renderListRoot(this, collectIndex, function () {
      this.provide(engineGlobalContext, {
        registerMouseMove: cb => register(that.moveList, cb),
        registerMouseUp: cb => register(that.upList, cb),
        registerMouseWheel: cb => register(that.wheelList, cb),
      });
      that.argChildren.apply(this);
    });
    this.children = this.state.target;
  }

  // -- EngineGlobal registration --
  private readonly moveList = new Map<MouseCallback, EmptyFun>();
  private readonly upList = new Map<MouseCallback, EmptyFun>();
  private readonly wheelList = new Map<WheelCallback, EmptyFun>();

  private readonly state: ReturnType<typeof renderListRoot<Node>>;
  frameCallback() {}

  scheduled = false;
  private readonly signal = collectSignal(() => {
    this.frameCallback();
  });

  destroy(): void {
    this.moveList.clear();
    this.upList.clear();
    this.wheelList.clear();
    this.state.destroy();
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
      for (const [cb, destroy] of this.upList) {
        cb({ x, y, destroy });
      }
    } catch (e) {
      console.error('全局mouseup事件出错', e);
    }
  }

  dispatchMouseMove(x: number, y: number): void {
    try {
      for (const [cb, destroy] of this.moveList) {
        cb({ x, y, destroy });
      }
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
      for (const [cb, destroy] of this.wheelList) {
        cb({ x, y, deltaX, deltaY, destroy });
      }
    } catch (e) {
      console.error('全局mousewheel事件出错', e);
    }
  }
}
