import { ColorInt } from './Draw';

let measureCanvas: HTMLCanvasElement | null = null;
let measureCtx: CanvasRenderingContext2D | null = null;

export function measureText(
  text: string,
  fontFamily: string | null = null,
  fontWeight: number = 400,
  fontSize: number = 16
): number {
  if (!measureCanvas) {
    measureCanvas = document.createElement('canvas');
    measureCtx = measureCanvas.getContext('2d')!;
  }
  const font = `${fontWeight} ${fontSize}px ${fontFamily ?? 'sans-serif'}`;
  measureCtx!.font = font;
  return measureCtx!.measureText(text).width;
}
