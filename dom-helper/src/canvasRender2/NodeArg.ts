import { LayoutFun, PointKey } from 'wy-helper';
import {
  CursorType2,
  Fc,
  LayoutSize,
  MouseEvent2,
  Node2,
  Node2Messages,
  StartEnd,
} from './tree/protocol';

export interface LayoutDirection2 {
  layout(d: PointKey): LayoutFun<Node2>;
}
/**
 * 消息契约整组收到协议层（`tree/protocol.ts`），这里只重新导出，
 * 老导入方（`tree/messages` / `tree/assemble` / `editable/params`）无需改路径。
 */
export type { Node2Messages } from './tree/protocol';

/**
 * 构建设置：由工厂自己消费，**不进入消息对象 p**。
 *
 * 与消息分开的原因：`children` / `exts` / `layout` 不是「节点会转发的消息」，
 * 而是装配期的一次性配置。混进 p 会让它们随着「节点 merge p」漏到节点字段上
 * （尤其是 exts —— 它必须只经 `findExt` 一个消息暴露）。
 */
export interface Node2Config {
  children: readonly Fc[];
  /** 节点扩展（grow/align/selectable/scroll-content 等），经 `findExt` 识别 */
  exts: readonly unknown[];
  layout: LayoutDirection2;
}

/** 工厂入参：消息契约 + 构建设置 */
export interface Node2Arg extends Node2Messages, Node2Config {}
