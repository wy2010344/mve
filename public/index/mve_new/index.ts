/**
 * 新起点
 * 1.生命周期不重要，生命周期只是接口需要(实现接口)，从而组合成树状结构，而不是积累，不在单独在过程中声明
 * 2.难点是children内部的混合。children是同一类型，应该可以自定义观察片段，包括if，model，reload
 * 	children时父节点肯定有了。但没有生命周期。
 * 3.单个子节点的更换，只有涉及更换时，才有if这种可能性
 * 4.新mve实现过程完全不考虑兼容老mve免于被拖累，实现完成后再去考虑。完全是数据结构与接口的。然后用prolog的数据结构描述，方便转成别的
 * 
 * 
 * 5.一个元素的完整结构，是有inits\destroys\element，但具体parse之前，可以简写。parser之后是这样
 * 一个元素下层可能有多种复合节点，单元素、多元素。在元素之上的if，if只作用于children，和单子节点的情况
 * 
 * 为什么只处理append和insertBefore?
 * 默认都是append。动态调整是insertBefore。
 * 而不insertAfter和insertBefore。
 * 使用insertBefore，前面的节点变化不影响，后面的变化会影响。
 * 只要有邻近依赖节点都行。
 * 固定片段里不一定有元素。
 * 需要构建树状结构供遍历，parent,children,before,next几个属性
 */

import { JOChildType, superChildrenBuilder } from "./childrenModel"
import { ifChildren } from "./ifChildren"
import DOM = require("../../lib/mve-DOM/DOM")
import { modelChildren } from "./modelChildren"


 

interface NJO{
	type:string,
	id?:(o:any)=>void;
	NS?:string;
	text?: MveItemValue;
	content?:MveItemValue;
	cls?:mve.StringValue;
	value?: MveItemValue;
	attr?: MveItemMap;
	style?: mve.StringMap;
	prop?:{ [key: string]:mve.TValue<string|number|boolean>};
	action?: { [key: string]: ((e: Event) => void) };
	children?:JOChildType<NJO,HTMLElement,HTMLElement>[]
}
function bind<T>(me:mve.Inner,value:mve.TValue<T>,fun:(v:T)=>void){
	if(typeof(value)=='function'){
		me.Watch({
			exp(){
				return (value as any)()
			},
			after:fun
		})
	}else{
		fun(value)
	}
}
function bindKV<T>(me:mve.Inner,map:{ [key: string]: mve.TValue<T>},fun:(k:string,v:T)=>void){
	mb.Object.forEach(map,function(v,k){
		bind(me,map[k],function(v){
			fun(k,v)
		})
	})
}
const buildChildren=superChildrenBuilder<NJO,HTMLElement,HTMLElement>({
	parseChild(me,child){
		const el=DOM.createElement(child.type)
		if(child.id){
			child.id(el)
		}
		if(child.text){
			bind(me,child.text,function(v){
				DOM.content(el,v)
			})
		}
		if(child.value){
			bind(me,child.value,function(v){
				DOM.value(el,v)
			})
		}
		if(child.style){
			bindKV(me,child.style,function(k,v){
				DOM.style(el,k,v)
			})
		}
		if(child.attr){
			bindKV(me,child.attr,function(k,v){
				DOM.attr(el,k,v)
			})
		}
		if(child.action){
			mb.Object.forEach(child.action,function(v,k){
				DOM.action(el,k,v)
			})
    }
    const childResult=child.children?buildChildren(me,el,child.children):null
		return {
			element:el,
			init(){
        if(childResult){
          childResult.init()
        }
      },
			destroy(){
        if(childResult){
          childResult.destroy()
        }
      }
		}
	},
	insertBefore(pel,newEL,oldEL){
		// mb.log("insertBefore",newEL,oldEL)
    DOM.insertChildBefore(pel,newEL,oldEL)
  },
  append(pel,el){
		// mb.log("append",el)
    DOM.appendChild(pel,el)
  },
	remove(pel,el){
		// mb.log("remove",el)
		DOM.removeChild(pel,el)
  }
})


export=mve(function(me){
	let centerV:HTMLDivElement
	const div=mve.Value(1)

	function ifChildrenOf(flag:number,num:number){
		return ifChildren(function(){
			if(div()%num==0){
				return []
			}else{
				return [
					{
						type:"div",
						text(){
							return flag+"标签"+div()%num
						}
					}
				]
			}
		})
	}

	const model=mve.ArrayModel([1,2,3])
	return {
		init(){
		 const ch=buildChildren(me,centerV,[
			 {
				 type:"button",
				 style:{
					 background:"gray"
				 },
				 text(){
					 return "当前计数"+div()
				 },
				 action:{
					 click(){
						 div(div()+1)
						 const flag=div()%7
						 let x=model.size()%7
						 mb.log(flag,x<model.size(),x,model.size())
						 model.insert(x,flag)
						 /*
						 model.unshift(model.size()+1)
						 */
					 }
				 }
			 },
			 ifChildrenOf(1,2),
			 ifChildrenOf(2,5),
			 modelChildren(model,function(me,row,index){
				 return [
					 ifChildrenOf(131,3),
					 {
						 type:"div",
						 style:{
							background:"yellow"
						 },
						 text:row+""
					 },
					 ifChildrenOf(141,7),
				 ] as NJO[]
			 }),
			 ifChildrenOf(5,13)
		 ])
		 ch.init()
		},
		element:{
			type:"div",
			id(v){
				centerV=v
			}
		}
	}
})