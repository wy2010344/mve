import {
  AlignItem,
  AlignSelfFun,
  DirectionFixBetweenWhenOne,
  DirectionJustify,
  FlexChildConvert,
  FlexLayout,
  LayoutFun,
  StackChildConvert,
  StackLayout,
  ValueOrGet,
  valueOrGetToGet,
} from 'wy-helper';
import {
  LayoutNode3,
  LayoutDirection3,
  ThreeKey,
  outerSize,
} from './LayoutNode3';

/**
 * 3D版flex:主轴用FlexLayout排布,其余两个辅轴用StackLayout对齐(参照canvasRender的flex)
 */
export function flex3(arg: {
  direction?: ValueOrGet<ThreeKey>;
  alignItem?: ValueOrGet<AlignItem>;
  alignFix?: ValueOrGet<boolean>;
  directionJustify?: ValueOrGet<DirectionJustify>;
  reverse?: ValueOrGet<boolean>;
  gap?: ValueOrGet<number>;
  directionFixBetweenWhenOne?: ValueOrGet<DirectionFixBetweenWhenOne>;
}): LayoutDirection3 {
  const direction = valueOrGetToGet(arg.direction ?? 'x');
  const main: LayoutFun<LayoutNode3> & FlexChildConvert<LayoutNode3> = {
    outerSize(n) {
      return outerSize.call(n, direction());
    },
    index(n) {
      return n.layoutIndex();
    },
    grow(n) {
      const grow = n.findExt(GrowChild3);
      if (grow) {
        return grow.grow(direction());
      }
      return 0;
    },
    createLayout(o) {
      return new FlexLayout(arg, o, this);
    },
  };
  const cross = (
    d: ThreeKey
  ): LayoutFun<LayoutNode3> & StackChildConvert<LayoutNode3> => {
    return {
      align(n) {
        const align = n.findExt(AlignChild3);
        if (align) {
          return align.align(d);
        }
      },
      outerSize(n) {
        return outerSize.call(n, d);
      },
      createLayout(o) {
        return new StackLayout(arg, o, this);
      },
    };
  };
  return {
    layout(d: ThreeKey): LayoutFun<LayoutNode3> {
      if (d == direction()) {
        return main;
      }
      return cross(d);
    },
  };
}

export class GrowChild3 {
  argGrow(n: ThreeKey): number {
    return 0;
  }
  growX() {
    return this.argGrow('x');
  }
  growY() {
    return this.argGrow('y');
  }
  growZ() {
    return this.argGrow('z');
  }
  grow(d: ThreeKey) {
    if (d == 'x') {
      return this.growX();
    }
    if (d == 'y') {
      return this.growY();
    }
    return this.growZ();
  }
}

export function grow3(args: {
  argGrow?: ValueOrGet<number, GrowChild3, [ThreeKey]>;
  growX?: ValueOrGet<number, GrowChild3>;
  growY?: ValueOrGet<number, GrowChild3>;
  growZ?: ValueOrGet<number, GrowChild3>;
}) {
  const gc = new GrowChild3();
  gc.argGrow = valueOrGetToGet(args.argGrow, gc.argGrow);
  gc.growX = valueOrGetToGet(args.growX, gc.growX);
  gc.growY = valueOrGetToGet(args.growY, gc.growY);
  gc.growZ = valueOrGetToGet(args.growZ, gc.growZ);
  return gc;
}

export class AlignChild3 {
  argAlign(n: ThreeKey): AlignSelfFun | void {}

  alignX() {
    return this.argAlign('x');
  }
  alignY() {
    return this.argAlign('y');
  }
  alignZ() {
    return this.argAlign('z');
  }
  align(d: ThreeKey) {
    if (d == 'x') {
      return this.alignX();
    }
    if (d == 'y') {
      return this.alignY();
    }
    return this.alignZ();
  }
}

export function align3(args: {
  argAlign?: ValueOrGet<AlignSelfFun | void, AlignChild3, [ThreeKey]>;
  alignX?: ValueOrGet<AlignSelfFun | void, AlignChild3>;
  alignY?: ValueOrGet<AlignSelfFun | void, AlignChild3>;
  alignZ?: ValueOrGet<AlignSelfFun | void, AlignChild3>;
}) {
  const ac = new AlignChild3();
  ac.argAlign = valueOrGetToGet(args.argAlign, ac.argAlign);
  ac.alignX = valueOrGetToGet(args.alignX, ac.alignX);
  ac.alignY = valueOrGetToGet(args.alignY, ac.alignY);
  ac.alignZ = valueOrGetToGet(args.alignZ, ac.alignZ);
  return ac;
}
