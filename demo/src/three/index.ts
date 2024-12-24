import { render } from 'mve-core';
import { renderDom } from 'mve-dom';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import Stats from 'three/addons/libs/stats.module.js'
import renderTerrain from './renderWorld';
import { createSignal } from 'wy-helper';
import { valueSignal } from './valueSignal';
import { GlobalContext } from './context';
/**
 * 参考 https://www.youtube.com/watch?v=Cf6ocQLU1lU 学习
 * 
 * 目标:
 * 游戏类型:等距角色扮演游戏(Isometric RPG)
 * 艺术风格:低多边形风格(Low-poly Style)
 * 游戏地图:基于网格的运动(Grid-based movement)
 * 
 * 特点:
 * 程序地下城(Procedural dungeons)
 * 回合制战斗(Turn-based combat)
 * 敌人/怪物(Enemies/monsters AI)
 * 库存/战利品(Inventory/Loot)
 * 武器(程序生成)
 * 任务(Quests)
 * NPCs
 * Town
 * 角色属性/职业(Character stats/classes)
 * 
 * 开发步骤:
 * 简单开始
 * 逐层构建
 * 首先关注游戏玩法，然后再进行图形、润色和优化
 */
export default function () {

  const scene = new THREE.Scene();
  //透视相机
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(10, 2, 10);
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  /**旋转等查看 */
  const controls = new OrbitControls(camera, renderer.domElement);



  //点光源
  const sun = new THREE.DirectionalLight()
  sun.position.set(1, 2, 3)
  sun.intensity = 3
  scene.add(sun)


  //环境光
  const ambient = new THREE.AmbientLight()
  ambient.intensity = 0.5
  scene.add(ambient)

  scene.add(new THREE.AxesHelper())
  camera.position.set(10, 2, 10);

  const stats = new Stats()
  document.body.appendChild(stats.dom)

  renderer.setAnimationLoop(function () {
    controls.update()
    stats.update()
    renderer.render(scene, camera);
    // console.log("camera", camera.position)
  })

  const gui = new GUI()
  GlobalContext.provide({
    gui,
    renderer
  })

  const terrain = renderTerrain()
  scene.add(terrain)
  window.addEventListener("resize", e => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
  })




}
