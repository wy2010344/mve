
import { fdom, fsvg } from "mve-dom";
import { EmptyFun, tw, ValueOrGet } from "wy-helper";
import { LuChevronLeft } from "mve-icons/lu";
import { cns } from "wy-dom-helper";
import { routerConsume } from "mve-dom-helper/history";


export function renderNavbar({
  title = '',
  right,
  index
}: {
  title?: ValueOrGet<string>
  right?: EmptyFun,
  index?: boolean
}) {
  fdom.div({
    className: navbarClassName,
    children() {
      if (!index) {
        const { router } = routerConsume()
        fdom.div({
          className: 'daisy-navbar-start',
          children() {
            fdom.button({
              className: navbarButtonClassName,
              onClick() {
                router.back()
              },
              children() {
                NavbarIcon(LuChevronLeft)
              }
            })
          }
        })
      }
      fdom.div({
        className: cns('daisy-navbar-center', index && 'flex-1'),
        children() {
          fdom.h1({
            className: 'text-lg font-semibold',
            childrenType: "text",
            children: title
          })
        }
      })
      fdom.div({
        className: 'daisy-navbar-end',
        children: right
      })
    }
  })
}

export const navbarClassName = tw`daisy-navbar bg-base-200 shadow-sm top-0 sticky z-1`
export const navbarButtonClassName = tw`daisy-btn daisy-btn-circle daisy-btn-ghost`
export function NavbarIcon(icon: typeof LuChevronLeft) {
  icon(renderSizeSvg, '24px')
}


export function renderSizeSvg(
  attrs: {
    viewBox: string
  },
  children: EmptyFun,
  size: string
) {
  return fsvg.svg({
    ...attrs,
    fill: "none",
    stroke: 'currentColor',
    // strokeWidth: '0',
    width: size,
    height: size,
    children
  })
}