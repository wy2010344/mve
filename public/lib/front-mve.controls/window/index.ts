import { NJO, parseHTML, PNJO } from "../../mve-DOM/index"
import { JOChildren } from "../../mve/childrenBuilder"
import { modelChildren } from "../../mve/modelChildren"
import { mve } from "../../mve/util"



export interface FormPanel{
	hide:mve.GValue<boolean>
	render(me:mve.LifeModel,p:DesktopParam,index:mve.GValue<number>):JOChildren<NJO,Node>
	focus?(v:boolean):void
}
export interface DesktopParam{
  width():number,
  height():number,
	model:mve.ArrayModel<FormPanel>
}
export function DesktopIndex(init:(p:DesktopParam)=>PNJO){
	const width=mve.valueOf(0)
	const height=mve.valueOf(0)
	return {
		resize(x:{width:number,height:number}){
			if(x.height!=height()){
				height(x.height)
			}
			if(x.width!=width()){
				width(x.width)
			}
		},
		mve:parseHTML.mve(function(me){
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
				width,
				height,
				model
			}
			return init(p)
		})
	}
}


export function subPanelsOf(subPanels:mve.ArrayModel<FormPanel>,p:DesktopParam){
	const newPool={
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
	element:PNJO
	panels?:JOChildren<NJO,Node>
}

export function formBuilder(k:{
	hide:mve.GValue<boolean>,
	render(me:mve.LifeModel,p:DesktopParam,index:mve.GValue<number>):FormBuilderResult,
	focus?:mve.GValue<void>
}):FormPanel{
	return {
		hide:k.hide,
		focus:k.focus,
		render(me:mve.LifeModel,p:DesktopParam,index:mve.GValue<number>){
			const v=k.render(me,p,index)
			const element=v.element
			element.style=element.style||{}
			element.style.position="absolute"
			element.style.width=v.width
			element.style.height=v.height
			element.style.top=v.top
			element.style.left=v.left
			element.style.display=mb.Object.reDefine(element.style.display,function(v){
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
			let outs:JOChildren<NJO,Node>=[
				element
			]
			if(v.panels){
				outs=outs.concat(v.panels)
			}
			outs.push({
				//遮罩
				type:"div",
				style:{
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
				},
				action:{
					click:v.shadowClick||function(){
						p.model.moveToLast(index())
					}
				}
			})
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