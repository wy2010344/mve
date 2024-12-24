import { createContext, renderStateHolder } from "mve-core";
import { Mesh } from "three";
import GUI from "three/examples/jsm/libs/lil-gui.module.min.js";
import { EmptyFun } from "wy-helper";

import * as THREE from 'three';


export const GlobalContext = createContext<{
  gui: GUI
  renderer: THREE.WebGLRenderer
}>(undefined as any)


const ParentContext = createContext<Mesh>(undefined as any)
export function withParent(p: Mesh, fun: EmptyFun) {
  ParentContext.provide(p)
  renderStateHolder(fun)
}
export function findParent() {
  return ParentContext.consume()
}