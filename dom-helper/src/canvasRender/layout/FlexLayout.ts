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
      return n.grow();
    },
    createLayout(o) {
      return new FlexLayout(arg, o, this);
    },
  };
  const cross: LayoutFun<LayoutNode> & StackChildConvert<LayoutNode> = {
    align(n) {
      return n.align();
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
