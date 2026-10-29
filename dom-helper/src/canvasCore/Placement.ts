/**
 * 浮层相对锚点的放置（对标 Kotlin `helper/Placement.kt`）。
 *
 * 纯几何：只吃矩形与方向，吐坐标，不碰节点、不碰信号——所以两套树
 * （canvasRender / canvasRender2）共用一份，搬到 ooc / Rust 也是同一段算法。
 */

/**
 * 放置方向（8 方向）。
 *
 * 命名 = 主轴侧 + 对齐端：`BottomStart` 表示"锚点下方、起始边对齐"，
 * `RightEnd` 表示"锚点右侧、结束边对齐"。默认 `BottomStart`
 * 即 Dropdown / Popover 的传统行为。
 */
export type Placement =
  | 'BottomStart'
  | 'BottomEnd'
  | 'TopStart'
  | 'TopEnd'
  | 'LeftStart'
  | 'LeftEnd'
  | 'RightStart'
  | 'RightEnd';

/** 参与放置计算的矩形（左上角 + 宽高） */
export interface PlacementRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 参与放置计算的尺寸 */
export interface PlacementSize {
  width: number;
  height: number;
}

/** 主轴是否为纵向（上下） */
export function placementIsVertical(p: Placement): boolean {
  return p === 'BottomStart' || p === 'BottomEnd' || p === 'TopStart' || p === 'TopEnd';
}

/** 首选主轴侧是否为"正方向"（下 / 右） */
function preferredFirst(p: Placement): boolean {
  return (
    p === 'BottomStart' ||
    p === 'BottomEnd' ||
    p === 'RightStart' ||
    p === 'RightEnd'
  );
}

/** 对齐端：End 对齐锚点结束边（右 / 下） */
function alignEnd(p: Placement): boolean {
  return p === 'BottomEnd' || p === 'TopEnd' || p === 'LeftEnd' || p === 'RightEnd';
}

/**
 * 锚矩形 → 面板坐标（均为浮层根节点内的相对坐标），带空间不足自动回退。
 *
 * @param p 放置方向
 * @param anchor 锚矩形（浮层根内相对坐标）
 * @param panel 面板尺寸
 * @param viewport 视口尺寸（浮层根节点 outer 尺寸）；**<= 0 视为未测量**
 *                 （离屏 / 测试环境），此时只出首选位：不翻转、不 clamp
 * @param gap 面板与锚点在主轴上的间距
 *
 * 回退规则（判据只读锚 / 面板 / 视口几何，不含 x/y 自身迭代量，两次调用幂等）：
 * 1. 首选侧放不下（含 gap）且对侧放得下 → 翻转到对侧；
 * 2. 双侧都放不下 → 保持首选侧，再贴视口边 clamp；
 * 3. 对齐轴越界（align 端超出视口）→ 同样 clamp 贴边。
 */
export function resolvePlacement(
  p: Placement,
  anchor: PlacementRect,
  panel: PlacementSize,
  viewport: PlacementSize,
  gap: number
): { x: number; y: number } {
  const vertical = placementIsVertical(p);
  const first = preferredFirst(p);
  const end = alignEnd(p);
  const { x: ax, y: ay, width: aw, height: ah } = anchor;
  const pw = panel.width;
  const ph = panel.height;

  // 首选位（不依赖视口）
  let x = vertical
    ? end
      ? ax + aw - pw
      : ax
    : first
      ? ax + aw + gap
      : ax - pw - gap;
  let y = vertical
    ? first
      ? ay + ah + gap
      : ay - ph - gap
    : end
      ? ay + ah - ph
      : ay;

  // 视口无效（未测量）：直接返回首选位，保持旧实现的静态定位行为
  if (viewport.width <= 0 || viewport.height <= 0) {
    return { x, y };
  }

  // 首选侧放得下 → 首选；放不下且对侧放得下 → 翻转；双侧不足 → 保持首选（随后 clamp）
  if (vertical) {
    const fitsBelow = ay + ah + gap + ph <= viewport.height;
    const fitsAbove = ay - gap - ph >= 0;
    y = preferredSide(first, fitsBelow, fitsAbove)
      ? ay + ah + gap
      : ay - ph - gap;
  } else {
    const fitsRight = ax + aw + gap + pw <= viewport.width;
    const fitsLeft = ax - gap - pw >= 0;
    x = preferredSide(first, fitsRight, fitsLeft)
      ? ax + aw + gap
      : ax - pw - gap;
  }

  // 贴边 clamp（含对齐轴越界）
  x = clamp01(x, Math.max(0, viewport.width - pw));
  y = clamp01(y, Math.max(0, viewport.height - ph));
  return { x, y };
}

/**
 * 主轴落位裁决：是否落在"正方向"一侧（下 / 右）。
 *
 * @param first 首选侧是否为正方向
 * @param fitsPositive 首选侧放得下
 * @param fitsNegative 对侧放得下
 *
 * 三分支与 Kotlin 的 `when` 一一对应（写平是为了让 ooc 侧照抄时不必翻译嵌套三元）：
 * 首选能放就放首选；首选放不下但对侧能放就翻过去；两边都放不下就保持首选（随后 clamp 贴边）。
 */
function preferredSide(
  first: boolean,
  fitsPositive: boolean,
  fitsNegative: boolean
): boolean {
  if (first && fitsPositive) return true;
  if (first && fitsNegative) return false;
  if (!first && !fitsNegative && fitsPositive) return true;
  return first;
}

function clamp01(v: number, max: number): number {
  return Math.min(Math.max(v, 0), max);
}
