export default function () {

}


type InstanceCallbackOrValue<T> = T | ((n: AbsoluteNode) => T)

interface AbsoluteNode {
  x?: InstanceCallbackOrValue<number>
  y?: InstanceCallbackOrValue<number>
  width?: InstanceCallbackOrValue<number>
  height?: InstanceCallbackOrValue<number>
}