import { batchSignalEnd, createSignal, emptyFun, EmptyFun, emptyObject, delay as delayFun, } from "wy-helper";
import { fakeRoute } from "mve-dom-helper";
import { currentHref, routerConsume } from "mve-dom-helper/history";
export function routerDelayClose({
  afterClose = emptyFun,
  delay = 300,
  initDelay = 50
}: {
  afterClose?: EmptyFun
  delay?: number,
  initDelay?: number
} = emptyObject) {
  const { router } = routerConsume()
  const showOpen = createSignal(false)
  let closeIt = emptyFun
  const int = setTimeout(() => {
    showOpen.set(true)
    closeIt = fakeRoute(async function () {
      showOpen.set(false)
      batchSignalEnd()
      await delayFun(delay)
      afterClose()
    })
    router.push(currentHref())
  }, initDelay)
  return {
    close() {
      if (showOpen.get()) {
        router.back()
        closeIt()
        clearTimeout(int)
      }
    },
    show: showOpen.get
  }
}