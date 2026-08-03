import type {
  CanvasKit,
  CanvasKitInitOptions,
  Paragraph,
  Surface,
} from 'canvaskit-wasm';

export interface CanvasKitConfig {
  /** 自定义加载器：返回已初始化的 CanvasKit 实例（例如通过 npm 包 import CanvasKitInit） */
  load?: () => CanvasKit | Promise<CanvasKit>;
  /** script 标签 CDN 地址，locateFile 自动指向同目录的 wasm */
  url?: string;
}

const DEFAULT_URL = 'https://unpkg.com/canvaskit-wasm@0.41.1/bin/canvaskit.js';

let config: CanvasKitConfig = {};
let cached: Promise<CanvasKit> | null = null;
let instance: CanvasKit | null = null;

declare global {
  interface Window {
    CanvasKitInit?: (opts?: CanvasKitInitOptions) => Promise<CanvasKit>;
  }
}

export function configureCanvasKit(cfg: CanvasKitConfig): void {
  config = cfg;
  cached = null;
  instance = null;
}

export function loadCanvasKit(): Promise<CanvasKit> {
  if (!cached) {
    cached = initCanvasKit().then(ck => {
      instance = ck;
      return ck;
    });
  }
  return cached;
}

export function getCanvasKit(): CanvasKit {
  if (!instance) {
    throw new Error('CanvasKit 尚未加载，请先 await loadCanvasKit()');
  }
  return instance;
}

function loadScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`加载 CanvasKit 失败: ${url}`));
    document.head.appendChild(script);
  });
}

async function loadFromUrl(url: string): Promise<CanvasKit> {
  if (typeof document == 'undefined') {
    throw new Error(
      '非浏览器环境无法通过 script 标签加载 CanvasKit，请通过 configureCanvasKit({ load }) 自定义加载方式'
    );
  }
  if (!window.CanvasKitInit) {
    await loadScript(url);
  }
  const init = window.CanvasKitInit;
  if (!init) {
    throw new Error(`加载 CanvasKit 失败：脚本未暴露 CanvasKitInit，url: ${url}`);
  }
  const dir = url.slice(0, url.lastIndexOf('/') + 1);
  return init({ locateFile: file => dir + file });
}

function initCanvasKit(): Promise<CanvasKit> {
  const cfg = config;
  if (cfg.load) {
    return Promise.resolve(cfg.load());
  }
  return loadFromUrl(cfg.url || DEFAULT_URL);
}

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
  const dpr = opts.dpr ?? 1;
  let raster = rasterCache.get(p);
  if (
    !raster ||
    raster.width < w ||
    raster.height < h ||
    raster.dpr !== dpr
  ) {
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
