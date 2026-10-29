import { CanvasKit, CanvasKitInitOptions } from 'canvaskit-wasm';
import { createSignal, queueTasks } from 'wy-helper';

const canvasKit = createSignal<CanvasKit | undefined>(undefined);

export const getCanvasKit = canvasKit.get;

function loadScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`加载 CanvasKit 失败: ${url}`));
    document.head.appendChild(script);
  });
}

declare global {
  interface Window {
    CanvasKitInit?: (opts?: CanvasKitInitOptions) => Promise<CanvasKit>;
  }
}

async function loadFromUrl(url: string): Promise<CanvasKit> {
  if (typeof document == 'undefined') {
    throw new Error(
      '非浏览器环境无法通过 script 标签加载 CanvasKit，请通过 configureCanvasKit({ load }) 自定义加载方式'
    );
  }
  if (!window.CanvasKitInit) {
    await loadScript(url);
  }
  const init = window.CanvasKitInit;
  if (!init) {
    throw new Error(
      `加载 CanvasKit 失败：脚本未暴露 CanvasKitInit，url: ${url}`
    );
  }
  const dir = url.slice(0, url.lastIndexOf('/') + 1);
  return init({ locateFile: file => dir + file });
}

/**
 * 可能反复尝试加载
 */
export const loadCanvasKit = queueTasks(async function (
  url: string,
  force?: boolean
) {
  if (force || !getCanvasKit()) {
    const g = await loadFromUrl(url);
    canvasKit.set(g);
  }
});
