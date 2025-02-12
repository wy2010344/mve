import * as d3 from "d3";
import { fdom } from "mve-dom";
import { hookDraw, renderCanvas } from "mve-dom-helper";
import { hookDestroy, renderArray } from "mve-helper";
import { subscribeRequestAnimationFrame } from "wy-dom-helper";
import { asLazy, batchSignalEnd, createSignal, emptyArray, memo, run, toProxySignal } from "wy-helper";
import { createSignalForceDir, emptySignalForceDir, forceCollide, forceDir, forceManybody, ForceNode, initForceConfig, initToNode, mergeNodes, SignalForceDir, tickForce } from "wy-helper/forceLayout";

export default function () {


  const canvas = fdom.canvas({
    a_width: 800,
    a_height: 800
  })
  const width = 800
  const data = run(() => {
    const k = width / 200;
    const r = d3.randomUniform(k, k * 4);
    const n = 4;
    return Array.from({ length: 200 }, (_, i) => ({ r: r(), group: i && (i % n + 1) }));
  })

  type Row = {
    r: number,
    group: number
  }

  const model = createSignal(data)

  const getNodes = memo<readonly ForceNode<Row, SignalForceDir>[]>((old) => {
    return mergeNodes({
      nodes: old || emptyArray,
      fromNodes: model.get(),
      createForceNode(n, i) {
        return initToNode(n, 2, i, createSignalForceDir, emptySignalForceDir)
      }
    })
  })

  const _m = initForceConfig()
  _m.alphaTarget = 0.3
  _m.velocityDecay = 1 - 0.1
  const config = toProxySignal(_m)
  const height = width;
  const color = d3.scaleOrdinal(d3.schemeTableau10);



  const renderManyBody = forceManybody<Row>({
    getStrenth(n) {
      return n.index ? 0 : -width * 2 / 3
    },
  })
  const renderDirX = forceDir('x', {
    getStrength: asLazy(0.01)
  })
  const renderDirY = forceDir('y', {
    getStrength: asLazy(0.01)
  })
  const renderCollide = forceCollide<Row>({
    getRadius(n) {
      return n.value.r + 1
    },
    iterations: 3
  })
  hookDestroy(subscribeRequestAnimationFrame(() => {
    const nodes = getNodes()
    tickForce(config, nodes, alpha => {
      renderManyBody(nodes, config.nDim, alpha)
      renderDirX(nodes, alpha)
      renderDirY(nodes, alpha)
      renderCollide(nodes, 2)
    })
    batchSignalEnd()
  }))

  canvas.addEventListener("pointermove", e => {

    const [x, y] = d3.pointer(event);
    const n0 = getNodes()[0]
    n0.x.f = x - width / 2;
    n0.y.f = y - height / 2;
    batchSignalEnd()
  })
  renderCanvas(canvas, function () {
    renderArray(getNodes, (node, getIndex) => {
      hookDraw({
        x: node.x.dSignal.get,
        y: node.y.dSignal.get,
        draw(ctx) {
          const path = new Path2D()
          path.arc(0, 0, node.value.r, 0, 2 * Math.PI)
          return {
            path,
            operates: getIndex() ? [
              {
                type: "fill",
                style: color(node.value.group + '')
              }
            ] : emptyArray as any[]
          }
        },
      })
    })
  }, {
    beforeDraw(ctx: CanvasRenderingContext2D) {
      ctx.translate(width / 2, height / 2)
    }
  })
}