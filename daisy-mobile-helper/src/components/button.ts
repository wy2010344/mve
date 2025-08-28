import { fdom, FDomAttributes } from "mve-dom";
import { cns } from "wy-dom-helper";
import { createSignal, GetValue, tw, valueOrGetToGet } from "wy-helper";

export function button(props: FDomAttributes<"button"> & {
  loadingClassName?: string,
  loading?: GetValue<any>
}) {
  const newProps = { ...props }
  const loadingClassName = props.loadingClassName || tw`daisy-loading-spinner`
  const className = valueOrGetToGet(newProps.className || '')
  if (props.onClick) {
    const n = toButtonClick(props as any)
    newProps.onClick = n.onClick
    newProps.loading = n.loading
  }
  newProps.className = function () {
    return cns('daisy-btn', className(), newProps.loading?.() && tw`daisy-btn-disabled daisy-loading ${loadingClassName}`)
  }
  return fdom.button(newProps)
}

export function toButtonClick<T>({
  onClick,
  loading
}: {
  loading?: GetValue<any>
  onClick(v: T): any
}) {
  const innerLoading = createSignal(false)
  const isLoading = loading ? function () {
    return loading!() || innerLoading.get()
  } : innerLoading.get
  return {
    loading: isLoading,
    onClick(v: T) {
      if (isLoading()) {
        return
      }
      const out = onClick!(v) as any
      if (out instanceof Promise) {
        innerLoading.set(true)
        out.finally(() => {
          innerLoading.set(false)
        })
      }
    }
  }
}