import { fdom, mdom, OrFun, renderFDom } from "mve-dom";
import { hookTrackSignal, useVersion } from "mve-helper";
import { BDomEvent, ComponentValueCache, ContentHTMLCache, ContentTextCache, DomElement, DomElementType, FDomAttribute, InputCache, InputCheckCache, React } from "wy-dom-helper";
import { HTMLContentEditableFixCache, InputEditCache, TextContentEditableFixCache } from 'wy-dom-helper/contentEditable'
import { addEffect, anyStoreTransform, batchSignalEnd, Compare, createSignal, EmptyFun, emptyFun, emptyObject, GetValue, quote, SetValue, simpleEqual, simpleNotEqual, storeRef, StoreTransform, ValueOrGet, valueOrGetToGet } from "wy-helper";


export type TriggerTime = "onInput" | "onBlur"
//这个不需要处理select-change
function useUpdateValue<V, F>(
  getValue: GetValue<F>,
  transform: StoreTransform<F, V>,
  cache: ComponentValueCache<any, V>,
  getDep: EmptyFun,
) {
  const effect: {
    value: V
    (): void
  } = function () {
    cache.set(effect.value)
  } as any
  hookTrackSignal(() => {
    getDep()
    const v = getValue()
    if (transform.shouldChange(v, cache.get())) {
      //必须用实时值去改!!!
      effect.value = transform.toComponentValue(v)
      addEffect(effect)
    }
  })
}

function useTrigger<
  E extends HTMLElement,
  V,
  F
>(
  value: GetValue<F>,
  setValue: SetValue<F>,
  transform: StoreTransform<F, V>,
  cache: ComponentValueCache<E, V>,
  triggerTime?: ValueOrGet<TriggerTime>
) {

  //只是为了强制这个模块更新
  /**
   * updateVersion起的作用只是强制撤销,即禁止输入
   * 因为输入成功,value会变,自动触发同步比较与合并value
   */
  const [version, updateVersion] = useVersion()
  const getTriggerTime = valueOrGetToGet(triggerTime || 'onInput')
  cache.input.addEventListener("input", function (e) {
    if (getTriggerTime() == 'onInput') {
      updateVersion()
      transform.fromComponent(cache.get(), setValue)
      batchSignalEnd()
    }
  })
  cache.input.addEventListener("blur", function (e) {
    if (getTriggerTime() == 'onBlur') {
      updateVersion()
      transform.fromComponent(cache.get(), setValue)
      batchSignalEnd()
    }
  })
  useUpdateValue(value, transform, cache, version)
}
/**
 * 这里的input,type不支持    
 *  'checkbox'
    | 'button'
    | 'hidden'
    | 'radio'
    | 'reset'
    | 'submit'
    | 'image'>>
 * @param param0 
 * @returns 
 */
export function renderInputTrans<T extends 'textarea' | 'input', B>(
  transform: StoreTransform<B, string>,
  getValue: GetValue<B>,
  setValue: SetValue<B>,
  div: DomElement<T>,
  triggerTime?: ValueOrGet<TriggerTime>,
) {
  useTrigger(getValue, setValue, transform || anyStoreTransform, new InputCache(div as HTMLInputElement), triggerTime)
  return div
}
export function renderInput<T extends 'textarea' | 'input',>(
  getValue: GetValue<string>,
  setValue: SetValue<string>,
  div: DomElement<T>,
  triggerTime?: ValueOrGet<TriggerTime>,
) {
  return renderInputTrans(anyStoreTransform as StoreTransform<string, string>, getValue, setValue, div, triggerTime)
}

export function renderContentEditableTrans<T extends DomElementType, B>(
  transform: StoreTransform<B, string | null>,
  getValue: GetValue<B>,
  setValue: SetValue<B>,
  div: DomElement<T>,
  triggerTime?: ValueOrGet<TriggerTime>
) {
  useTrigger(getValue, setValue, transform, new ContentTextCache(div), triggerTime)
  return div
}
export function renderContentEditable<T extends DomElementType>(
  getValue: GetValue<string | null>,
  setValue: SetValue<string | null>,
  div: DomElement<T>,
  triggerTime?: ValueOrGet<TriggerTime>
) {
  return renderContentEditableTrans(anyStoreTransform as StoreTransform<string | null, string | null>, getValue, setValue, div, triggerTime)
}
export function renderContentEditableHtmlTrans<T extends DomElementType, B>(
  transform: StoreTransform<B, string>,
  getValue: GetValue<B>,
  setValue: SetValue<B>,
  div: DomElement<T>,
  triggerTime?: ValueOrGet<TriggerTime>
) {
  useTrigger(getValue, setValue, transform, new ContentHTMLCache(div), triggerTime)
  return div
}

export function renderContentEditableHtml<T extends DomElementType>(getValue: GetValue<string>,
  setValue: SetValue<string>,
  div: DomElement<T>,
  triggerTime?: ValueOrGet<TriggerTime>
) {
  return renderContentEditableHtmlTrans(anyStoreTransform as StoreTransform<string, string>, getValue, setValue, div, triggerTime)
}


/**
 * 这里的input,value只支持checkbox、radio
 * @param param0 
 * @returns 
 */
export function renderInputBoolTrans<B>(
  getValue: GetValue<B>,
  setValue: SetValue<B>,
  input: HTMLInputElement,
  transfrom: StoreTransform<B, boolean>
) {
  //只是为了强制这个模块更新
  const [version, updateVersion] = useVersion()
  input.addEventListener('input', function (e) {
    updateVersion()
    transfrom.fromComponent(input.checked, setValue)
    batchSignalEnd()
  })
  useUpdateValue(getValue, transfrom, new InputCheckCache(input), version)
  return input
}

export function renderInputBool(
  getValue: GetValue<boolean>,
  setValue: SetValue<boolean>,
  input: HTMLInputElement) {
  return renderInputBoolTrans(getValue, setValue, input, anyStoreTransform as StoreTransform<boolean, boolean>)
}