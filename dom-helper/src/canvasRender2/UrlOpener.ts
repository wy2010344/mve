/**
 * 全局链接打开器（对标 Kotlin UrlOpener）：
 * 由各平台宿主注册实现（Web 的 window.open、Desktop 的 browse、
 * Android 的 Intent）。未注册时点击链接静默忽略——
 * 引擎层不持有平台环境（如 Android Context）。
 */
let opener: ((url: string) => void) | null = null;

/** 注册 / 清除平台打开实现（传 null 恢复静默忽略）。 */
export function setUrlOpener(open: ((url: string) => void) | null): void {
  opener = open;
}

/** 打开链接；未注册 opener 时静默忽略。 */
export function openUrl(url: string): void {
  opener?.(url);
}
