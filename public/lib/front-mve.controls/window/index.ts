import { dom, DOMNodeAll, DOMNode, reWriteAction, reWriteDestroy, reWriteInit, StyleMap, ActionMap } from "../../mve-DOM/index"
import { EOChildren } from "../../mve/childrenBuilder"
import { modelChildren } from "../../mve/modelChildren"
import { mve } from "../../mve/util"



export interface FormPanel{
	render(me:mve.LifeModel,p:DesktopParam,index:mve.GValue<number>):EOChildren<Node>
	focus?(v:boolean):void
}
export interface DesktopParam{
	getBoundingClientRect():DOMRect
  width():number,
  height():number,
	model:mve.ArrayModel<FormPanel>
}

export function DesktopIndex(init:(p:DesktopParam)=>DOMNode){
	return function(){
		const width=mve.valueOf(0)
		const height=mve.valueOf(0)
		return dom.root(function(me){
			const model=mve.arrayModelOf<FormPanel>([])
			const move=model.move.bind(model)
			model.move=function(fromIndex,targetIndex){
				/**重写*/
				const lastIndex=model.size()-1
				if(targetIndex==lastIndex){
					const lastRow=model.get(lastIndex)
					const row=model.get(fromIndex)
					if(row!=lastRow){
						if(lastRow.focus){
							lastRow.focus(false)
						}
						if(row.focus){
							row.focus(true)
						}
					}
				}
				move(fromIndex,targetIndex)
			}
			const insert=model.insert.bind(model)
			model.insert=function(index,row){
				const idx=model.indexOf(row)
				if(idx<0){
					//不在视图中，置入
					insert(index,row)
				}else{
					//已经存在于视图中，聚焦
					model.moveToLast(idx)
				}
			}
			const p:DesktopParam={
				getBoundingClientRect(){
					return element.getBoundingClientRect()
				},
				width,
				height,
				model
			}
			function resize(){
				const w=document.body.clientWidth
				const h=document.body.clientHeight
				if(w!=width()){
					width(w)
				}
				if(h!=height()){
					height(h)
				}
			}
			const njo=init(p)
			njo.style=njo.style||{}
			if(njo.style.position!="absolute"){
				njo.style.position="relative"
			}
			let element:HTMLDivElement
			reWriteInit(njo,function(init){
				init.push(function(v){
					element=v
					mb.DOM.addEvent(window,"resize",resize)
					resize()
				})
				return init
			})
			reWriteDestroy(njo,function(destroy){
				destroy.unshift(function(v){
					mb.DOM.removeEvent(window,"resize",resize)
				})
				return destroy
			})
			return njo
		})
	}
}


export function subPanelsOf(subPanels:mve.ArrayModel<FormPanel>,p:DesktopParam){
	const newPool:DesktopParam={
		getBoundingClientRect:p.getBoundingClientRect,
		width:p.width,
		height:p.width,
		model:subPanels
	}
	return modelChildren(subPanels,function(me,row,i){
		return row.render(me,newPool,i)
	})
}

export interface FormBuilderResult{
  left:mve.TValue<string>
  top:mve.TValue<string>
  width:mve.TValue<string>
	height:mve.TValue<string>
	shadowClick?():void
	style?:StyleMap
	element:EOChildren<Node>
	/**遮罩*/
	shadow?:EOChildren<Node>
	shadowStyle?:StyleMap
	shadowAction?:ActionMap
	panels?:EOChildren<Node>
}

export function formBuilder(k:{
	hide:mve.GValue<boolean>,
	render(me:mve.LifeModel,p:DesktopParam,index:mve.GValue<number>):FormBuilderResult,
	focus?:mve.GValue<void>
}):FormPanel{
	return {
		focus:k.focus,
		render(me:mve.LifeModel,p:DesktopParam,index:mve.GValue<number>){
			const v=k.render(me,p,index)
			const element=v.element


			v.style=v.style||{}
			const style=mb.Object.ember(v.style,{
				position:"absolute",
				width:v.width,
				height:v.height,
				top:v.top,
				left:v.left,
				display:mb.Object.reDefine(v.style.display,function(v){
					if(typeof(v)=='function'){
						//如果是函数
						return mve.reWriteMTValue(v,function(v){
							return k.hide()?"none":v
						})
					}else{
						return function(){
							return k.hide()?"none":v
						}
					}
				})
			})
			let outs:EOChildren<Node>[]=[
				dom({
					type:"div",
					style,
					children:element
				})
			]
			if(v.panels){
				outs=outs.concat(v.panels)
			}
			v.shadowAction=v.shadowAction||{}
			reWriteAction(v.shadowAction,'click',function(vs){
				vs.push(v.shadowClick||function(){
					p.model.moveToLast(index())
				})
				return vs
			})
			outs.push(dom({
				type:"div",
				style:mb.Object.ember(v.shadowStyle||{},{
					position:"absolute",
					width:v.width,
					height:v.height,
					top:v.top,
					left:v.left,
					background:"gray",
					opacity:"0.1",
					display(){
						if(k.hide()){
							return "none"
						}else{
							return p.model.size()-1==index()?"none":"";
						}
					}
				}),
				action:v.shadowAction
			}))
			return outs
		}
	}
}


export function buildSubPanel(p:DesktopParam){
	const panels:FormPanel[]=[]
	return {
		/**移除模式DOM元素不复用 */
		add(get:(set:(v:FormPanel)=>void)=>void){
			let thePanel:FormPanel
			let onLoad=false
			return function(){
				if(thePanel){
					p.model.push(thePanel)
				}else{
					if(!onLoad){
						onLoad=true
						get(function(panel){
							thePanel=panel
							panels.push(thePanel)
							p.model.push(thePanel)
							onLoad=false
						})
					}
				}
			}
		},
		/**隐藏模式 */
		addHide(get:(set:(v:FormPanel,hide:mve.Value<boolean>)=>void)=>void){
			let thePanel:FormPanel
			let onLoad=false
			let theHide:mve.Value<boolean>
			return function(){
				if(thePanel){
					theHide(false)
					p.model.push(thePanel)
				}else{
					if(!onLoad){
						onLoad=true
						get(function(panel,hide){
							thePanel=panel
							theHide=hide
							hide(false)
							panels.push(thePanel)
							p.model.push(thePanel)
							onLoad=false
						})
					}
				}
			}
		},
		destroy(){
			panels.forEach(panel=>p.model.removeEqual(panel))
		}
	}
}