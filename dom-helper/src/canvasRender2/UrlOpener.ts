/**
 * 全局链接打开器（对标 Kotlin UrlOpener）：
 * 由各平台宿主注册实现（Web 的 window.open、Desktop 的 browse、
 * Android 的 Intent）。未注册时点击链接静默忽略——
 * 引擎层不持有平台环境（如 Android Context）。
 */
import { emptyFun } from 'wy-helper';

/**
 * 打开器的能力对象（可换实现、可换兜底）。
 *
 * 之所以不存成 `((url) => void) | null` 再 `opener?.(url)`：可选调用是 TS 的
 * "存在性探测"，ooc 没有 optional chaining，也没有 `?.` 语义。改成恒有实现 +
 * `merge` 换实现之后，调用点就是一句普通的发消息，两侧同形。
 */
const openerRef = {
  /** 打开链接；默认静默忽略（未注册平台实现时） */
  open: emptyFun as (url: string) => void,
};

/** 注册 / 清除平台打开实现（传 null 恢复静默忽略）。 */
export function setUrlOpener(open: ((url: string) => void) | null): void {
  openerRef.open = open ?? emptyFun;
}

/** 打开链接；未注册 opener 时静默忽略。 */
export function openUrl(url: string): void {
  openerRef.open(url);
}
