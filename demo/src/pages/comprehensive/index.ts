import { routerConsume } from 'mve-dom-helper/history';
import { LeafLoaderParam } from 'mve-helper';
import { addEffect } from 'wy-helper';

export default function (e: LeafLoaderParam) {
  const { router } = routerConsume();
  addEffect(() => {
    router.replace(e.getAbsolutePath('./dashboard'));
  });
}
