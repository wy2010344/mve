import { alawaysTrue, emptyArray, emptyFun, GetValue } from 'wy-helper';
import { ColorInt, rgba } from '../../canvasCore/Draw';
import { INT_MAX_VALUE } from '../../canvasCore/Paragraph';
import { textDefaults } from '../TextDefaults';
import { Node2Arg } from '../NodeArg';
import type { RichSegment } from './richSegments';

/**
 * 编辑器节点的**参数消息**（没写的由 [editableTextNodeDefaults] 兜底）。
 *
 * 与 ooc 同形：`p = merge $ arg editableTextNodeDefaults`，之后
 * `p text` / `p singleLine` / `p maxLines` 一定答得出来，
 * 节点与编辑器内核都只读 p，不做「有没有传这个成员」的判断。
 *
 * 唯一的派生默认值 `maxLines` 依赖同层的 `singleLine`，所以写成
 * `maxLines(this)` 读 `this singleLine`——ooc 里就是 `this` 回读整条 merge 链。
 */
export interface EditableTextNodeArg extends Partial<Node2Arg> {
  /** 逻辑文本真相源（UTF-16 串）；编辑器写入经 onTextChange 回传 */
  text?: GetValue<string>;
  /** 文本变更回写（编辑器内部改动的唯一出口） */
  onTextChange?: (text: string) => void;
  /** 富文本样式段边界表（普通文本编辑器不传，恒为单段基础样式） */
  segments?: GetValue<readonly RichSegment[]>;
  /** 样式段变更回写（与 onTextChange 分离：不进文本撤销栈） */
  onSegmentsChange?: (segments: readonly RichSegment[]) => void;
  /** 占位文本：逻辑文本为空时显示，不参与编辑与选区 */
  placeholder?: GetValue<string>;
  /** 密码模式：每个字素簇显示为一个圆点 */
  obscure?: GetValue<boolean>;
  /** 单行输入（不折行，溢出时水平跟随光标） */
  singleLine?: GetValue<boolean>;
  /** 最大行数（默认：单行 1 / 多行不限） */
  maxLines?: GetValue<number>;
  /** 提交回调：单行回车 / 多行 Ctrl+Enter 触发 */
  onSubmit?: () => void;
  /** 只读 */
  readOnly?: GetValue<boolean>;
  /**
   * 是否消费 Tab 键插入制表符（仅多行生效）。默认 false —— 保留焦点遍历
   * （表单里 Tab 用来在字段间跳转）。代码编辑器等需要缩进语义时显式开启。
   */
  tabInsert?: GetValue<boolean>;
  /** 撤销历史容量（动作式栈） */
  maxHistorySize?: number;

  // ---- 文本样式（与 wrappedTextNode 同口径） ----
  /** 字体族（null = 系统默认） */
  fontFamily?: GetValue<string | null>;
  /** 字号 */
  fontSize?: GetValue<number>;
  /** 字重 */
  fontWeight?: GetValue<number>;
  /** 斜体 */
  italic?: GetValue<boolean>;
  /** 文字颜色 */
  color?: GetValue<ColorInt>;
  /** 行高倍数 */
  lineHeightMultiplier?: GetValue<number | null>;
  /** 字距 */
  letterSpacing?: GetValue<number>;
  /** 词距 */
  wordSpacing?: GetValue<number>;
  /** 选区高亮色 */
  selectionColor?: GetValue<ColorInt>;
}

/** 参数消息的兜底实现（ooc: 顶层 `editableDefaults = { … }`） */
export const editableTextNodeDefaults = {
  text: (): string => '',
  onTextChange: emptyFun as (text: string) => void,
  placeholder: () => '',
  obscure: () => false,
  singleLine: () => false,
  /** 单行默认 1 行，多行默认不限（`this` 回读整条 merge 链） */
  maxLines(this: { singleLine(): boolean }): number {
    return this.singleLine() ? 1 : INT_MAX_VALUE;
  },
  onSubmit: emptyFun,
  readOnly: () => false,
  tabInsert: () => false,
  maxHistorySize: 100,
  fontFamily: (): string | null => null,
  fontSize: () => 16,
  fontWeight: () => 400,
  italic: () => false,
  color: (): ColorInt => textDefaults.text(),
  lineHeightMultiplier: (): number | null => 1.4,
  letterSpacing: () => 0,
  wordSpacing: () => 0,
  selectionColor: () => rgba(80, 140, 255, 80),
  /** 编辑器默认可聚焦（用户显式传 focusable 时以用户的为准） */
  focusable: alawaysTrue,
  /** 构建设置：与用户传入的 exts 合并 */
  exts: emptyArray as readonly unknown[],
};

/** 合并后的参数对象（`merge(arg, defaults)` 的结果） */
export type EditableParams = EditableTextNodeArg &
  typeof editableTextNodeDefaults;
