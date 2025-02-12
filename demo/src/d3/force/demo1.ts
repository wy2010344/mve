import { fsvg } from 'mve-dom'
import data from './graph.json'
import * as d3 from "d3";
import { dragInit, subscribeDragMove, subscribeRequestAnimationFrame } from 'wy-dom-helper';
import { batchSignalEnd, createSignal, emptyArray, emptyFun, emptyObject, memo, StoreRef, toProxySignal } from 'wy-helper';
import { hookTrackSignal, renderArray } from 'mve-helper';
import { mergeNodesAndLinks, initToNode, createSignalForceDir, emptySignalForceDir, SignalForceDir, ForceNode, ForceLink, tickForce, forceLink, forceManybody, forceDir, initForceConfig, ForceConfig } from 'wy-helper/forceLayout';
const width = 800
const height = 800

type NNode = typeof data.nodes[number]
type NLink = typeof data.links[number]
const alphaMin = 0.001
export default function () {
  const svg = fsvg.svg({
    a_width: width,
    a_height: height,
    a_viewBox: `${-width / 2} ${-height / 2} ${width} ${height}`,
    s_maxWidth: '100%',
    s_height: 'auto',
    children() {
      const color = d3.scaleOrdinal(d3.schemeCategory10);
      const model = createSignal(data)
      const getNodesAndLinks = memo<{
        nodes: readonly ForceNode<NNode, SignalForceDir>[],
        links: readonly ForceLink<NLink, NNode, SignalForceDir>[]
      }>((old) => {
        return mergeNodesAndLinks({
          nodes: old?.nodes || emptyArray,
          links: old?.links || emptyArray,
          fromLinks: model.get().links,
          fromNodes: model.get().nodes,
          createForceNode(n, i, befores) {
            return initToNode(n, 2, i, createSignalForceDir, emptySignalForceDir)
          },
          getNodeKey(n) {
            return n.id
          },
          getSorceKey(n) {
            return n.source
          },
          getTargetKey(n) {
            return n.target
          },
          createFromKey(k) {
            return {
              id: k,
              group: 'not-found'
            }
          },
        })
      })
      const config = toProxySignal(initForceConfig())
      const stoped = () => {
        return config.alpha < alphaMin
      }
      const renderLink = forceLink()
      const renderManyBody = forceManybody()
      const renderDirX = forceDir('x')
      const renderDirY = forceDir('y')
      function didTick() {
        const gl = getNodesAndLinks()
        tickForce(config, gl.nodes, (alpha) => {
          renderLink(gl.links, config.nDim, alpha)
          renderManyBody(gl.nodes, config.nDim, alpha)
          renderDirX(gl.nodes, alpha)
          renderDirY(gl.nodes, alpha)
        })
      }

      let closeFrame = emptyFun
      hookTrackSignal(stoped, stoped => {
        if (stoped) {
          closeFrame()
          return
        }
        closeFrame = subscribeRequestAnimationFrame(() => {
          didTick()
          batchSignalEnd()
        })
      })

      renderArray(() => getNodesAndLinks().links, link =>
        fsvg.g({
          a_stroke: "#999",
          a_strokeOpacity: 0.6,
          children() {
            fsvg.line({
              a_x1: link.source.x.dSignal.get,
              a_y1: link.source.y.dSignal.get,
              a_x2: link.target.x.dSignal.get,
              a_y2: link.target.y.dSignal.get,
              a_strokeWidth: Math.sqrt(link.value.value)
            })
          }
        })
      )

      renderArray(() => getNodesAndLinks().nodes, node =>
        fsvg.g({
          a_stroke: "#fff",
          a_strokeWidth: 1.5,
          children() {
            fsvg.circle({
              a_r: 5,
              a_cx: node.x.dSignal.get,
              a_cy: node.y.dSignal.get,
              a_fill: color(node.value.group),
              ...(dragInit(e => {
                const rec = svg.getBoundingClientRect()
                const halfX = rec.left + rec.width / 2
                const halfY = rec.top + rec.height / 2
                node.x.f = e.pageX - halfX
                node.y.f = e.pageY - halfY
                config.alphaTarget = 0.3
                didTick()
                const destroy = subscribeDragMove(e => {
                  if (e) {
                    node.x.f = e.pageX - halfX
                    node.y.f = e.pageY - halfY
                  } else {
                    node.x.f = undefined
                    node.y.f = undefined
                    config.alphaTarget = 0
                    destroy()
                  }
                })
              }))
            })
          }
        })
      )
    }
  })
}

