/**
 * 可录制路径（对标 Kotlin Path）：命令序列录制 + 回放，命中测试纯 JS。
 *
 * 与 [./rect] 一样没有 class：`createPath2()` 返回一个对象，命令数组藏在闭包里
 * （ooc 侧对应 `storage ref`）。之所以要「录制」而不是直接用平台 Path：
 * 命令序列是纯数据，可重建、可拷贝、可在 node 环境里做命中测试，
 * 而 `CanvasRenderingContext2D` 的路径无法读出、也离不开浏览器。
 *
 * ```ooc
 * path = createPath2 $;
 * path moveTo 0 0; path lineTo 10 0; ...
 * ```
 */
import type { PointF } from './rect';

/** 路径命令（对标 Kotlin PathCommand sealed class） */
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

/** 录制器对象（所有写方法返回自身，便于链式调用） */
export interface Path2 {
  /** 已录制的命令（只读视图；要改就 reset 后重录） */
  commands(): readonly PathCommand2[];
  /** 空路径，或只有一个 moveTo（无实际绘制内容） */
  isEmpty(): boolean;
  /** 最后一个有效命令的终点横坐标（close 不改变当前位置） */
  lastX(): number;
  /** 最后一个有效命令的终点纵坐标 */
  lastY(): number;
  moveTo(x: number, y: number): Path2;
  lineTo(x: number, y: number): Path2;
  /** 二次贝塞尔：控制点 (cx, cy)，终点 (x, y) */
  quadTo(cx: number, cy: number, x: number, y: number): Path2;
  /** 三次贝塞尔：两个控制点，终点 (x, y) */
  cubicTo(
    cx1: number,
    cy1: number,
    cx2: number,
    cy2: number,
    x: number,
    y: number
  ): Path2;
  close(): Path2;
  reset(): Path2;
  /** 回放到 2D context（对应平台端把命令序列翻成原生 Path 后绘制） */
  applyTo(ctx: CanvasRenderingContext2D): void;
  /** 点是否落在填充区域内（偶数规则 + 曲线扁平化，无 canvas 依赖） */
  contains(x: number, y: number): boolean;
}

/** 构造一个空录制器 */
export function createPath2(): Path2 {
  const commands: PathCommand2[] = [];

  /** 最后一个有效命令的终点（close 不改变当前位置） */
  function lastPosition(): { x: number; y: number } {
    for (let i = commands.length - 1; i >= 0; i--) {
      const c = commands[i];
      if (c.type !== 'close') {
        return { x: c.x, y: c.y };
      }
    }
    return { x: 0, y: 0 };
  }

  /** 扁平化成子路径折线（曲线按固定段数近似；close 隐含回到子路径起点） */
  function flatten(): PointF[][] {
    const polygons: PointF[][] = [];
    let current: PointF[] = [];
    let point: PointF = { x: 0, y: 0 };
    let subStart: PointF = { x: 0, y: 0 };
    for (const c of commands) {
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

  const path: Path2 = {
    commands: () => commands,
    isEmpty() {
      return (
        commands.length === 0 ||
        (commands.length === 1 && commands[0].type === 'moveTo')
      );
    },
    lastX() {
      return lastPosition().x;
    },
    lastY() {
      return lastPosition().y;
    },
    moveTo(x, y) {
      commands.push({ type: 'moveTo', x, y });
      return path;
    },
    lineTo(x, y) {
      commands.push({ type: 'lineTo', x, y });
      return path;
    },
    quadTo(cx, cy, x, y) {
      commands.push({ type: 'quadTo', cx, cy, x, y });
      return path;
    },
    cubicTo(cx1, cy1, cx2, cy2, x, y) {
      commands.push({ type: 'cubicTo', cx1, cy1, cx2, cy2, x, y });
      return path;
    },
    close() {
      commands.push({ type: 'close' });
      return path;
    },
    reset() {
      commands.length = 0;
      return path;
    },
    applyTo(ctx) {
      ctx.beginPath();
      for (const c of commands) {
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
    },
    contains(x, y) {
      const polygons = flatten();
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
    },
  };
  return path;
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
