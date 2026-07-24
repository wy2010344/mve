import {
  AlignItem,
  DirectionJustify,
  DirectionFixBetweenWhenOne,
  FlexLayout,
  StackLayout,
  FlexChildConvert,
  StackChildConvert,
  LayoutFun,
  ValueOrGet,
  PointKey,
  valueOrGetToGet,
  toOpposite,
  AlignSelfFun,
} from 'wy-helper';
import { LayoutNode, outerSize } from '../LayoutNode';

export function flex(arg: {
  direction?: ValueOrGet<PointKey>;
  alignItem?: ValueOrGet<AlignItem>;
  alignFix?: ValueOrGet<boolean>;
  directionJustify?: ValueOrGet<DirectionJustify>;
  reverse?: ValueOrGet<boolean>;
  gap?: ValueOrGet<number>;
  directionFixBetweenWhenOne?: ValueOrGet<DirectionFixBetweenWhenOne>;
}) {
  const direction = valueOrGetToGet(arg.direction ?? 'y');
  const main: LayoutFun<LayoutNode> & FlexChildConvert<LayoutNode> = {
    outerSize(n) {
      return outerSize.call(n, direction());
    },
    index(n) {
      return n.layoutIndex();
    },
    grow(n) {
      const grow = n.findExt(GrowChild);
      if (grow) {
        if (direction() == 'x') {
          return grow.growX();
        }
        return grow.growY();
      }
      return 0;
    },
    createLayout(o) {
      return new FlexLayout(arg, o, this);
    },
  };
  const cross: LayoutFun<LayoutNode> & StackChildConvert<LayoutNode> = {
    align(n) {
      const align = n.findExt(AlignChild);
      if (align) {
        if (direction() == 'x') {
          return align.alignY();
        }
        return align.alignX();
      }
    },
    outerSize(n) {
      return outerSize.call(n, toOpposite(direction()));
    },
    createLayout(o) {
      return new StackLayout(arg, o, this);
    },
  };
  return {
    layout(n: PointKey) {
      if (direction() == n) {
        return main;
      }
      return cross;
    },
  };
}

export class GrowChild {
  argGrow(n: PointKey): number {
    return 0;
  }
  growX() {
    return this.argGrow('x');
  }
  growY() {
    return this.argGrow('y');
  }
}

export function grow(args: {
  argGrow?: ValueOrGet<number, GrowChild, [PointKey]>;
  growX?: ValueOrGet<number, GrowChild>;
  growY?: ValueOrGet<number, GrowChild>;
}) {
  const gc = new GrowChild();
  gc.argGrow = valueOrGetToGet(args.argGrow, gc.argGrow);
  gc.growX = valueOrGetToGet(args.growX, gc.growX);
  gc.growY = valueOrGetToGet(args.growY, gc.growY);
  return gc;
}

export class AlignChild {
  argAlign(n: PointKey): AlignSelfFun | void {}

  alignX() {
    return this.argAlign('x');
  }
  alignY() {
    return this.argAlign('y');
  }
}

export function align(args: {
  argAlign?: ValueOrGet<AlignSelfFun | void, AlignChild, [PointKey]>;
  alignX?: ValueOrGet<AlignSelfFun | void, AlignChild>;
  alignY?: ValueOrGet<AlignSelfFun | void, AlignChild>;
}) {
  const ac = new AlignChild();
  ac.argAlign = valueOrGetToGet(args.argAlign, ac.argAlign);
  ac.alignX = valueOrGetToGet(args.alignX, ac.alignX);
  ac.alignY = valueOrGetToGet(args.alignY, ac.alignY);
  return ac;
}
