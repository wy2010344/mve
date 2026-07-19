import {
  AlignItem,
  DirectionJustify,
  DirectionFixBetweenWhenOne,
  FlexLayout,
  StackLayout,
  FlexChildConvert,
  StackChildConvert,
  LayoutFun,
} from 'wy-helper';
import { Direction, DirectionOpposite } from '../Node';
import { LayoutNode } from './LayoutNode';

export function flex(arg: {
  direction(): Direction;
  alignItem(): AlignItem;
  alignFix(): boolean;
  directionJustify(): DirectionJustify;
  reverse(): boolean;
  gap(): number;
  directionFixBetweenWhenOne(): DirectionFixBetweenWhenOne;
}) {
  const main: LayoutFun<LayoutNode> & FlexChildConvert<LayoutNode> = {
    outerSize(n) {
      return n.outerSize(arg.direction());
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
      return n.outerSize(DirectionOpposite[arg.direction()]);
    },
    createLayout(o) {
      return new StackLayout(arg, o, this);
    },
  };
  return function (direction: Direction): LayoutFun<LayoutNode> {
    if (direction == arg.direction()) {
      return main;
    }
    return cross;
  };
}
