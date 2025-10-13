// import { createNodeTempOps, } from "./util"
// import { addRender, getEnvModel, hookAddResult, hookBeginTempOps, hookEndTempOps } from "better-react"
import {
  BDomAttribute,
  BDomEvent,
  DataAttr,
  DomElement,
  DomElementType,
  React,
} from 'wy-dom-helper';
import { createOrProxy, emptyObject } from 'wy-helper';
import { domTagNames, updateDomProps } from 'wy-dom-helper';
import { NodeCreater, StyleGetProps, StyleProps } from './node';
import { OrFun } from 'mve-core';

function create(type: string) {
  return document.createElement(type);
}

type DomAttribute<T extends DomElementType> = BDomAttribute<T> &
  React.AriaAttributes &
  DataAttr;
/**
 * 静态的
 * 动态的
 */
type DomEffectAttr<T extends DomElementType> =
  | (OrFun<DomAttribute<T>> & StyleProps & BDomEvent<T>)
  | (() => DomAttribute<T> & StyleGetProps);
type DomCreater<key extends DomElementType> = NodeCreater<
  key,
  DomElement<key>,
  DomEffectAttr<key>
>;
export const dom: {
  readonly [key in DomElementType]: {
    (props?: DomEffectAttr<key>): DomCreater<key>;
  };
} = createOrProxy(domTagNames, tag => {
  return function (args: any) {
    const creater = NodeCreater.instance;
    creater.type = tag as any;
    creater.create = create;
    creater.updateProps = updateDomProps;

    creater.attrsEffect = args;
    return creater;
  } as any;
});
