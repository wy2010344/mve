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

export function createFlex<
  AbsLayoutNode extends {
    layoutIndex(): number;
  },
>(x: {
  size(n: AbsLayoutNode, d: PointKey): number;
  findExt<T>(n: AbsLayoutNode, c: new (...vs: any[]) => T): T | undefined;
}) {
  return function flex(arg: {
    direction?: ValueOrGet<PointKey>;
    alignItem?: ValueOrGet<AlignItem>;
    alignFix?: ValueOrGet<boolean>;
    directionJustify?: ValueOrGet<DirectionJustify>;
    reverse?: ValueOrGet<boolean>;
    gap?: ValueOrGet<number>;
    directionFixBetweenWhenOne?: ValueOrGet<DirectionFixBetweenWhenOne>;
  }) {
    const direction = valueOrGetToGet(arg.direction ?? 'y');
    const main: LayoutFun<AbsLayoutNode> & FlexChildConvert<AbsLayoutNode> = {
      outerSize(n) {
        return x.size(n, direction());
      },
      index(n) {
        return n.layoutIndex();
      },
      grow(n) {
        const grow = x.findExt(n, GrowChild);
        if (grow) {
          if (direction() == 'x') {
            return grow.growX();
          }
          return grow.growY();
        }
        return 0;
      },
      ignore(n) {
        const it = x.findExt(n, IgnoreFlexChild);
        return it ? it.ignore() : false;
      },
      createLayout(o) {
        return new FlexLayout(arg, o, this);
      },
    };
    const cross: LayoutFun<AbsLayoutNode> & StackChildConvert<AbsLayoutNode> = {
      align(n) {
        const align = x.findExt(n, AlignChild);
        if (align) {
          if (direction() == 'x') {
            return align.alignY();
          }
          return align.alignX();
        }
      },
      outerSize(n) {
        return x.size(n, toOpposite(direction()));
      },
      ignore(n) {
        const it = x.findExt(n, IgnoreFlexChild);
        return it ? it.ignore() : false;
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
  };
}

export const flex = createFlex<LayoutNode>({
  size(n, d) {
    return outerSize.call(n, d);
  },
  findExt(n, c) {
    return n.findExt(c);
  },
});

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

export class IgnoreFlexChild {
  argIgnore(): boolean {
    return false;
  }
  ignore() {
    return this.argIgnore();
  }
}

export function ignoreFlex(args: {
  ignore?: ValueOrGet<boolean, IgnoreFlexChild>;
}) {
  const fc = new IgnoreFlexChild();
  fc.argIgnore = valueOrGetToGet(args.ignore, fc.argIgnore);
  return fc;
}
