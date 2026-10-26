/**
 * 剪贴板：跨节点拖选复制 / 编辑器 cut·copy·paste 的文本内容落点。
 *
 * 两套 API 并存，因为两套树对"何时读剪贴板"的模型不同（原先各写了一份，
 * 且两份语义已经分叉，此处按语义分名保留，行为均与原来一致）：
 *
 * - **同步内存 API**（`clipboardSetText` / `clipboardGetText`）：
 *   模块级单一字符串缓冲即真相源，系统剪贴板只做尽力回写。
 *   编辑器在同步按键流里取用，不能 await，canvasRender2 走这条。
 *
 * - **异步系统 API**（`clipboardSetTextAsync` / `clipboardGetTextAsync`）：
 *   以系统剪贴板为准，写入失败回退 `document.execCommand('copy')`。
 *   canvasRender 走这条。
 *
 * 对标 Kotlin `clipboardSetText` / `clipboardGetText`。
 */

let buffer = '';

/** 写入剪贴板：同步落内存缓冲，并尽力同步到系统剪贴板 */
export function clipboardSetText(text: string): void {
  buffer = text;
  try {
    const nav = (globalThis as any).navigator;
    nav?.clipboard?.writeText?.(text).catch?.(() => {});
  } catch {
    // 忽略：非安全上下文或权限不足时仅保留内存缓冲
  }
}

/** 读取剪贴板：同步返回内存缓冲（系统剪贴板为异步，无法在同步按键流中等待） */
export function clipboardGetText(): string {
  return buffer;
}

/** 读取系统剪贴板；不可用 / 无权限时返回 null */
export async function clipboardGetTextAsync(): Promise<string | null> {
  try {
    if (navigator.clipboard?.readText) {
      return await navigator.clipboard.readText();
    }
  } catch (err) {
    console.error('读取剪贴板失败', err);
  }
  return null;
}

/** 写入系统剪贴板；`navigator.clipboard` 不可用时回退到离屏 textarea + execCommand */
export async function clipboardSetTextAsync(text: string): Promise<void> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch (err) {
    console.error('写入剪贴板失败，回退到 execCommand', err);
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
  } finally {
    document.body.removeChild(textarea);
  }
}
