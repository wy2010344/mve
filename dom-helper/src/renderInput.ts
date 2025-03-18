import { OrFun, renderFDom } from "mve-dom";
import { hookTrackSignal, useVersion } from "mve-helper";
import { BDomEvent, DomElement, DomElementType, FDomAttribute } from "wy-dom-helper";
import { HTMLContentEditableFixCache, InputEditCache, TextContentEditableFixCache } from 'wy-dom-helper/contentEditable'
import { addEffect, batchSignalEnd, EmptyFun, emptyFun, SetValue, ValueOrGet, valueOrGetToGet } from "wy-helper";


export type TriggerTime = "onInput" | "onBlur"
type InputTypeProps<T extends DomElementType> = OrFun<FDomAttribute<T>> & BDomEvent<T> & {
  triggerTime?: ValueOrGet<TriggerTime>,
  value?: ValueOrGet<string | number>
  onValueChange(v: string): void
}

export type TextareaProps = InputTypeProps<'textarea'>
export type InputProps = Omit<InputTypeProps<"input">, 'type'> & {
  /**
   * 不支持那几项
   */
  type?: ValueOrGet<Exclude<FDomAttribute<'input'>['type'],
    'checkbox'
    | 'button'
    | 'hidden'
    | 'radio'
    | 'reset'
    | 'submit'
    | 'image'>>
}

// //这个需要处理select-change
// function useUpdateValue2<V>(
//   cache: EditFixCache<any, V>,
//   _getValue: ValueOrGet<V>,
//   getDep: EmptyFun) {

//   const getValue = valueOrGetToGet(_getValue)
//   hookTrackSignal(() => {
//     getDep()
//     const value = getValue()
//     //必须依赖旧值,更新新值,所以在0
//     addEffect(() => {
//       cache.change(value)
//     })
//   })
// }

abstract class Cache<V> {
  abstract getValue(): V
  abstract setValue(v: V): void
  equals(a: V, b: V) {
    return a === b
  }
}

class InputCache extends Cache<string> {
  constructor(
    private input: HTMLInputElement
  ) { super() }
  getValue(): string {
    return this.input.value
  }
  setValue(v: string): void {
    this.input.value = v
  }
  static from(input: HTMLInputElement) {
    return new InputCache(input)
  }
}
//这个不需要处理select-change
function useUpdateValue<V>(
  _getValue: ValueOrGet<V>,
  cache: Cache<V>,
  getDep: EmptyFun,
) {
  const getValue = valueOrGetToGet(_getValue)
  const effect: {
    value: V
    (): void
  } = function () {
    cache.setValue(effect.value)
  } as any
  hookTrackSignal(() => {
    getDep()
    const value = getValue()
    if (value !== cache.getValue()) {
      //必须用实时值去改!!!
      effect.value = value
      addEffect(effect)
    }
  })
}

function useTrigger<
  E,
  V
>(
  triggerTime: ValueOrGet<TriggerTime> = "onInput",
  props: Record<string, any>,
  value: ValueOrGet<V>,
  onValueChange: (v: V) => void,
  render: (props: Record<string, any>) => E,
  createCache: (n: E) => Cache<V>
) {
  //只是为了强制这个模块更新
  /**
   * updateVersion起的作用只是强制撤销,即禁止输入
   * 因为输入成功,value会变,自动触发同步比较与合并value
   */
  const [version, updateVersion] = useVersion()
  const getTriggerTime = valueOrGetToGet(triggerTime)
  const onInput = props.onInput
  props.onInput = (e: any) => {
    if (getTriggerTime() == 'onInput') {
      const newValue = cache.getValue()
      updateVersion()
      onValueChange(newValue)
      onInput?.(e)
      batchSignalEnd()
    } else {
      onInput?.(e)
    }
  }
  const onBlur = props.onBlur
  props.onBlur = (e: any) => {
    if (getTriggerTime() == 'onBlur') {
      const newValue = cache.getValue()
      updateVersion()
      onValueChange(newValue)
      batchSignalEnd()
    } else {
      onBlur?.(e)
    }
  }
  const input = render(props)
  const cache = createCache(input)
  // useUpdateValue2(cache, value, version);
  useUpdateValue(value, cache, version)
  return input
}


export function renderInput(type: "textarea", args: TextareaProps): HTMLTextAreaElement
export function renderInput(type: "input", props: InputProps): HTMLInputElement
export function renderInput(
  type: any,
  {
    value,
    onValueChange,
    triggerTime,
    ...props
  }: any
) {
  return useTrigger(triggerTime, props, value, onValueChange, props => {
    return renderFDom(type, props)
  }, InputCache.from) as any
}



export type ContentEditableProps<T extends DomElementType> = OrFun<FDomAttribute<T>> & BDomEvent<T> & {
  triggerTime?: ValueOrGet<TriggerTime>
  value?: ValueOrGet<string | number>
  valueType?: "html" | "text"
  onValueChange(v: string): void
}

class ContentTextCache extends Cache<string | null> {
  constructor(
    private input: HTMLElement
  ) { super() }
  getValue() {
    return this.input.textContent
  }
  setValue(v: string | null): void {
    this.input.textContent = v
    contentDidChange(this.input)
  }
  static from<T extends HTMLElement>(input: T) {
    return new ContentTextCache(input)
  }
}
class ContentHTMLCache extends Cache<string> {
  constructor(
    private input: HTMLElement
  ) { super() }
  getValue() {
    return this.input.innerHTML
  }
  setValue(v: string): void {
    this.input.innerHTML = v
    contentDidChange(this.input)
  }
  static from<T extends HTMLElement>(input: T) {
    return new ContentHTMLCache(input)
  }
}
export function renderContentEditable<T extends DomElementType>(
  type: T,
  arg: ContentEditableProps<T>
): DomElement<T> {
  const {
    value,
    onValueChange,
    triggerTime,
    valueType = 'text',
    ...props
  } = arg as any
  return useTrigger(triggerTime, props, value, onValueChange, props => {
    return renderFDom(type, props as any)
  }, valueType == 'text' ? ContentTextCache.from : ContentHTMLCache.from)
}

//这里倒是跟input类似了,外部设值失败后光标始终到最后
//但禁止设值,光标是不应该变动的..
//仍然使用这个,因为光标可能在文字未变动时变化却观察不到
function contentDidChange(v: HTMLElement) {
  if (document.activeElement == v) {
    //将光标移到最后
    const range = document.createRange();
    range.selectNodeContents(v);
    range.collapse(false); // 让光标移动到 `range` 末尾
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
}


class InputCheckCache extends Cache<boolean> {
  constructor(
    private input: HTMLInputElement
  ) { super() }
  getValue() {
    return this.input.checked
  }
  setValue(v: boolean): void {
    this.input.checked = v
  }
  static from(input: HTMLInputElement) {
    return new InputCheckCache(input)
  }
}

export type InputBoolProps = OrFun<Omit<FDomAttribute<'input'>, 'type'> & {
  type: "checkbox" | "radio"
  checked: boolean
}> & BDomEvent<"input">
export function renderInputBool({
  checked: _checked,
  onInput,
  ...props
}: InputBoolProps) {
  const checked = valueOrGetToGet(_checked)
  //只是为了强制这个模块更新
  const [version, updateVersion] = useVersion()
  const input = renderFDom("input", {

    /**
     * 使用onInput实时事件,而不是使用onKeyUp与onCompositionEnd
     * @param e 
     */
    ...props,
    onInput(e: any) {
      updateVersion()
      onInput?.(e)
      batchSignalEnd()
    },
  })
  useUpdateValue(checked, InputCheckCache.from(input), version)
  return input
}