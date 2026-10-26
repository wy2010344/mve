/**
 * 剪贴板 —— 实现已抽到 `canvasCore/Clipboard`，两套树共用一份。
 *
 * 本目录（canvasRender2）的编辑器在同步按键流里取用，走**同步内存 API**；
 * `canvasRender` 走异步系统剪贴板 API。两者语义与签名都不同，core 里分名并存。
 */
export { clipboardGetText, clipboardSetText } from '../canvasCore/Clipboard';
