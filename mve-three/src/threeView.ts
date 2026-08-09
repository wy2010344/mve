import {
  diffMoveOrderLess,
  ReadSet,
  SetValue,
  ValueOrGet,
  valueOrGetToGet,
} from 'wy-helper';
import * as THREE from 'three';
import { hookDestroy, hookTrackSignal } from 'mve-helper';
import {
  createContext,
  createRenderChildren,
  hookAddResult,
  hookCurrentStateHolder,
  purifySet,
  renderRoot,
  ShareConfig,
  StateHolderWithNode,
} from 'mve-core';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

type AXRFrameRequestCallback = XRFrameRequestCallback;

export function getPerspectiveCamera(
  width: ValueOrGet<number>,
  height: ValueOrGet<number>
) {
  const camera = new THREE.PerspectiveCamera();
  const w = valueOrGetToGet(width);
  const h = valueOrGetToGet(height);
  hookTrackSignal(() => {
    camera.aspect = w() / h();
    camera.updateProjectionMatrix();
  });
  camera.fov = 75;
  camera.near = 0.1;
  camera.far = 1000;
  camera.position.z = 5;
  return camera;
}

export function renderThreeView({
  camera,
  width,
  height,
  render,
  notRender,
  args,
}: {
  camera: THREE.Camera;
  width: ValueOrGet<number>;
  height: ValueOrGet<number>;
  render(scene: THREE.Scene): void;
  args?: THREE.WebGLRendererParameters;
  notRender?: boolean;
}) {
  const renderer = new THREE.WebGLRenderer(args);
  const scene = new THREE.Scene();
  hookDestroy(() => {
    renderer.dispose();
  });
  const w = valueOrGetToGet(width);
  const h = valueOrGetToGet(height);
  const set = new Set<AXRFrameRequestCallback>();
  ThreeContext.provide({
    scene,
    camera,
    domElement: renderer.domElement,
    hookAnimationLoop(fun) {
      if (set.has(fun)) {
        return;
      }
      set.add(fun);
      hookDestroy(() => {
        set.delete(fun);
      });
    },
    renderer,
  });
  hookTrackSignal(() => {
    renderer.setSize(w(), h());
  });
  hookAddResult(renderer.domElement);
  renderChildren(scene, render as any);
  renderer.setAnimationLoop(function (time, frame) {
    if (!notRender) {
      renderer.render(scene, camera);
    }
    set.forEach(fun => {
      fun(time, frame);
    });
  });
  return renderer;
}

export function hookOrbitControls() {
  const { hookAnimationLoop, domElement, camera } = ThreeContext.consume();
  /**旋转等查看 */
  const controls = new OrbitControls(camera, domElement);
  hookAnimationLoop(() => {
    controls.update();
  });
  return controls;
}

export const ThreeContext = createContext<{
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  camera: THREE.Camera;
  domElement: HTMLCanvasElement;
  hookAnimationLoop(fun: AXRFrameRequestCallback): void;
}>(undefined!);

export function renderMesh() {
  const mesh = new THREE.Mesh();
  hookAddResult(mesh);
  hookDestroy(() => {
    mesh.geometry.dispose();
    const ms = mesh.material;
    if (Array.isArray(ms)) {
      ms.forEach(m => m.dispose());
    } else {
      ms.dispose();
    }
  });
  return mesh;
}

export function renderGroup(render: SetValue<THREE.Group>) {
  const group = new THREE.Group();
  renderChildren(group, render as any);
  hookAddResult(group);
  return group;
}

const object3DConfig: ShareConfig<THREE.Object3D, ReadSet<THREE.Object3D>> = {
  purifyList(list) {
    const newSet = new Set<THREE.Object3D>();
    purifySet(list, newSet, () => false);
    return newSet;
  },
  after() {},
};

const n = createRenderChildren<THREE.Object3D, ReadSet<THREE.Object3D>>(
  //顺序无影响
  diffMoveOrderLess({
    removeChild(parent, child) {
      if (child.parent == parent) {
        parent.remove(child);
      }
    },
    appendChild(parent, child) {
      if (child.parent == parent) {
        return;
      }
      if (child.parent) {
        child.parent.remove(child);
      }
      parent.add(child);
    },
  }),
  function (node, callback) {
    const state = hookCurrentStateHolder(true);
    const root = renderRoot(node, object3DConfig, function () {
      const three = state.consume(ThreeContext);
      ThreeContext.provide(three);
      callback.call(this);
    });
    state.addDestroy(() => {
      root.destroy();
    });
    return root.target;
  },
  function (node, callback) {
    const state = hookCurrentStateHolder(true);
    const root = renderRoot(node, object3DConfig, function () {
      const three = state.consume(ThreeContext);
      ThreeContext.provide(three);
      callback.call(this);
    });
    return root;
  }
);

export const renderChildren = n.renderChildren;
