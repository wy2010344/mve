import { ColorInt, colorToCSS, rgba } from '../canvasCore/Draw';
import { Node2 } from './Node';

export {
  MAX_LAYOUT_WIDTH,
  inkShiftYOf,
} from '../canvasCore/TextMetric';

export function fillOuterRect(
  node: Node2,
  ctx: CanvasRenderingContext2D,
  color: ColorInt = rgba(0, 0, 0)
) {
  ctx.fillStyle = colorToCSS(color);
  ctx.fillRect(0, 0, node.width(), node.height());
}

export function fillInnerRect(
  node: Node2,
  ctx: CanvasRenderingContext2D,
  color: ColorInt = rgba(0, 0, 0)
) {
  ctx.fillStyle = colorToCSS(color);
  ctx.fillRect(
    node.paddingInlineStart(),
    node.paddingBlockStart(),
    node.width() - node.paddingInlineStart() - node.paddingInlineEnd(),
    node.height() - node.paddingBlockStart() - node.paddingBlockEnd()
  );
}
