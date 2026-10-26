import { createSignal } from 'wy-helper';
import { rgba } from '../canvasRender/Draw';
import type { ColorInt } from '../canvasRender/Draw';

/**
 * 核心中性文本默认色（对标 Kotlin TextDefaults）：
 * [WrappedTextNode.color] 与占位符色的取值来源。
 *
 * 核心包不感知具体组件主题（Theme 属组件包）：默认值取原浅色主题数值，
 * 与迁移前逐像素等价；组件包切换主题时经 setter 回写同步，
 * 昼/夜切换自动换肤（信号驱动，读取方随重绘更新）。
 */
const textSignal = createSignal<ColorInt>(rgba(30, 41, 59));
const placeholderSignal = createSignal<ColorInt>(rgba(148, 163, 184));

export const textDefaults = {
  /** 正文默认色（组件主题 text） */
  get text(): ColorInt {
    return textSignal.get();
  },
  set text(value: ColorInt) {
    textSignal.set(value);
  },
  /** 占位符默认色（组件主题 placeholder） */
  get placeholder(): ColorInt {
    return placeholderSignal.get();
  },
  set placeholder(value: ColorInt) {
    placeholderSignal.set(value);
  },
};
