import { dom } from "mve-dom"
import { animateSignal } from "mve-dom-helper";
import { animateFrame, requestBatchAnimationFrame, signalAnimateFrame } from "wy-dom-helper";
import { batchSignalEnd, createSignal, cubicBezier, extrapolationClamp, getInterpolate, getSpringBaseAnimationConfig, getTweenAnimationConfig, getZtaAndOmega0From, memo } from "wy-helper";
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
/**
 * https://buildui.com/recipes/magnified-dock
 */
export default () => {

  dom.div({
    className: "w-full h-[100vh] flex items-center justify-center"
  }).render(() => {
    const mouseLeft = createSignal(-Infinity)
    const mouseRight = createSignal(-Infinity)


    const left = animateSignal(() => {
      return gp(mouseLeft.get())
    })
    const right = animateSignal(() => {
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
        batchSignalEnd()
      },
      onMouseLeave(e) {
        mouseLeft.set(-Infinity);
        mouseRight.set(-Infinity);
        batchSignalEnd()
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
        const scale = animateSignal(scaleBase)
        const x = animateSignal(() => {
          const d = distance();
          if (d === -Infinity) {
            return 0;
          } else if (d < -DISTANCE || d > DISTANCE) {
            return Math.sign(d) * -1 * NUDGE;
          } else {
            return (-d / DISTANCE) * NUDGE * scaleBase();
          }
        }, {
          config: sp
        })

        const y = signalAnimateFrame(0, requestBatchAnimationFrame)
        const btn = dom.button({
          className: "aspect-square block w-10 rounded-full bg-white shadow origin-bottom",
          style: {
            background: "red",
            // scale,
            transform() {
              return `translate(${x()}px,${y.get()}px) scale(${scale()})`
            }
          },
          async onClick() {
            async function fun() {
              await y.animateTo(-40, getTweenAnimationConfig(0.7 / 2 * 1000, cubicBezier(0, 0, 0.2, 1)))
              await y.animateTo(0, getTweenAnimationConfig(0.7 / 2 * 1000, cubicBezier(0.8, 0, 1, 1)))
            }
            await fun()
            await fun()
            await fun()
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