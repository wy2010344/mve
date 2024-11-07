import { animate, AnimationControls, spring } from "motion";
import { dom } from "mve-dom"
import { hookTrackSignal } from "mve-helper";
import { animateFrame } from "wy-dom-helper";
import { batchSignalEnd, createSignal, extrapolationClamp, getInterpolate, getSpringBaseAnimationConfig, GetValue, getZtaAndOmega0From, memo, trackSignal } from "wy-helper";
const APPS = [
  'Safari',
  'Mail',
  'Messages',
  'Photos',
  'Notes',
  'Calendar',
  'Reminders',
  'Music',
];

const sp = getSpringBaseAnimationConfig({
  config: getZtaAndOmega0From(170, 12, 0.1)
})
const SPRING = {
  mass: 0.1,
  stiffness: 170,
  damping: 12,
};
function hookSpring(get: GetValue<number>) {
  const value = createSignal(0)

  let ct: AnimationControls
  hookTrackSignal(get, v => {
    const diff = v - value.get()
    const last = value.get()
    if (diff) {
      ct?.stop()
      ct = animate(x => {
        value.set(diff * x + last)
        batchSignalEnd()
      }, {
        easing: spring(SPRING)
      })
    }
  })
  return value.get
  // const value = animateFrame(0)
  // hookTrackSignal(get, v => {
  //   if (value.getTargetValue() != v) {
  //     value.animateTo(v, sp)
  //   }
  // })
  // return value.get.bind(value)
}

const DISTANCE = 110; // pixels before mouse affects an icon
const SCALE = 2.25; // max scale factor of an icon
const NUDGE = 40; // pixels icons are moved away from mouse

const gp = getInterpolate({
  0: 0,
  40: -40
}, extrapolationClamp)
const scaleMap = getInterpolate({
  [- DISTANCE]: 1,
  0: SCALE,
  [DISTANCE]: 1
}, extrapolationClamp)


export default () => {

  dom.div({
    className: "w-full h-[100vh] flex items-center justify-center"
  }).render(() => {
    const mouseLeft = createSignal(-Infinity)
    const mouseRight = createSignal(-Infinity)


    const left = hookSpring(() => {
      return gp(mouseLeft.get())
    })
    const right = hookSpring(() => {
      return gp(mouseRight.get())
    })

    dom.div({
      className: "mx-auto hidden h-16 items-end gap-3 px-2 pb-3 sm:flex relative",
      onMouseMove(e) {
        const { left, right } = e.currentTarget.getBoundingClientRect();
        const offsetLeft = e.clientX - left;
        const offsetRight = right - e.clientX;
        mouseLeft.set(offsetLeft);
        mouseRight.set(offsetRight);
      },
      onMouseLeave(e) {
        mouseLeft.set(-Infinity);
        mouseRight.set(-Infinity);
      }
    }).render(() => {
      dom.div({
        className: "absolute rounded-2xl inset-y-0 bg-gray-700 border border-gray-600 -z-10",
        style: {
          left() {
            return left() + "px"
          },
          right() {
            return right() + "px"
          }
        }
      }).render()
      APPS.forEach(app => {

        let inited = false
        const distance = memo(() => {
          if (inited) {
            return mouseLeft.get() - btn.offsetLeft - btn.offsetWidth / 2;
          } else {
            return mouseLeft.get()
          }
        })

        const scaleBase = memo(() => {
          return scaleMap(distance())
        })
        const scale = hookSpring(scaleBase)
        const x = hookSpring(() => {
          const d = distance();
          if (d === -Infinity) {
            return 0;
          } else if (d < -DISTANCE || d > DISTANCE) {
            return Math.sign(d) * -1 * NUDGE;
          } else {
            return (-d / DISTANCE) * NUDGE * scaleBase();
          }
        })
        const btn = dom.button({
          className: "aspect-square block w-10 rounded-full bg-white shadow origin-bottom",
          style: {
            background: "red",
            // scale,
            transform() {
              return `translate(${x()}px,0px) scale(${scale()})`
            }
          },
          onClick() {
            animate(btn, {
              y: [0, -40, 0]
            }, {
              easing: [
                [0, 0, 0.2, 1],
                [0.8, 0, 1, 1],
              ],
              repeat: 2,
              duration: 0.7
            })
          }
        }).render(() => {
          // dom.span({
          //   className: "bg-gray-700 shadow shadow-black border border-gray-600 px-2 py-1.5 text-sm rounded text-white font-medium"
          // }).renderTextContent(app)
        })
        inited = true
      })
    })
  })
}