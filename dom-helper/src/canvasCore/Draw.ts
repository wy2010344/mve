export type ColorInt = number;

export function rgba(
  r: number = 255,
  g: number = 255,
  b: number = 255,
  a: number = 255
): ColorInt {
  return (
    ((a & 0xff) << 24) | ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff)
  );
}

export function colorToCSS(color: ColorInt): string {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const a = ((color >> 24) & 0xff) / 255;
  if (a >= 1) return `rgb(${r},${g},${b})`;
  return `rgba(${r},${g},${b},${a.toFixed(3)})`;
}

/**
 * 圆角矩形路径（两套树共用：canvasRender / canvasRender2）。
 *
 * 半径按半宽 / 半高兜底（`arcTo` 在半径超过时会产生畸形路径），
 * 这也是"宽高很小却给了大圆角"时不崩的原因。
 */
export function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** 圆角矩形填充（路径 + 填充；两套树的矩形节点共用） */
export function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: ColorInt
): void {
  ctx.fillStyle = colorToCSS(color);
  roundRectPath(ctx, x, y, w, h, r);
  ctx.fill();
}
