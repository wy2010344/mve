export interface PlatformImage {
  readonly width: number;
  readonly height: number;
  readonly source: CanvasImageSource;
}

export async function decodeImage(
  bytes: Uint8Array | ArrayBuffer
): Promise<PlatformImage | null> {
  try {
    const blob = new Blob([new Uint8Array(bytes)]);
    if (typeof createImageBitmap == 'function') {
      const bitmap = await createImageBitmap(blob);
      return { width: bitmap.width, height: bitmap.height, source: bitmap };
    }
    return await decodeViaImageElement(blob);
  } catch (err) {
    console.error('解码图片失败', err);
    return null;
  }
}

function decodeViaImageElement(blob: Blob): Promise<PlatformImage | null> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight, source: img });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}
