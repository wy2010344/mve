import { EmptyFun, ValueOrGet, valueOrGetToGet } from "wy-helper";
import * as THREE from 'three'
import { hookDestroy, hookTrackSignalMemo } from "mve-helper";
import { withParent } from "./context";


/**
 * 有问题,geometry与material可能会复用
 * @param o 
 * @param arg 
 */
export function renderM3D(o: THREE.Mesh, arg: {
  geometry?: ValueOrGet<THREE.BufferGeometry>,
  material?: ValueOrGet<THREE.Material | THREE.Material[]>,
  children?: EmptyFun
}) {
  if (arg.geometry) {
    const getGemoetry = valueOrGetToGet(arg.geometry)
    hookTrackSignalMemo(getGemoetry, v => {
      o.geometry.dispose()
      o.geometry = v
    })
  }
  if (arg.material) {
    const getMaterial = valueOrGetToGet(arg.material)
    hookTrackSignalMemo(getMaterial, v => {
      disposeMaterial(o)
      o.material = v
    })
  }
  hookDestroy(() => {
    //销毁
    o.geometry.dispose()
    disposeMaterial(o)
    o.removeFromParent()
  })
  if (arg.children) {
    withParent(o, arg.children)
  }
}

function disposeMaterial(o: THREE.Mesh) {
  const m = o.material
  if (Array.isArray(m)) {
    m.forEach(x => x.dispose())
  } else {
    m.dispose()
  }
}

export function hookRemoveFromParent<T extends {
  removeFromParent(): void
}>(o: T): T {
  hookDestroy(() => {
    o.removeFromParent()
  })
  return o
}
export function hookDispose<T extends {
  dispose(): void
}>(o: T) {
  hookDestroy(() => {
    o.dispose()
  })
  return o
}