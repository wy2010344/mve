import type { GetValue, PointKey, StoreRef } from 'wy-helper';
import { createSignal, storeRef } from 'wy-helper';
import type { ColorInt } from '../canvasCore/Draw';
import { colorToCSS, rgba } from '../canvasCore/Draw';
import { roundRectPath } from '../canvasCore/Draw';
import {
  absolutePosition,
  fc,
  getPadding,
  innerSize,
  layoutSize,
  merge,
  node2,
} from './Node';
import type { MouseEvent2, Node2 } from './Node';
import type { Node2Arg } from './NodeArg';
import { globalMouse2Context } from './tree/globalMouse';
import type { Scroll2 } from './Scroll';
import { contentSize, maxScroll, scrollWheel } from './Scroll';

/**
 * 浮层滚动条样式。默认值对照 macOS 系统浮层滚动条：
 * 无轨道、圆角胶囊滑块、静止时半透明、悬停加粗、停止滚动后自动淡出。
 *
 * 与 Kotlin `helper/OverlayScrollBar.kt` 的 `ScrollBarStyle` 逐字段对齐
 * （那边还多了 fadeInMs / fadeOutMs 两个动画时长）。
 */
export interface ScrollBarStyle2 {
  /** 静止时滑块粗细 */
  width: number;
  /** 悬停 / 拖拽时的滑块粗细 */
  widthHover: number;
  /** 贴边可交互感应带宽度（比滑块宽，便于命中） */
  hitWidth: number;
  /** 滑块与容器边缘的留白 */
  edgeGap: number;
  /** 轨道两端留白，滑块不会顶到容器圆角上 */
  trackInset: number;
  /** 滑块最小长度（避免内容极长时滑块细成一条线） */
  minThumb: number;
  /** 滑块基色（alpha 由下面几档单独控制） */
  thumb: ColorInt;
  /** 静止态不透明度 */
  idleAlpha: number;
  /** 悬停态不透明度 */
  hoverAlpha: number;
  /** 拖拽态不透明度 */
  dragAlpha: number;
  /** 停止滚动后多久开始淡出 */
  idleDelayMs: number;
  /** 淡入时长（毫秒） */
  fadeInMs: number;
  /** 淡出时长（毫秒） */
  fadeOutMs: number;
}

/** 默认样式（即 macOS 观感那一组数值） */
export const overlayScrollBarStyle: ScrollBarStyle2 = {
  width: 6,
  widthHover: 10,
  hitWidth: 12,
  edgeGap: 3,
  trackInset: 4,
  minThumb: 28,
  thumb: rgba(15, 23, 42),
  idleAlpha: 0.3,
  hoverAlpha: 0.45,
  dragAlpha: 0.62,
  idleDelayMs: 850,
  fadeInMs: 110,
  fadeOutMs: 320,
};

/** 浮层滚动条的参数消息（没写的由 [overlayScrollBarDefaults] 兜底） */
export interface OverlayScrollBarArg extends Partial<Node2Arg> {
  /** 滚动状态 */
  scroll: Scroll2;
  /** 观感参数（默认 [overlayScrollBarStyle]） */
  style?: GetValue<ScrollBarStyle2>;
}

/** 参数消息的兜底实现 */
export const overlayScrollBarDefaults = {
  style: (): ScrollBarStyle2 => overlayScrollBarStyle,
};

/** 只换 alpha 通道，保留 RGB（ColorInt 是 0xAARRGGBB） */
function withAlpha(color: ColorInt, alpha: number): ColorInt {
  const a = Math.round(Math.min(Math.max(alpha, 0), 1) * 255);
  return (((a & 0xff) << 24) | (color & 0x00ffffff)) >>> 0;
}

function now(): number {
  return typeof performance === 'undefined' ? Date.now() : performance.now();
}

/**
 * 0→1 淡入淡出的最小实现。
 *
 * 有 `requestAnimationFrame` 就逐帧插值，没有（node 冒烟 / SSR）就直接跳终值——
 * 所以共用层不依赖任何动画框架，ooc 侧换成自己的帧回调即可。
 */
function createFade(get: GetValue<number>, set: (v: number) => void) {
  const canAnimate =
    typeof requestAnimationFrame === 'function' &&
    typeof cancelAnimationFrame === 'function';
  let raf = 0;
  function stop() {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }
  function to(target: number, ms: number) {
    stop();
    const from = get();
    if (from === target) return;
    if (!canAnimate || ms <= 0) {
      set(target);
      return;
    }
    const start = now();
    const span = target - from;
    const step = () => {
      const t = Math.min(1, (now() - start) / ms);
      set(from + span * t);
      raf = t < 1 ? requestAnimationFrame(step) : 0;
    };
    raf = requestAnimationFrame(step);
  }
  return { to, stop };
}

/** 滑块几何（与 Kotlin `OverlayScrollBar.ThumbGeo` 同形） */
interface ThumbGeo2 {
  offset: number;
  length: number;
  maxOffset: number;
  maxScroll: number;
}

/**
 * macOS 风格浮层滚动条（对标 Kotlin `helper/OverlayScrollBar`）。
 *
 * 与 [scrollBar]（传统占位式）的区别：
 * - **不占布局空间**：两轴尺寸恒为 0，浮在内容之上绘制，内容区拿满可用尺寸；
 *   传统滚动条要吃掉 10px 布局宽度，右侧内容被挤压。
 * - **自动隐藏**：静止时完全透明，滚动时淡入，停手 `idleDelayMs` 后淡出；
 *   指针移到贴边感应带时也浮现（悬停态）。
 * - **无轨道**：只有一枚半透明胶囊。
 * - **静止时不拦指针**：`acceptHit` 只在可见时成立，静止时点击可穿透到内容。
 * - **拖拽 / 点击翻页**：拖滑块按 `maxScroll / maxOffset` 换算；点空白整页滚动。
 *
 * 几何全部由容器的 `innerSize / contentSize / maxScroll` 推导，不含写死像素位置。
 *
 * 用法（容器内，与 scrollContent 并列）：
 * `nodeOf(node => overlayScrollBar({ scroll, nodeRef: node }))(ctx)`
 */
export const overlayScrollBar = fc(function (ctx, arg: OverlayScrollBarArg) {
  const ref = arg.nodeRef ?? storeRef(undefined!);
  const p = merge(arg, overlayScrollBarDefaults);
  const d = p.scroll.direction;

  // ---------- 可见性三态（都是信号，绘制期读取、副作用期写入） ----------
  /** 淡入淡出进度 0~1 */
  const fade = createSignal(0);
  /** 指针是否在贴边感应带内 */
  const hovering = createSignal(false);
  const dragging = createSignal(false);

  const fadeTo = createFade(fade.get, fade.set);
  let hideTimer: ReturnType<typeof setTimeout> | undefined;

  /** 安排淡出：重复调用会刷新计时（滚动过程中计时一直被推后 = 停手才开始倒数） */
  function scheduleHide() {
    if (hideTimer !== undefined) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      hideTimer = undefined;
      if (!dragging.get()) fadeTo.to(0, p.style().fadeOutMs);
    }, p.style().idleDelayMs);
  }
  /** 浮现并重新开始倒数 */
  function reveal() {
    if (dragging.get()) return;
    if (fade.get() < 1) fadeTo.to(1, p.style().fadeInMs);
    scheduleHide();
  }
  /** 拖拽 / 悬停时恒为 1——与 Kotlin `currentAlpha` 一致（fade 只管滚动引起的浮现） */
  function alphaOf(): number {
    return dragging.get() || hovering.get() ? 1 : fade.get();
  }

  const offActivity = p.scroll.addActivityListener(reveal);
  ctx.addDestroy(() => {
    offActivity();
    if (hideTimer !== undefined) clearTimeout(hideTimer);
    fadeTo.stop();
  });

  // 悬停判定走**全局指针位置**而不是命中链：
  // 静止时 acceptHit 为 false、不在命中链上，靠命中链永远唤不出来。
  const g = ctx.consume(globalMouse2Context);
  if (g) {
    const offMove = g.registerMouseMove((x, y) => {
      const v = inBand(x, y);
      if (v === hovering.get()) return;
      hovering.set(v);
      if (v) reveal();
      else scheduleHide();
    });
    ctx.addDestroy(offMove);
  }

  /** 滚动容器 = 本节点的父节点（与 scrollContent 同一个容器） */
  function containerOf(): Node2 | undefined {
    // 父链上的消息集是 Node2Parent（最小集），这里必然是完整 Node2
    return ref.get().parent as Node2 | undefined;
  }

  /** 容器内容盒在滚动轴上的长度（滑块行程的参照） */
  function viewportLength(): number {
    const c = containerOf();
    return c ? innerSize(c, d) : 0;
  }

  /** 指针是否落在贴边感应带内（入参是画布坐标） */
  function inBand(px: number, py: number): boolean {
    const self = ref.get() as Node2 | undefined;
    const c = containerOf();
    if (!self || !c) return false;
    // 不可滚动时没有感应带可言
    const st = p.style();
    const len = innerSize(c, d);
    if (len <= 0 || !geoOf()) return false;
    const bx = absolutePosition(self, 'x');
    const by = absolutePosition(self, 'y');
    if (d === 'y') {
      return px >= bx && px <= bx + st.hitWidth && py >= by && py <= by + len;
    }
    return py >= by && py <= by + st.hitWidth && px >= bx && px <= bx + len;
  }

  /** 滑块几何；容器缺失或不可滚动时返回 null */
  function geoOf(): ThumbGeo2 | null {
    const c = containerOf();
    if (!c) return null;
    const st = p.style();
    const full = innerSize(c, d);
    const viewport = full - st.trackInset * 2;
    if (viewport <= 0) return null;
    const content = contentSize(c, d);
    const m = maxScroll(c, d);
    if (m <= 0 || content <= 0) return null;
    const length = Math.min(
      Math.max(st.minThumb, (viewport * full) / content),
      viewport
    );
    const maxOffset = Math.max(0, viewport - length);
    const offset =
      maxOffset > 0
        ? Math.min(Math.max((maxOffset * p.scroll.value()) / m, 0), maxOffset)
        : 0;
    return { offset, length, maxOffset, maxScroll: m };
  }

  /** 贴在容器内容盒的右缘（纵向）/ 下缘（横向） */
  function positionOf(axis: PointKey): number {
    const c = containerOf();
    if (!c) return 0;
    const st = p.style();
    if (d === 'y') {
      return axis === 'x'
        ? getPadding(c, 'x', 'start') + innerSize(c, 'x') - st.hitWidth
        : getPadding(c, 'y', 'start');
    }
    return axis === 'y'
      ? getPadding(c, 'y', 'start') + innerSize(c, 'y') - st.hitWidth
      : getPadding(c, 'x', 'start');
  }

  function startDrag(e: MouseEvent2, c: ThumbGeo2) {
    if (!g || c.maxOffset <= 0) return;
    const vertical = d === 'y';
    const startValue = p.scroll.value();
    const startPointer = vertical ? e.globalY : e.globalX;
    dragging.set(true);
    if (hideTimer !== undefined) {
      clearTimeout(hideTimer);
      hideTimer = undefined;
    }
    fadeTo.to(1, 0);
    const offMove = g.registerMouseMove((x, y) => {
      const pointer = vertical ? y : x;
      p.scroll.setValue(
        startValue + ((pointer - startPointer) * c.maxScroll) / c.maxOffset
      );
    });
    const offUp = g.registerMouseUp(() => {
      offMove();
      offUp();
      dragging.set(false);
      scheduleHide();
    });
  }

  node2(
    merge(
      {
        // 句柄经 arg.nodeRef 入场，node2 负责 ref.set(node)（对齐旧 tfc 的 node2.create(...)(ref)）
        nodeRef: ref,
        // 浮层：两个方向都不占布局空间，内容区拿满可用尺寸
        size: () => layoutSize(0, true),
        position: positionOf,
        // 指针落在滚动条上滚轮也该滚
        mouseWheel: scrollWheel(p.scroll),
        // 滚动条不是内容，不参与焦点遍历与文本选择
        focusable: () => false,
        selectionEnabled: () => false,
        acceptHit(x: number, y: number): boolean {
          if (!geoOf()) return false;
          // 只有"看得见"时才拦截指针：静止态让点击穿透到内容
          if (alphaOf() <= 0.02) return false;
          const st = p.style();
          return d === 'y'
            ? x >= 0 && x <= st.hitWidth
            : y >= 0 && y <= st.hitWidth;
        },
        mouseDown(e: MouseEvent2) {
          const c = geoOf();
          if (!c) return;
          const st = p.style();
          const vertical = d === 'y';
          // 局部坐标里滑块起点是 trackInset + offset
          const local = vertical ? e.y : e.x;
          const pos = local - st.trackInset;
          if (pos >= c.offset && pos <= c.offset + c.length) {
            startDrag(e, c);
          } else {
            // 点轨道空白处：整页滚动
            const dir = pos < c.offset ? -1 : 1;
            p.scroll.scroll(
              dir * Math.max(viewportLength() - st.trackInset * 2, 40) * 0.9
            );
          }
          e.stopPropagation();
        },
        draw(ctx2: CanvasRenderingContext2D) {
          const c = geoOf();
          if (!c) return;
          const alpha = alphaOf();
          if (alpha <= 0.004) return;
          const st = p.style();
          const vertical = d === 'y';
          const expanded = dragging.get() || hovering.get();
          const w = expanded ? st.widthHover : st.width;
          const base = dragging.get()
            ? st.dragAlpha
            : hovering.get()
              ? st.hoverAlpha
              : st.idleAlpha;
          ctx2.fillStyle = colorToCSS(withAlpha(st.thumb, base * alpha));
          // 胶囊：贴边留白 edgeGap，两端留白 trackInset
          const along = st.trackInset + c.offset;
          const across = st.hitWidth - st.edgeGap - w;
          if (vertical) {
            roundRectPath(ctx2, across, along, w, c.length, w / 2);
          } else {
            roundRectPath(ctx2, along, across, c.length, w, w / 2);
          }
          ctx2.fill();
        },
      },
      p
    )
  )(ctx);
});
