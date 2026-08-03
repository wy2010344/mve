export interface CachedPicture {
  draw(ctx: CanvasRenderingContext2D, x: number, y: number): void;
}

/**
 * 将一组绘制命令一次性记录到离屏画布，后续通过 drawImage 重放，避免逐帧重绘。
 */
export function recordPicture(
  width: number,
  height: number,
  callback: (ctx: CanvasRenderingContext2D) => void
): CachedPicture {
  if (!(width > 0) || !(height > 0)) {
    return {
      draw(ctx: CanvasRenderingContext2D, x: number, y: number) {},
    };
  }
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(width);
  canvas.height = Math.ceil(height);
  callback(canvas.getContext('2d')!);
  return {
    draw(ctx: CanvasRenderingContext2D, x: number, y: number) {
      ctx.drawImage(canvas, x, y);
    },
  };
}
