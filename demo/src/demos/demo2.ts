import { faker } from "@faker-js/faker";
import { fdom } from "mve-dom";
import { signalAnimateFrame, subscribeEventListener } from "wy-dom-helper";
import { arrayCountCreateWith, easeFns, getTweenAnimationConfig, MomentumIScroll, startScroll } from "wy-helper";

export default function () {


  fdom.div({
    s_width: '100%',
    s_height: '100vh',
    s_display: 'flex',
    s_alignItems: 'center',
    s_justifyContent: 'center',
    onTouchMove(e) {
      e.preventDefault()
    },
    children() {
      const transX = signalAnimateFrame(0)
      const bs = MomentumIScroll.get()
      let content: HTMLElement
      const container = fdom.div({
        s_width: '320px',
        s_height: '240px',
        s_overflow: 'hidden',
        s_background: '#444',
        onPointerDown(e) {
          const m = startScroll(e.pageX, {
            containerSize() {
              return container.clientWidth
            },
            contentSize() {
              return content.offsetWidth
            },
            getCurrentValue() {
              return transX.get()
            },
            changeTo(value) {
              transX.changeTo(value)
            },
            finish(v) {
              const out = bs.destinationWithMargin(v)
              if (out.type == "scroll") {
                //这里snap,包括越界折返,未达补进
                //也就没有折返,只有恰好,即需要改变target
                transX.changeTo(out.target, getTweenAnimationConfig(out.duration, easeFns.out(easeFns.circ)))
              } else if (out.type == "scroll-edge") {
                transX.changeTo(out.target, getTweenAnimationConfig(out.duration, easeFns.out(easeFns.circ)), {
                  onFinish(v) {
                    transX.changeTo(out.finalPosition, getTweenAnimationConfig(300, easeFns.out(easeFns.circ)))
                  },
                })
              } else if (out.type == "edge-back") {
                transX.changeTo(out.target, getTweenAnimationConfig(300, easeFns.out(easeFns.circ)), {
                  onProcess(v) {
                    console.log("vss", v)
                  },
                  onFinish(v) {
                    console.log("va", transX.get())
                  },
                })
              }
            },
          })
          const destroyMove = subscribeEventListener(document, 'pointermove', e => {
            m.move(e.pageX)
          })
          const destroyEnd = subscribeEventListener(document, 'pointerup', e => {
            m.end(e.pageX)
            destroyMove()
            destroyEnd()
          })
        },
        children() {
          content = fdom.div({
            s_display: 'flex',
            s_alignItems: 'center',
            s_width: 'fit-content',
            s_transform() {
              return `translateX(${transX.get()}px)`
            },
            children() {
              for (let i = 0; i < 5; i++) {
                fdom.div({
                  s_height: '240px',
                  s_width: '200px',
                  s_display: 'flex',
                  s_alignItems: 'center',
                  s_justifyContent: 'center',
                  children() {
                    fdom.img({
                      s_borderRadius: '10px',
                      s_boxShadow: `inset 2px 2px 6px rgba(255,255,255,0.6),
		inset -2px -2px 6px rgba(0,0,0,0.6),
		0 1px 8px rgba(0,0,0,0.8)`,
                      a_src: faker.image.urlLoremFlickr({
                        width: 140,
                        height: 200
                      })
                    })
                  }
                })
              }
            }
          })
        }
      })
    }
  })
}