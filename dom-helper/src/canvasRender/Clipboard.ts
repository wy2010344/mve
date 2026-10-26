/**
 * 剪贴板 —— 实现已抽到 `canvasCore/Clipboard`，两套树共用一份。
 *
 * 本目录（canvasRender）的编辑器以**系统剪贴板**为准，因此转发到异步 API；
 * `canvasRender2` 走同步内存 API。两者语义与签名都不同，故 core 里分名并存。
 */
export {
  clipboardGetTextAsync as clipboardGetText,
  clipboardSetTextAsync as clipboardSetText,
} from '../canvasCore/Clipboard';
