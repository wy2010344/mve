import { fdom } from "mve-dom"
import { CanvasMouseEvent, hookDraw, renderADom, renderCanvas } from "mve-dom-helper";
import { hookDestroy, renderArray } from "mve-helper";
import { subscribeDragMove, subscribeMove, subscribeRequestAnimationFrame } from "wy-dom-helper";
import { asLazy, batchSignalEnd, createSignal, emptyArray, memo, run, toProxySignal } from "wy-helper";
import { createSignalForceDir, emptySignalForceDir, forceLink, ForceLink, forceManybody, ForceNode, initForceConfig, initToNode, mergeNodesAndLinks, SignalForceDir, tickForce } from "wy-helper/forceLayout";

export default function () {
  const canvas = fdom.canvas({
    a_width: 800,
    a_height: 800
  })
  const width = 800

  const data = run(() => {
    const n = 20;
    const nodes: {
      index: number
    }[] = Array.from({ length: n * n }, (_, i) => ({ index: i }));
    const links: {
      source: number
      target: number
    }[] = [];
    for (let y = 0; y < n; ++y) {
      for (let x = 0; x < n; ++x) {
        if (y > 0) links.push({ source: (y - 1) * n + x, target: y * n + x });
        if (x > 0) links.push({ source: y * n + (x - 1), target: y * n + x });
      }
    }
    return { nodes, links };
  })

  const height = width;

  type Row = {
    index: number,
  }
  type Link = {

    source: number;
    target: number;
  }

  const nodes = createSignal<readonly Row[]>(data.nodes)
  const links = createSignal<readonly Link[]>(data.links)
  const currentNode = createSignal<ForceNode<Row> | undefined>(undefined)
  const getNodesAndLinks = memo<{
    nodes: readonly ForceNode<Row, SignalForceDir>[],
    links: readonly ForceLink<Link, Row, SignalForceDir>[]
  }>(old => {
    return mergeNodesAndLinks({
      nodes: old?.nodes || emptyArray,
      links: old?.links || emptyArray,
      fromLinks: links.get(),
      fromNodes: nodes.get(),
      createForceNode(n, i, befores) {
        return initToNode(n, 2, i, createSignalForceDir, emptySignalForceDir)
      },
      getNodeKey(n) {
        return n.index
      },
      getSorceKey(n) {
        return n.source
      },
      getTargetKey(n) {
        return n.target
      },
      createFromKey(k) {
        return {
          index: k
        }
      },
    })
  })

  const config = toProxySignal(initForceConfig())
  const renderLink = forceLink({

    getStrength: asLazy(1),
    getDistance: asLazy(20),
    iterations: 10
  })
  const renderManyBody = forceManybody({
    getStrenth: asLazy(-30)
  })
  function didTick() {
    const gl = getNodesAndLinks()
    tickForce(config, gl.nodes, (alpha) => {
      renderLink(gl.links, config.nDim, alpha)
      renderManyBody(gl.nodes, config.nDim, alpha)
    })
  }
  hookDestroy(subscribeRequestAnimationFrame(() => {
    didTick()
    batchSignalEnd()
  }))

  hookDestroy(subscribeMove(function (p, e) {
    // console.log("ss", p?.clientX, p?.clientY)
    const c = currentNode.get()
    if (c) {
      if (e) {
        config.alphaTarget = 0
        c.x.f = undefined
        c.y.f = undefined
        currentNode.set(undefined)
      } else {
        c.x.f = p.offsetX - width / 2
        c.y.f = p.offsetY - height / 2
      }
    }
  }, "pointer", {
    element: canvas
  }))
  renderCanvas(canvas, function () {
    renderArray(() => getNodesAndLinks().links, link => {
      hookDraw({
        x: link.source.x.dSignal.get,
        y: link.source.y.dSignal.get,
        draw(ctx) {
          const path = new Path2D()
          path.moveTo(0, 0)
          path.lineTo(
            link.target.x.d - link.source.x.d,
            link.target.y.d - link.source.y.d,
          )
          return {
            path,
            operates: [
              {
                type: "stroke",
                style: "#aaa",
                width: 1
              }
            ]
          }
        },
      })
    })
    renderArray(() => getNodesAndLinks().nodes, node => {
      hookDraw({
        x: node.x.dSignal.get,
        y: node.y.dSignal.get,
        onPointerDown(e) {
          config.alphaTarget = 0.3
          currentNode.set(node)

          // node.x.f = e.original.clientX - width / 2
          // node.y.f = e.original.clientY - height / 2
        },
        draw(ctx) {
          const path = new Path2D()
          path.arc(0, 0, 3, 0, 2 * Math.PI)

          return {
            path,
            operates: [
              {
                type: "fill",
                style: "#000"
              },
              {
                type: "draw",
                callback(ctx) {
                  ctx.fillText(node.value.index + "", 0, 0)
                },
              }
            ]
          }
        },
      })
    })
  }, {
    beforeDraw(ctx: CanvasRenderingContext2D) {
      //这里竟然不会影响点击坐标??
      ctx.translate(width / 2, height / 2)
    }
  })
}