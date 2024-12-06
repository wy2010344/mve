import { faker } from "@faker-js/faker";
import { AbsoluteNode, renderAbsoulte, renderADom, flexDisplay } from "./absoluteRender";
import { createSignal, emptyArray, quote } from "wy-helper";
import { renderArray } from "mve-helper";
import { renderSvg, svg } from "mve-dom";


/**
 * @todo 布局是父容器配置子容器
 *  子容器读取到父容器的布局参数,提供给自己的布局方案
 *  这套方案又能读取子容器自身的个性化参数,实现最终的自定义
 * 
 *  如果文字或图片,生成建议尺寸
 *  但父容器的布局是否采用它的建议尺寸?不,是容器强制使用用户自己的覆盖尺寸
 * @param n 
 * @returns 
 */
function next(n: AbsoluteNode) {
  if (n.index()) {
    const before = n.parent.children()[n.index() - 1]
    return before.y() + before.height()
  }
  return 0
}

export default function (app: HTMLElement) {
  renderSvg("svg", {
    a_width: 500,
    a_height: 500,
    children() {
      renderSvg("rect", {
        a_x: 100,
        a_y: 100,
        a_width: 300,
        a_height: 200,
        a_stroke: "green"
      })
    }
  })
  renderAbsoulte(app, () => {
    const a: AbsoluteNode = renderADom("div", {
      m_display: flexDisplay({
        direction: "y"
      }),
      css_dddd: 89,
      data_abc: "abc",
      aria_hidden: true,
      onClick() {

      },
      onClickCapture() {

      },
      children() {
        renderADom("div", {
          width: 30,
          height: 40,
          s_background: faker.color.rgb()
        })

        const list = createSignal<readonly number[]>(emptyArray as any[])

        renderArray(list.get, quote, get => {
          renderADom("div", {
            width: 'auto',
            height: 'auto',
            s_whiteSpace: "nowrap",
            s_background: faker.color.rgb(),
            childrenType: "text",
            children() {
              const g = get()
              return `${g.index}---${g.item}`
            }
          })
        })
        renderADom("button", {
          width: 'auto',
          height: 'auto',
          s_whiteSpace: "nowrap",
          // s_background: faker.color.rgb(),
          childrenType: "text",
          onClick() {
            list.set(list.get().concat(Date.now()))
          },
          children() {
            return `${list.get().length}数据`
          }
        })
      }
    })
  })
}