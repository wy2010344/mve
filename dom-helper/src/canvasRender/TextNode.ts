import { createSignal, memo } from 'wy-helper';
import { StateHolder } from 'mve-core';
import { Direction, Node } from './Node';
import { RectNode } from './RectNode';
import { layoutSize, LayoutSize } from './LayoutNode';
import { MouseEvent } from './MouseEvent';
import { absolutePosition } from './Node';
import { ColorInt, rgba, colorToCSS } from './Draw';
import { engineGlobalContext } from './EngineGlobal';
import { measureText } from './PlatformCanvas';

export class TextNode extends RectNode {
  text: string = '';
  fontFamily: string | null = null;
  fontSize: number = 16;

  get lightHeight(): number {
    return this.fontSize * 1.4;
  }

  fontWeight: number = 400;
  color: ColorInt = rgba(0, 0, 0);
  selectionColor: ColorInt = rgba(0, 100, 200, 60);

  private anchorIndex = createSignal(-1);
  private focusIndex = createSignal(-1);

  get selectionText(): string | null {
    const a = this.anchorIndex.get();
    const f = this.focusIndex.get();
    if (a < 0 || f < 0 || a === f) return null;
    const start = Math.min(a, f);
    const end = Math.max(a, f);
    return this.text.substring(start, end);
  }

  private readonly charPositions = memo(() => {
    if (this.text.length === 0) return [0];
    const positions: number[] = [];
    for (let i = 0; i < this.text.length; i++) {
      positions.push(
        measureText(
          this.text.substring(0, i + 1),
          this.fontFamily,
          this.fontWeight,
          this.fontSize
        )
      );
    }
    return positions;
  });

  private charAt(x: number): number {
    const positions = this.charPositions();
    for (let i = 0; i < positions.length; i++) {
      if (positions[i] > x) return i;
    }
    return positions.length;
  }
  override buildChildren(): void {}

  override size(direction: Direction): LayoutSize {
    if (direction === Direction.x) {
      const positions = this.charPositions();
      return layoutSize(
        positions.length > 0 ? positions[positions.length - 1] : 0,
        true
      );
    }
    return layoutSize(this.fontSize * 1.4, true);
  }

  private onMouseDown: boolean = false;

  override mouseDown(e: MouseEvent): void {
    this.anchorIndex.set(this.charAt(e.x));
    this.focusIndex.set(this.anchorIndex.get());
    this.onMouseDown = true;
    e.stopPropagation();
  }

  constructor(context: StateHolder<Node>) {
    super(context);
    const engineGlobal = context.consume(engineGlobalContext)!;
    const d1 = engineGlobal.registerMouseUp(() => {
      this.onMouseDown = false;
    });
    const absX = memo(() => absolutePosition(this, Direction.x));
    const d2 = engineGlobal.registerMouseMove(
      (e: import('./EngineGlobal').GlobalMouseEvent) => {
        if (this.onMouseDown) {
          this.focusIndex.set(this.charAt(e.x - absX()));
        }
      }
    );
    context.addDestroy(() => {
      d1();
      d2();
    });
  }

  private setFont(canvas: CanvasRenderingContext2D): void {
    canvas.font = `${this.fontWeight} ${this.fontSize}px ${this.fontFamily ?? 'sans-serif'}`;
  }

  override drawSelf(canvas: CanvasRenderingContext2D): void {
    if (this.text.length === 0) return;

    const positions = this.charPositions();
    const h = this.lightHeight;
    const a = this.anchorIndex.get();
    const f = this.focusIndex.get();

    if (a >= 0 && f >= 0 && a !== f) {
      const start = Math.min(a, f);
      const end = Math.max(a, f);
      const leftX = start === 0 ? 0 : positions[start - 1];
      const rightX = positions[end - 1];
      canvas.fillStyle = colorToCSS(this.selectionColor);
      canvas.fillRect(leftX, 0, rightX - leftX, h);
    }

    this.setFont(canvas);
    canvas.fillStyle = colorToCSS(this.color);
    canvas.fillText(this.text, 0, this.fontSize);
  }
}
