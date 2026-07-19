import { EmptyFun } from 'wy-helper';
import { StateHolder } from 'mve-core';
import { Node } from '../Node';
import { GlobalMouseEvent, engineGlobalContext } from '../EngineGlobal';

export function drag(
  context: StateHolder<Node>,
  change: (e: GlobalMouseEvent) => void
): void {
  const g = context.consume(engineGlobalContext)!;
  const d1 = g.registerMouseMove(change);
  g.registerMouseUp((e: GlobalMouseEvent) => {
    change(e);
    d1();
    e.destroy();
  });
}
