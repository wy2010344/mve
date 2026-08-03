import type { Paragraph, Surface } from 'canvaskit-wasm';
import { getCanvasKit } from './CanvasKit';

interface ParagraphRaster {
  surface: Surface;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  dpr: number;
}

const rasterCache = new WeakMap<Paragraph, ParagraphRaster>();

export interface DrawParagraphOptions {
  alpha?: number;
  /** 离屏栅格化缩放，用于高分屏清晰渲染；绘制到目标时的尺寸仍为段落逻辑尺寸 */
  dpr?: number;
}

/**
 * 将 CanvasKit 段落离屏栅格化后绘制到 2D 上下文。
 * 段落对象（Paragraph）通常由调用方 memo 缓存，此处按段落缓存离屏 surface。
 */
export function drawParagraph(
  p: Paragraph,
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  opts: DrawParagraphOptions = {}
): void {
  const w = p.getLongestLine();
  const h = p.getHeight();
  if (!(w > 0) || !(h > 0)) return;
  const ck = getCanvasKit();
  if (!ck) {
    return;
  }
  const dpr = opts.dpr ?? 1;
  let raster = rasterCache.get(p);
  if (!raster || raster.width < w || raster.height < h || raster.dpr !== dpr) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(w * dpr);
    canvas.height = Math.ceil(h * dpr);
    const surface = ck.MakeSWCanvasSurface(canvas);
    if (!surface) {
      throw new Error('创建 CanvasKit 离屏 Surface 失败');
    }
    raster = { surface, canvas, width: w, height: h, dpr };
    rasterCache.set(p, raster);
  }
  const sk = raster.surface.getCanvas();
  sk.clear(ck.Color(0, 0, 0, 0));
  sk.save();
  sk.scale(dpr, dpr);
  sk.drawParagraph(p, 0, 0);
  sk.restore();
  raster.surface.flush();
  ctx.save();
  if (opts.alpha != null) {
    ctx.globalAlpha = opts.alpha;
  }
  ctx.drawImage(raster.canvas, x, y, w, h);
  ctx.restore();
}
