import { fdom, FDomAttributes } from "mve-dom";
import { cns } from "wy-dom-helper";
import { createSignal, GetValue, tw, valueOrGetToGet } from "wy-helper";

export function button(props: FDomAttributes<"button"> & {
  loadingClassName?: string,
  loading?: GetValue<any>
}) {
  const innerLoading = createSignal(false)
  const isLoading = props.loading ? function () {
    return props.loading!() || innerLoading.get()
  } : innerLoading.get
  const newProps = { ...props }
  const loadingClassName = props.loadingClassName || tw`daisy-loading-spinner`
  const className = valueOrGetToGet(newProps.className || '')
  newProps.className = function () {
    return cns('daisy-btn', className(), isLoading() && tw`daisy-btn-disabled daisy-loading ${loadingClassName}`)
  }
  if (newProps.onClick) {
    newProps.onClick = function (e) {
      if (isLoading()) {
        return
      }
      const out = props.onClick!(e) as any
      if (out instanceof Promise) {
        innerLoading.set(true)
        out.finally(() => {
          innerLoading.set(false)
        })
      }
    }
  }
  return fdom.button(newProps)
}