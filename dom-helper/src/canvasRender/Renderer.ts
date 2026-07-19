import {
  absoluteLayoutFun,
  AlignSelfFun,
  EmptyFun,
  GetValue,
  Layout,
  LayoutFun,
  memo,
} from 'wy-helper';
import { StateHolder, renderRoot } from 'mve-core';
import {
  Node,
  Direction,
  collectIndex,
  hitest,
  NodeWithPosition,
} from './Node';
import {
  LayoutNode,
  StartEnd,
  LayoutSize,
  layoutSize,
  commonLayoutNode,
  createLayout,
} from './layout/LayoutNode';
import {
  EngineGlobal,
  MouseCallback,
  WheelCallback,
  engineGlobalContext,
} from './EngineGlobal';
import { MouseEvent } from './MouseEvent';
import { rgba } from './Draw';
import { RectNode } from './RectNode';

function register<K>(map: Map<K, EmptyFun>, key: K): EmptyFun {
  const destroy: EmptyFun = () => map.delete(key);
  map.set(key, destroy);
  return destroy;
}

export class Renderer implements Node, LayoutNode {
  outerSize(d: Direction): number {
    return commonLayoutNode.outerSize(this, d);
  }
  innerSize(d: Direction): number {
    return commonLayoutNode.innerSize(this, d);
  }
  constructor(arg: Partial<Renderer>) {
    Object.assign(this, arg);
    this.state = renderRoot(
      this,
      collectIndex as any,
      (holder: StateHolder<Node>) => {
        this._holder = holder;
        holder.provide(engineGlobalContext, {
          registerMouseMove: cb => register(this.moveList, cb),
          registerMouseUp: cb => register(this.upList, cb),
          registerMouseWheel: cb => register(this.wheelList, cb),
        } as EngineGlobal);
        this.buildChildren();
      }
    );
    this.children = this.state.target;
  }
  readonly parent: Node | null = null;
  _holder!: StateHolder<Node>;
  index(): number {
    return 0;
  }
  width() {
    return 0;
  }
  height() {
    return 0;
  }
  grow(): number {
    return 0;
  }
  align(): AlignSelfFun | void {}
  layoutIndex(): number {
    return 0;
  }
  layoutParent() {}

  size(d: Direction): LayoutSize {
    return layoutSize(d === Direction.x ? this.width() : this.height(), false);
  }

  layoutValue(d: Direction): Layout {
    return d === Direction.x ? this.layoutX() : this.layoutY();
  }

  padding(_d: Direction, _se: StartEnd): number {
    return 0;
  }
  innerStart(d: Direction): number {
    return this.padding(d, StartEnd.start);
  }

  readonly layoutChildren = memo(() => {
    return this.children().filter(
      c => c instanceof RectNode
    ) as unknown as LayoutNode[];
  });

  sizeFromParent(d: Direction): LayoutSize {
    return this.size(d);
  }
  sizeFromChildren(d: Direction): LayoutSize {
    return layoutSize(this.layoutValue(d).sizeFromChildren(), true);
  }

  readonly layoutX: GetValue<Layout> = createLayout(this, Direction.x);
  readonly layoutY: GetValue<Layout> = createLayout(this, Direction.y);

  layout(_d: Direction): LayoutFun<LayoutNode> {
    return absoluteLayoutFun;
  }

  position(_d: Direction): number {
    return 0;
  }
  acceptHit(_x: number, _y: number): boolean {
    return false;
  }

  // Node interface methods (no-ops for Renderer itself)
  mouseClick(_e: MouseEvent) {}
  mouseClickCapture(_e: MouseEvent) {}
  mouseDown(_e: MouseEvent) {}
  mouseDownCapture(_e: MouseEvent) {}
  mouseUp(_e: MouseEvent) {}
  mouseUpCapture(_e: MouseEvent) {}

  drawSelf(_canvas: CanvasRenderingContext2D) {}

  draw(canvas: CanvasRenderingContext2D): void {
    this.drawSelf(canvas);
    for (const child of this.children()) {
      canvas.save();
      const x = child.position(Direction.x);
      const y = child.position(Direction.y);
      canvas.translate(x, y);
      child.draw(canvas);
      canvas.restore();
    }
  }

  // -- EngineGlobal registration --
  private readonly moveList = new Map<MouseCallback, EmptyFun>();
  private readonly upList = new Map<MouseCallback, EmptyFun>();
  private readonly wheelList = new Map<WheelCallback, EmptyFun>();

  private readonly state: ReturnType<typeof renderRoot<Node>>;
  frameCallback() {}

  scheduled = false;
  private readonly signal = {
    collect: (fn: () => void) => {
      fn();
    },
  };

  destroy(): void {
    this.moveList.clear();
    this.upList.clear();
    this.wheelList.clear();
    this.state.destroy();
  }

  children: GetValue<Node[]>;

  buildChildren() {}

  render(canvas: CanvasRenderingContext2D): void {
    this.scheduled = true;
    try {
      canvas.clearRect(0, 0, this.width(), this.height());
      this.signal.collect(() => {
        void this.width();
        void this.height();
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
        it.node.mouseClick(e);
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

  dispatchMouseWheel(x: number, y: number, delta: number): void {
    try {
      for (const [cb, destroy] of this.wheelList) {
        cb({ x, y, delta, destroy });
      }
    } catch (e) {
      console.error('全局mousewheel事件出错', e);
    }
  }
}
