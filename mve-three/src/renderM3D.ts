import { EmptyFun, ValueOrGet, valueOrGetToGet } from 'wy-helper';
import * as THREE from 'three';
import { hookDestroy, hookTrackSignal } from 'mve-helper';
import { withParent } from './context';

/**
 * 渲染一个Mesh,支持响应式geometry与material,销毁时自动释放
 * @param o
 * @param arg
 */
export function renderM3D(
  o: THREE.Mesh,
  arg: {
    geometry?: ValueOrGet<THREE.BufferGeometry>;
    material?: ValueOrGet<THREE.Material | THREE.Material[]>;
    children?: EmptyFun;
  }
) {
  if (arg.geometry) {
    const getGemoetry = valueOrGetToGet(arg.geometry);
    hookTrackSignal(getGemoetry, v => {
      o.geometry.dispose();
      o.geometry = v;
    });
  }
  if (arg.material) {
    const getMaterial = valueOrGetToGet(arg.material);
    hookTrackSignal(getMaterial, v => {
      disposeMaterial(o);
      o.material = v;
    });
  }
  hookDestroy(() => {
    //销毁
    o.geometry.dispose();
    disposeMaterial(o);
    o.removeFromParent();
  });
  if (arg.children) {
    withParent(o, arg.children);
  }
}

function disposeMaterial(o: THREE.Mesh) {
  const m = o.material;
  if (Array.isArray(m)) {
    m.forEach(x => x.dispose());
  } else {
    m.dispose();
  }
}

export function hookRemoveFromParent<
  T extends {
    removeFromParent(): void;
  },
>(o: T): T {
  hookDestroy(() => {
    o.removeFromParent();
  });
  return o;
}

export function hookDispose<
  T extends {
    dispose(): void;
  },
>(o: T) {
  hookDestroy(() => {
    o.dispose();
  });
  return o;
}
