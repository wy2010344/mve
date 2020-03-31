import DOM = require("../DOM")
import { VirtualChildParam } from "../../mve/virtualTreeChildren"
import { mve } from "../../mve/util"

export class DOMVirtualParam implements VirtualChildParam<HTMLElement>{
	constructor(
		private pel:HTMLElement
	){}
	append(el){
		DOM.appendChild(this.pel,el)
	}
	remove(el){
		DOM.removeChild(this.pel,el)
	}
	insertBefore(el,oldEl){
		DOM.insertChildBefore(this.pel,el,oldEl)
	}
}


export type StringValue=mve.TValue<string>
export type ItemValue=mve.TValue<string|number>
export type ItemMap={[key:string]:ItemValue}
export type PropMap={ [key: string]:mve.TValue<string|number|boolean>}
export type StringMap={[key:string]:StringValue}
export type ActionMap={[key: string]: ((e) => void)}