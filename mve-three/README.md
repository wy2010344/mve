# mve-three

Three.js view renderer and helpers for MVE framework.

## Installation

```bash
npm install mve-three
# or
pnpm add mve-three
# or
yarn add mve-three
```

## Peer Dependencies

- `mve-core` (workspace dependency)
- `mve-helper` (workspace dependency)
- `wy-helper` (workspace dependency)
- `three` (^0.184.0)

## Features

- **renderThreeView** - Declarative Three.js scene renderer with reactive size
- **renderMesh / renderGroup / renderChildren** - Reactive 3D object rendering
- **hookOrbitControls** - OrbitControls bound to the render loop
- **renderM3D** - Mesh rendering with reactive geometry/material and auto dispose
- **withParent / findParent** - Scoped parent context for 3D objects
- **valueSignal** - Signal with `.value` accessor for third-party binding
- **threeLayout** - 3D layout nodes with per-axis `layout` (flex / stack / absolute), each node has its own `index` and `layoutIndex`

## Usage

```typescript
import * as THREE from 'three';
import { windowSize } from 'wy-dom-helper';
import {
  getPerspectiveCamera,
  hookOrbitControls,
  renderMesh,
  renderThreeView,
} from 'mve-three';

export default function () {
  const camera = getPerspectiveCamera(windowSize.width, windowSize.height);
  renderThreeView({
    camera,
    width: windowSize.width,
    height: windowSize.height,
    render(scene) {
      const mesh = renderMesh();
      mesh.geometry = new THREE.IcosahedronGeometry(1.0, 12);
      mesh.material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        flatShading: true,
      });
      hookOrbitControls();
    },
  });
}
```

### 3D layout

每个布局节点有自己的 `index`（兄弟顺序）与 `layoutIndex`（父布局内顺序）。三轴各自独立布局，用 `flex3` 便捷封装（主轴 flex + 两个辅轴 stack），或用 `LayoutDirection3` 自定义每轴：

```typescript
import {
  flex3,
  grow3,
  renderLayoutNode3,
  hookThreePosition,
} from 'mve-three';

export default function () {
  renderThreeView({
    camera,
    width,
    height,
    render() {
      renderLayoutNode3({
        width: 600,
        height: 400,
        depth: 200,
        layout: flex3({ direction: 'x', gap: 10 }),
        children() {
          const child = renderLayoutNode3({
            exts: [grow3({ argGrow: 1 })],
            depth: 100,
          });
          hookThreePosition(child);
        },
      });
    },
  });
}
```

## License

MIT
