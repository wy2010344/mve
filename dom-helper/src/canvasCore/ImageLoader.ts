import type { PlatformImage } from './Image';
import { decodeImage } from './Image';

/**
 * 图片异步加载薄层：负责「取字节 → 解码 → 结果回调 + 去重缓存」。
 *
 * 对标 Kotlin `ImageLoader.kt`，三条约束同样成立：
 * - 引擎不持有平台网络环境：取字节实现由宿主注入（默认给浏览器 fetch，
 *   可 [setFetcher] 换成 OkHttp / 协程 / 缓存代理等任意异步策略）；
 * - [ImageFetcher] 必须**恰好回调一次** onBytes；
 * - 同一 URL 并发 / 重复请求只 fetch 一次：命中缓存立即回调，
 *   正在加载则排队复用本次结果；解码失败**不缓存**，下次重新取字节重试。
 *
 * 与 Kotlin 的差别只有一处：Skia 侧解码是同步的，浏览器侧 [decodeImage] 是
 * Promise，所以这里在拿到字节后 `.then` 解码再结算——对外仍是回调形态。
 */

export type ImageBytes = Uint8Array | ArrayBuffer;

/** 平台宿主注入的取字节实现：必须恰好回调一次 onBytes（失败传 null） */
export type ImageFetcher = (
  url: string,
  onBytes: (bytes: ImageBytes | null) => void
) => void;

export interface ImageLoader {
  /** 发起加载：异步取字节并解码后回调（成功为图片，失败 / 未注入 fetcher 为 null） */
  load(url: string, onImage: (image: PlatformImage | null) => void): void;
  /** 替换取字节实现；传 null 表示不加载（回调 null） */
  setFetcher(fetcher: ImageFetcher | null): void;
  /** 清空内存缓存（不影响进行中的请求） */
  clearCache(): void;
}

/** 默认取字节实现：浏览器 fetch（非浏览器环境返回 null） */
export const defaultImageFetcher: ImageFetcher = (url, onBytes) => {
  if (typeof fetch != 'function') {
    onBytes(null);
    return;
  }
  fetch(url)
    .then(response => (response.ok ? response.arrayBuffer() : null))
    .then(
      bytes => onBytes(bytes),
      () => onBytes(null)
    );
};

/**
 * 创建一个图片加载器（每棵渲染树一个即可；多棵树共享同一份缓存时也
 * 可以共用一个）。
 */
export function createImageLoader(
  fetcher: ImageFetcher | null = defaultImageFetcher
): ImageLoader {
  /** 成功解码的内存缓存：url -> 图片（仅缓存成功结果） */
  const cache = new Map<string, PlatformImage>();
  /** 进行中的请求：url -> 排队等待同一结果的回调 */
  const inflight = new Map<string, Array<(image: PlatformImage | null) => void>>();

  /** 结算一批等待回调：成功写缓存，随后按序回调并清空 inflight */
  function finish(url: string, image: PlatformImage | null): void {
    if (image) {
      cache.set(url, image);
    }
    const pending = inflight.get(url);
    inflight.delete(url);
    if (pending) {
      for (const cb of pending) cb(image);
    }
  }

  return {
    setFetcher(next) {
      fetcher = next;
    },
    clearCache() {
      cache.clear();
    },
    load(url, onImage) {
      const cached = cache.get(url);
      if (cached) {
        onImage(cached);
        return;
      }
      const pending = inflight.get(url);
      if (pending) {
        pending.push(onImage);
        return;
      }
      inflight.set(url, [onImage]);
      const f = fetcher;
      if (!f) {
        console.warn(`ImageLoader 未注入 fetcher，无法加载图片: url=${url}`);
        finish(url, null);
        return;
      }
      f(url, bytes => {
        if (!bytes) {
          finish(url, null);
          return;
        }
        decodeImage(bytes).then(
          image => finish(url, image),
          () => finish(url, null)
        );
      });
    },
  };
}
