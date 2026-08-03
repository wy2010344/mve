import { PointKey, superCall } from 'wy-helper';
import { hookCurrentStateHolder, StateHolder } from 'mve-core';
import { renderOneKey } from 'mve-helper';
import { Node } from '../Node';
import { RectNode } from '../RectNode';
import { fillInnerRect, layoutSize, strokeInnerRect } from '../LayoutNode';
import { flex } from '../layout/FlexLayout';
import { Scroll } from '../Scroll';
import { GlobalMouseEvent } from '../EngineGlobal';
import { MouseEvent } from '../MouseEvent';

export abstract class SimpleScrollBar {
  abstract scroll(): Scroll;

  constructor(
    context: StateHolder<Node, readonly Node[]>,
    readonly direction: PointKey = 'y'
  ) {
    const self = this;
    new RectNode(context, {
      layout: flex({
        direction: this.direction,
        alignItem: 'stretch',
        alignFix: true,
        directionJustify: 'start',
      }),
      width: this.direction == 'y' ? layoutSize(10, false) : undefined,
      height: this.direction == 'x' ? layoutSize(10, false) : undefined,
      draw(ctx) {
        strokeInnerRect.call(this, ctx);
        superCall(this, 'draw', ctx);
      },
      children() {
        renderOneKey(
          () => self.scroll().scrollBarSize(self.direction),
          v => Boolean(v),
          function (key, get) {
            if (key) {
              new RectNode(hookCurrentStateHolder(true), {
                width: self.direction == 'x' ? () => get()?.size ?? 0 : undefined,
                height: self.direction == 'y' ? () => get()?.size ?? 0 : undefined,
                x: self.direction == 'x' ? () => get()?.offset ?? 0 : undefined,
                y: self.direction == 'y' ? () => get()?.offset ?? 0 : undefined,
                mouseDown(e: MouseEvent) {
                  const calc = get();
                  if (!calc) return;
                  const g = this.engineGlobal;
                  if (!g) return;
                  const startValue = self.scroll().value();
                  const startPointer = self.direction == 'y' ? e.globalY : e.globalX;
                  const move = g.registerMouseMove((me: GlobalMouseEvent) => {
                    const pointer = self.direction == 'y' ? me.y : me.x;
                    self.scroll().setValue(startValue + calc.moveToScroll(pointer - startPointer));
                  });
                  g.registerMouseUp(() => {
                    move();
                  });
                },
                draw(ctx) {
                  fillInnerRect.call(this, ctx);
                  superCall(this, 'draw', ctx);
                },
              });
            }
          }
        );
      },
    });
  }
}
