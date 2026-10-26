/**
 * 几何基元（对标 Kotlin Geometry.kt）：
 * 点、轴对齐矩形与可录制路径。Path2 与 Kotlin 的 Path 对应——
 * 命令序列录制 + 回放（[Path2.applyTo] 翻译成 2D context 绘制），
 * 命中测试用纯 JS 实现（偶数规则 + 曲线扁平化，对标 Kotlin 的
 * expect pathHitTest，不依赖平台 Path.contains）。
 */

/** 二维点（对标 Kotlin PointF data class） */
export interface PointF {
  readonly x: number;
  readonly y: number;
}

/** 轴对齐矩形（对标 Kotlin RectF data class） */
export class RectF {
  constructor(
    readonly left: number,
    readonly top: number,
    readonly right: number,
    readonly bottom: number
  ) {}

  get width(): number {
    return this.right - this.left;
  }

  get height(): number {
    return this.bottom - this.top;
  }

  get centerX(): number {
    return (this.left + this.right) / 2;
  }

  get centerY(): number {
    return (this.top + this.bottom) / 2;
  }

  contains(x: number, y: number): boolean {
    return (
      x >= this.left && x <= this.right && y >= this.top && y <= this.bottom
    );
  }

  intersects(other: RectF): boolean {
    return (
      this.left < other.right &&
      this.right > other.left &&
      this.top < other.bottom &&
      this.bottom > other.top
    );
  }

  offset(dx: number, dy: number): RectF {
    return new RectF(
      this.left + dx,
      this.top + dy,
      this.right + dx,
      this.bottom + dy
    );
  }

  inflate(delta: number): RectF {
    return new RectF(
      this.left - delta,
      this.top - delta,
      this.right + delta,
      this.bottom + delta
    );
  }
}

/** 矩形并集（SelectionManager.selectedRect 的聚合用） */
export function unionRect(a: RectF, b: RectF): RectF {
  return new RectF(
    Math.min(a.left, b.left),
    Math.min(a.top, b.top),
    Math.max(a.right, b.right),
    Math.max(a.bottom, b.bottom)
  );
}

// ---------- Path2 ----------

/** 路径命令（对标 Kotlin PathCommand  sealed class） */
export type PathCommand2 =
  | { readonly type: 'moveTo'; readonly x: number; readonly y: number }
  | { readonly type: 'lineTo'; readonly x: number; readonly y: number }
  | {
      readonly type: 'quadTo';
      readonly cx: number;
      readonly cy: number;
      readonly x: number;
      readonly y: number;
    }
  | {
      readonly type: 'cubicTo';
      readonly cx1: number;
      readonly cy1: number;
      readonly cx2: number;
      readonly cy2: number;
      readonly x: number;
      readonly y: number;
    }
  | { readonly type: 'close' };

/** 曲线扁平化分段数（二次 / 三次贝塞尔近似成折线的段数） */
const QUAD_SEGMENTS = 12;
const CUBIC_SEGMENTS = 16;

/**
 * 可录制路径（对标 Kotlin Path）：
 * 录制命令序列（无平台对象，可自由重建/拷贝），
 * 回放到 2D context 绘制，或用 [contains] 做纯 JS 命中判定。
 */
export class Path2 {
  /** 实际的路径命令序列（只读视图；修改请用 reset 后重录） */
  readonly commands: readonly PathCommand2[] = [];

  /** 空路径，或只有一个 moveTo（无实际绘制内容） */
  get isEmpty(): boolean {
    return (
      this.commands.length === 0 ||
      (this.commands.length === 1 && this.commands[0].type === 'moveTo')
    );
  }

  /** 最后一个有效命令的终点（Close 不改变当前位置） */
  private get lastPosition(): PointF {
    for (let i = this.commands.length - 1; i >= 0; i--) {
      const c = this.commands[i];
      if (c.type !== 'close') {
        return { x: c.x, y: c.y };
      }
    }
    return { x: 0, y: 0 };
  }

  get lastX(): number {
    return this.lastPosition.x;
  }

  get lastY(): number {
    return this.lastPosition.y;
  }

  moveTo(x: number, y: number): this {
    (this.commands as PathCommand2[]).push({ type: 'moveTo', x, y });
    return this;
  }

  lineTo(x: number, y: number): this {
    (this.commands as PathCommand2[]).push({ type: 'lineTo', x, y });
    return this;
  }

  /** 二次贝塞尔曲线：控制点 (cx, cy)，终点 (x, y) */
  quadTo(cx: number, cy: number, x: number, y: number): this {
    (this.commands as PathCommand2[]).push({ type: 'quadTo', cx, cy, x, y });
    return this;
  }

  /** 三次贝塞尔曲线：两个控制点，终点 (x, y) */
  cubicTo(
    cx1: number,
    cy1: number,
    cx2: number,
    cy2: number,
    x: number,
    y: number
  ): this {
    (this.commands as PathCommand2[]).push({
      type: 'cubicTo',
      cx1,
      cy1,
      cx2,
      cy2,
      x,
      y,
    });
    return this;
  }

  close(): this {
    (this.commands as PathCommand2[]).push({ type: 'close' });
    return this;
  }

  reset(): this {
    (this.commands as PathCommand2[]).length = 0;
    return this;
  }

  /** 回放到 2D context（对标平台端把命令序列翻译成原生 Path 后绘制） */
  applyTo(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    for (const c of this.commands) {
      switch (c.type) {
        case 'moveTo':
          ctx.moveTo(c.x, c.y);
          break;
        case 'lineTo':
          ctx.lineTo(c.x, c.y);
          break;
        case 'quadTo':
          ctx.quadraticCurveTo(c.cx, c.cy, c.x, c.y);
          break;
        case 'cubicTo':
          ctx.bezierCurveTo(c.cx1, c.cy1, c.cx2, c.cy2, c.x, c.y);
          break;
        case 'close':
          ctx.closePath();
          break;
      }
    }
  }

  /**
   * 点 (x, y) 是否落在填充区域内：命令序列扁平化成子路径折线后
   * 按**偶数规则**射线判定（对标 Kotlin pathHitTest 的平台实现，
   * 此处为纯 JS，无 canvas 依赖，node 环境可直接用）。
   */
  contains(x: number, y: number): boolean {
    const polygons = this.flatten();
    let crossings = 0;
    for (const points of polygons) {
      const n = points.length;
      if (n < 2) continue;
      for (let i = 0, j = n - 1; i < n; j = i++) {
        const a = points[i];
        const b = points[j];
        // 半开区间规则：(y1 > py) != (y2 > py)，与顶点/水平边命中无关
        if (a.y > y !== b.y > y) {
          const intersectX = a.x + ((y - a.y) * (b.x - a.x)) / (b.y - a.y);
          if (intersectX > x) crossings++;
        }
      }
    }
    return crossings % 2 === 1;
  }

  /** 扁平化成子路径折线（曲线按固定段数近似；close 隐含回到子路径起点） */
  private flatten(): PointF[][] {
    const polygons: PointF[][] = [];
    let current: PointF[] = [];
    let point: PointF = { x: 0, y: 0 };
    let subStart: PointF = { x: 0, y: 0 };
    for (const c of this.commands) {
      switch (c.type) {
        case 'moveTo':
          if (current.length > 0) polygons.push(current);
          current = [{ x: c.x, y: c.y }];
          point = { x: c.x, y: c.y };
          subStart = point;
          break;
        case 'lineTo': {
          const to = { x: c.x, y: c.y };
          current.push(to);
          point = to;
          break;
        }
        case 'quadTo': {
          const ctrl = { x: c.cx, y: c.cy };
          const to = { x: c.x, y: c.y };
          for (let i = 1; i <= QUAD_SEGMENTS; i++) {
            current.push(quadAt(point, ctrl, to, i / QUAD_SEGMENTS));
          }
          point = to;
          break;
        }
        case 'cubicTo': {
          const c1 = { x: c.cx1, y: c.cy1 };
          const c2 = { x: c.cx2, y: c.cy2 };
          const to = { x: c.x, y: c.y };
          for (let i = 1; i <= CUBIC_SEGMENTS; i++) {
            current.push(cubicAt(point, c1, c2, to, i / CUBIC_SEGMENTS));
          }
          point = to;
          break;
        }
        case 'close':
          // 折线多边形闭合边由射线算法的 j = n-1 回环隐含，无需补点
          point = subStart;
          break;
      }
    }
    if (current.length > 0) polygons.push(current);
    return polygons;
  }
}

/** 二次贝塞尔插值（t ∈ (0, 1]） */
function quadAt(p0: PointF, p1: PointF, p2: PointF, t: number): PointF {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

/** 三次贝塞尔插值（t ∈ (0, 1]） */
function cubicAt(
  p0: PointF,
  p1: PointF,
  p2: PointF,
  p3: PointF,
  t: number
): PointF {
  const u = 1 - t;
  const uu = u * u;
  const tt = t * t;
  return {
    x: uu * u * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + tt * t * p3.x,
    y: uu * u * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + tt * t * p3.y,
  };
}

/**
 * 圆角矩形路径助手（demo/组件常用；Kotlin 侧由各组件自行录制）。
 * 以 moveTo/lineTo/cubicTo 录制四角圆弧（k ≈ 0.5523 近似）。
 */
export function appendRoundedRect(
  path: Path2,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): Path2 {
  const r = Math.max(0, Math.min(radius, Math.min(width, height) / 2));
  const k = 0.5523 * r;
  const right = x + width;
  const bottom = y + height;
  path.moveTo(x + r, y);
  path.lineTo(right - r, y);
  path.cubicTo(right - r + k, y, right, y + r - k, right, y + r);
  path.lineTo(right, bottom - r);
  path.cubicTo(right, bottom - r + k, right - r + k, bottom, right - r, bottom);
  path.lineTo(x + r, bottom);
  path.cubicTo(x + r - k, bottom, x, bottom - r + k, x, bottom - r);
  path.lineTo(x, y + r);
  path.cubicTo(x, y + r - k, x + r - k, y, x + r, y);
  path.close();
  return path;
}
