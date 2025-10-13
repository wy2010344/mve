import { hookPromiseSignal, promiseSignal, renderOne } from 'mve-helper';
import { DrawArgRect, DrawRectConfig, hookDrawRect } from './hookDrawRect';
import { loadImage } from 'wy-dom-helper';
import {
  EmptyFun,
  SetValue,
  SizeKey,
  ValueOrGet,
  valueOrGetToGet,
} from 'wy-helper';

export function hookDrawUrlImage(
  n: {
    src: ValueOrGet<string>;
    draw?(e: DrawArgImg): void;
    relay?: SizeKey;
    onLoading?: EmptyFun;
    onError?: SetValue<any>;
  } & Omit<DrawRectConfig, 'draw'>
) {
  const getSrc = valueOrGetToGet(n.src);
  const signal = hookPromiseSignal(() => () => loadImage(getSrc()));
  renderOne(signal.get, function (v) {
    if (v?.type == 'success') {
      hookDrawImage({
        ...n,
        image: v.value,
      });
    } else if (v?.type == 'error') {
      n.onError?.(v.value);
    } else {
      n.onLoading?.();
    }
  });
}

export type DrawArgImg = DrawArgRect & {
  draw(): void;
};
export function hookDrawImage(
  arg: {
    image: ValueOrGet<HTMLImageElement>;
    relay?: SizeKey | undefined;
    draw?(e: DrawArgImg): void;
  } & Omit<DrawRectConfig, 'draw'>
) {
  const getImage = valueOrGetToGet(arg.image);
  if (arg.relay == 'width') {
    arg.heightAsInner = true;
    arg.height = n => {
      const image = getImage();
      return (image.naturalHeight * n.axis.x.innerSize()) / image.naturalWidth;
    };
  } else if (arg.relay == 'height') {
    arg.widthAsInner = true;
    arg.width = n => {
      const image = getImage();
      return (image.naturalWidth * n.axis.y.innerSize()) / image.naturalHeight;
    };
  } else {
    arg.widthAsInner = true;
    arg.heightAsInner = true;
    arg.width = n => {
      const image = getImage();
      return image.naturalWidth;
    };
    arg.height = n => {
      const image = getImage();
      return image.naturalHeight;
    };
  }
  const n = hookDrawRect({
    ...arg,
    draw(e) {
      const image = getImage();
      function draw() {
        e.ctx.drawImage(
          image,
          n.axis.x.paddingStart(),
          n.axis.y.paddingStart(),
          n.axis.x.innerSize(),
          n.axis.y.innerSize()
        );
      }
      if (arg.draw) {
        const ee = e as DrawArgImg;
        ee.draw = draw;
        arg.draw(ee);
      } else {
        draw();
      }
    },
  });
  return n;
}

export function imageLoadSignal(src: string) {
  return promiseSignal(loadImage(src));
}
