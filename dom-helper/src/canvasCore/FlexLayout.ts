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

export function createFlex<
  AbsLayoutNode extends {
    layoutIndex(): number;
    findExt<T>(c: new (...vs: any[]) => T): T | undefined;
  },
>(x: { size(n: AbsLayoutNode, d: PointKey): number }) {
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
        const grow = n.findExt(GrowChild);
        if (grow) {
          if (direction() == 'x') {
            return grow.growX();
          }
          return grow.growY();
        }
        return 0;
      },
      ignore(n) {
        const it = n.findExt(IgnoreFlexChild);
        return it ? it.ignore() : false;
      },
      createLayout(o) {
        return new FlexLayout(arg, o, this);
      },
    };
    const cross: LayoutFun<AbsLayoutNode> & StackChildConvert<AbsLayoutNode> = {
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
        return x.size(n, toOpposite(direction()));
      },
      ignore(n) {
        const it = n.findExt(IgnoreFlexChild);
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
