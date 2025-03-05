import { OrFun, renderFDom } from "mve-dom";
import { hookTrackSignal, useVersion } from "mve-helper";
import { BDomEvent, DomElement, DomElementType, FDomAttribute } from "wy-dom-helper";
import { batchSignalEnd, EmptyFun, emptyFun, ValueOrGet, valueOrGetToGet } from "wy-helper";


export type TriggerTime = "onInput" | "onBlur"
type InputTypeProps<T extends DomElementType> = OrFun<FDomAttribute<T>> & BDomEvent<T> & {
  triggerTime?: ValueOrGet<TriggerTime>,
  value?: ValueOrGet<string>
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

function useUpdateValue<K extends string, V>(
  _getValue: ValueOrGet<V>,
  input: {
    [key in K]: V | null
  },
  key: K,
  getDep: EmptyFun
) {
  const getValue = valueOrGetToGet(_getValue)
  hookTrackSignal(() => {
    getDep()
    const value = getValue()
    if (value != input[key]) {
      //必须用实时值去改!!!
      input[key] = value
    }
  })
}

function useTrigger<
  K extends string,
  N extends {
    [key in K]: string | null
  }
>(
  triggerTime: ValueOrGet<TriggerTime> = "onInput",
  props: Record<string, any>,
  value: ValueOrGet<string> = "",
  onValueChange: (v: string) => void,
  render: (props: Record<string, any>) => N,
  key: K
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
      const newValue = input[key] || ''
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
      const newValue = input[key] || ''
      updateVersion()
      onValueChange(newValue)
      batchSignalEnd()
    } else {
      onBlur?.(e)
    }
  }
  const input = render(props)
  useUpdateValue(value, input, key, version)
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
  }, 'value') as any
}



export type ContentEditableProps<T extends DomElementType> = OrFun<FDomAttribute<T>> & BDomEvent<T> & {
  triggerTime?: ValueOrGet<TriggerTime>,
  value?: ValueOrGet<string>
  onValueChange(v: string): void
}
export function renderContentEditable<T extends DomElementType>(
  type: T,
  arg: ContentEditableProps<T>
): DomElement<T> {
  const {
    value,
    onValueChange,
    triggerTime,
    ...props
  } = arg as any
  return useTrigger(triggerTime, props, value, onValueChange, props => {
    return renderFDom(type, props as any)
  }, 'textContent')
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
  useUpdateValue(checked, input, 'checked', version)
  return input
}