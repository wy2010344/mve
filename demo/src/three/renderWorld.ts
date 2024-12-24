
import * as THREE from 'three'
import { EqualsMap, GetValue, Point, pointEqual } from 'wy-helper'
import { hookDispose, hookRemoveFromParent, renderM3D } from './M3D'
import { faker } from '@faker-js/faker'
import { renderOne } from 'mve-helper'
import { createContext } from 'mve-core'
import { findParent, GlobalContext, withParent } from './context'
import { valueSignal } from './valueSignal'


const TerrainContext = createContext<{
  width: number,
  height: number
  objectMap: EqualsMap<Point, THREE.Mesh>,
  tryGet(v: THREE.Mesh, fun: GetValue<Point>): Point
}>(undefined as any)
/**
 * 绘制地形
 */
export default function () {
  const world = new THREE.Mesh()
  const width = valueSignal(10)
  const height = valueSignal(10)
  renderOne(() => `${width.get()}--${height.get()}`, v => {
    const w = width.get()
    const h = height.get()
    const objectMap = new EqualsMap<Point, THREE.Mesh>(pointEqual)
    TerrainContext.provide({
      width: w,
      height: h,
      objectMap,
      tryGet(v, fun) {
        while (true) {
          const p = fun()
          if (!objectMap.has(p)) {
            objectMap.set(p, v)
            return p
          }
        }
      },
    })
    withParent(world, function () {
      createTerrain()
      createRocks()
      createTree()
      createBushes()
    })
  })
  const { gui } = GlobalContext.consume()
  const terrainFolder = gui.addFolder("terrain")
  terrainFolder.add(width, 'value').min(1).max(10).step(1).name("width")
  terrainFolder.add(height, 'value').min(1).max(10).step(1).name("height")
  return world
}


function createTerrain() {
  const parent = findParent()
  const { width, height } = TerrainContext.consume()
  const terrain = hookRemoveFromParent(new THREE.Mesh());
  parent.add(terrain)

  renderM3D(terrain, {
    geometry: new THREE.PlaneGeometry(
      width,
      height,
      width,
      height
    ),
    material: new THREE.MeshMatcapMaterial({
      color: 0x50a000
    })
  })
  terrain.rotation.x = -Math.PI / 2
  terrain.position.set(width / 2, 0, height / 2)
}
function createRocks() {
  const parent = findParent()
  const { width, height, tryGet } = TerrainContext.consume()
  const minRockRadius = 0.2
  const maxRockRadius = 0.4
  const maxRockHeight = 0.8
  const minRockHeight = 0.05
  const rockCount = 20
  const rockMaterial = hookDispose(new THREE.MeshMatcapMaterial({
    color: 0xb0b0b0,
    flatShading: true
  }))
  for (let i = 0; i < rockCount; i++) {
    const rockHeight = faker.number.float({
      min: minRockHeight,
      max: maxRockHeight
    })
    const rockRadius = faker.number.float({
      min: minRockRadius,
      max: maxRockRadius
    })
    const rockGeometry = hookDispose(new THREE.SphereGeometry(rockRadius))
    const rockMesh = hookRemoveFromParent(new THREE.Mesh(rockGeometry, rockMaterial))
    parent.add(rockMesh)
    const coords = tryGet(rockMesh, () => {
      return new THREE.Vector2(
        Math.floor(width * Math.random()),
        Math.floor(height * Math.random())
      )
    })
    rockMesh.position.set(
      coords.x + 0.5,
      0,
      coords.y + 0.5,
    )
    rockMesh.scale.y = rockHeight
  }
}

function createTree() {
  const parent = findParent()
  const { width, height, tryGet } = TerrainContext.consume()
  const treeRadius = 0.2
  const treeCount = 10
  const treeHeight = 1
  const treeGeometry = hookDispose(new THREE.ConeGeometry(treeRadius, 1, 8))
  const treeMaterial = hookDispose(new THREE.MeshStandardMaterial({
    color: 0x305010,
    flatShading: true
  }))
  for (let i = 0; i < treeCount; i++) {
    const treeMesh = hookRemoveFromParent(new THREE.Mesh(treeGeometry, treeMaterial))
    parent.add(treeMesh)
    const coords = tryGet(treeMesh, () => {
      return new THREE.Vector2(
        Math.floor(width * Math.random()),
        Math.floor(height * Math.random())
      )
    })
    treeMesh.position.set(
      coords.x + 0.5,
      treeHeight / 2,
      coords.y + 0.5,
    )
  }

  const { gui, renderer } = GlobalContext.consume()
  gui.add({
    click() {
      console.log("dispose", JSON.stringify(renderer.info))
      treeMaterial.dispose()
      treeGeometry.dispose()
      //会自动恢复
      console.log(JSON.stringify(renderer.info), renderer.info)
    }
  }, 'click')
}


function createBushes() {
  const minBushRadius = 0.1;
  const maxBushRadius = 0.3;
  const bushCount = 10
  const parent = findParent()
  const { width, height, tryGet } = TerrainContext.consume()

  const bushMaterial = hookDispose(new THREE.MeshStandardMaterial({
    color: 0x80a040,
    flatShading: true
  }));
  for (let i = 0; i < bushCount; i++) {
    const radius = faker.number.float({
      min: minBushRadius,
      max: maxBushRadius
    })
    const bushGeometry = hookDispose(new THREE.SphereGeometry(radius, 8, 8))
    const bushMesh = hookRemoveFromParent(new THREE.Mesh(bushGeometry, bushMaterial))
    const coords = tryGet(bushMesh, () => {
      return new THREE.Vector2(
        Math.floor(width * Math.random()),
        Math.floor(height * Math.random())
      );
    })
    bushMesh.position.set(
      coords.x + 0.5,
      radius,
      coords.y + 0.5
    );
    parent.add(bushMesh)
  }
}