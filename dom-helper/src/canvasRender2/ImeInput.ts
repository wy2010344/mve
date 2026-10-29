import { clipboardSetText } from './Clipboard';
import type { EditableTextHandle } from './Focus';

/**
 * 离屏 textarea：canvas 自身收不到键盘与输入法，借它承接（对标 Kotlin 的
 * `ComposingTextHandler` + `EngineGlobal.requestInputOverlay`）。
 *
 * 这里只做**宿主绑定**（DOM 元素、输入法事件、真实焦点归属），
 * 树的逻辑一律不碰——所以 ooc 侧对应自己的宿主实现即可，不必照搬本文件。
 */

export interface ImeInputOptions {
  canvas: HTMLCanvasElement;
  /** 当前活跃编辑器（输入法 / 剪贴板的路由目标） */
  activeEditor(): EditableTextHandle | undefined;
  /** 画布内是否有焦点节点（决定 blur 后是否把真实焦点交回 canvas） */
  hasFocus(): boolean;
  /** 键盘路由（组合进行中由本模块直接丢弃，不转交） */
  handleKey(event: KeyboardEvent): void;
}

export interface ImeInput {
  /** 输入法组合进行中：键盘归输入法独占 */
  isComposing(): boolean;
  /** 焦点转移后同步真实 DOM 焦点：有编辑器则 textarea 接管（接 IME），否则交回 canvas */
  sync(): void;
  /** 每帧绘制后把 textarea 挪到光标处，输入法候选框才会跟随 */
  position(): void;
  /** 真实焦点被抓回 canvas 时兜底还给 textarea */
  reclaim(): void;
  /** IME textarea 本体（Renderer 判断点击是否落在输入框上） */
  textarea(): HTMLTextAreaElement | null;
  destroy(): void;
}

export function createImeInput(options: ImeInputOptions): ImeInput {
  const { canvas } = options;
  const listeners: Array<() => void> = [];
  let textarea: HTMLTextAreaElement | null = null;
  let composing = false;

  function ensure(): HTMLTextAreaElement | null {
    if (textarea) return textarea;
    if (typeof document === 'undefined') return null;
    const ta = document.createElement('textarea');
    // node / SSR 垫片里 createElement 可能返回不完整对象：拿不到 setAttribute 就放弃 IME
    if (!ta || typeof ta.setAttribute !== 'function') return null;
    ta.setAttribute('autocapitalize', 'off');
    ta.setAttribute('autocomplete', 'off');
    ta.setAttribute('autocorrect', 'off');
    ta.setAttribute('spellcheck', 'false');
    // 与旧版 canvasRender 一致：透明、不可交互、但可被聚焦（接输入法组合串）
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    ta.style.pointerEvents = 'none';
    ta.style.resize = 'none';
    ta.style.border = 'none';
    ta.style.outline = 'none';
    ta.style.background = 'transparent';
    ta.style.overflow = 'hidden';
    ta.style.whiteSpace = 'pre';
    ta.style.fontFamily = 'sans-serif';
    ta.style.width = '1px';
    ta.style.height = '1px';
    ta.style.padding = '0';
    document.body?.appendChild(ta);
    textarea = ta;

    const onKeyDown = (event: KeyboardEvent) => options.handleKey(event);
    // 组合开始：缓冲归零，避免上一轮残留串混入
    const onCompositionStart = () => {
      composing = true;
      ta.value = '';
    };
    const onCompositionUpdate = (event: CompositionEvent) => {
      const editor = options.activeEditor();
      if (!editor) return;
      // textarea.value 是当前预编辑串（含候选未上屏部分），event.data 兜底
      const t = ta.value || event.data || '';
      editor.onComposing(t, ta.selectionStart ?? 0);
    };
    const onCompositionEnd = (event: CompositionEvent) => {
      composing = false;
      const editor = options.activeEditor();
      const finalText = event.data ?? ta.value ?? '';
      if (editor) editor.commitComposingText(finalText);
      ta.value = '';
    };
    const onInput = (event: Event) => {
      // 非组合输入由 keydown 路由（handleKey 已 preventDefault），此处只清缓冲
      if ((event as InputEvent).isComposing) return;
      ta.value = '';
    };
    const onPaste = (event: ClipboardEvent) => {
      const editor = options.activeEditor();
      if (!editor) return;
      event.preventDefault();
      const data = event.clipboardData?.getData('text') ?? '';
      if (!data) return;
      clipboardSetText(data);
      editor.paste();
    };
    const onCopyCut = (event: ClipboardEvent) => {
      const editor = options.activeEditor();
      if (!editor) return;
      event.preventDefault();
      if (event.type === 'cut') editor.cut();
      else editor.copy();
    };
    ta.addEventListener('keydown', onKeyDown);
    ta.addEventListener('compositionstart', onCompositionStart);
    ta.addEventListener('compositionupdate', onCompositionUpdate);
    ta.addEventListener('compositionend', onCompositionEnd);
    ta.addEventListener('input', onInput);
    ta.addEventListener('paste', onPaste);
    ta.addEventListener('copy', onCopyCut);
    ta.addEventListener('cut', onCopyCut);
    listeners.push(() => {
      ta.removeEventListener('keydown', onKeyDown);
      ta.removeEventListener('compositionstart', onCompositionStart);
      ta.removeEventListener('compositionupdate', onCompositionUpdate);
      ta.removeEventListener('compositionend', onCompositionEnd);
      ta.removeEventListener('input', onInput);
      ta.removeEventListener('paste', onPaste);
      ta.removeEventListener('copy', onCopyCut);
      ta.removeEventListener('cut', onCopyCut);
      ta.remove();
      textarea = null;
    });
    return ta;
  }

  function position() {
    const ta = textarea;
    if (!ta) return;
    const editor = options.activeEditor();
    // 光标位置是编辑器句柄的必答消息（没有光标时返回 null）
    const overlay = editor ? editor.inputOverlay() : null;
    if (!overlay) return;
    const rect =
      typeof canvas.getBoundingClientRect === 'function'
        ? canvas.getBoundingClientRect()
        : null;
    if (!rect) return;
    ta.style.left = `${rect.left + overlay.x}px`;
    ta.style.top = `${rect.top + overlay.y}px`;
    ta.style.width = `${Math.max(1, overlay.w)}px`;
    ta.style.height = `${Math.max(1, overlay.h)}px`;
    ta.style.fontSize = `${overlay.fontSize}px`;
  }

  function sync() {
    const editor = options.activeEditor();
    if (editor) {
      const ta = ensure();
      if (!ta) return;
      position();
      if (typeof document !== 'undefined' && document.activeElement !== ta) {
        ta.focus({ preventScroll: true });
      }
      return;
    }
    if (typeof document === 'undefined') return;
    if (document.activeElement === textarea) {
      textarea?.blur();
    }
    // 焦点还在画布内但不再是编辑器：把真实焦点交回 canvas，
    // 否则 canvas 收不到 keydown（Tab 到按钮后键盘就失灵了）
    if (
      options.hasFocus() &&
      document.activeElement !== canvas &&
      typeof (canvas as { focus?: unknown }).focus === 'function'
    ) {
      canvas.focus({ preventScroll: true });
    }
  }

  return {
    isComposing: () => composing,
    sync,
    position,
    reclaim() {
      if (options.activeEditor()) sync();
    },
    textarea: () => textarea,
    destroy() {
      listeners.forEach(run => run());
    },
  };
}
