import { dom, DOMNode } from "../../mve-DOM/index";
import { dragMoveHelper } from "../../mve-DOM/other/drag";
import { mve, onceLife } from "../../mve/util";
import { baseResizeForm } from "../window/form";
import { DesktopParam } from "../window/index";
import { modelChildren } from "../../mve/modelChildren"
import { ChildLife, EOChildren } from "../../mve/childrenBuilder";


function initEnv(hide:mve.Value<boolean>,p:DesktopParam,destroy:()=>void){
	const width=mve.valueOf(600)
	const tabs=mve.arrayModelOf<ChromeTab>([])
	const current=mve.valueOf(null)
	const headerHeight=mve.valueOf(30)
	return {
		hide,
		window:p,
		destroy,
		tabs,
		current,
		header:{
			width(){
				return (width() - headerHeight())  / tabs.size()
			},
			height:headerHeight,
			show:mve.valueOf(true)
		},
		width,
		height:mve.valueOf(400),
		left:mve.valueOf(200),
		top:mve.valueOf(300)
	}
}
export type ChromeTabEnv = ReturnType<typeof initEnv>
export interface ChromeTab{
	changeEnv(v:ChromeTabEnv):void
	head:EOChildren<Node>
	body:EOChildren<Node>
	destroy():void
}
/**
 * 一个tab标签页
 */
export function chromeTab(x:{
	env:ChromeTabEnv
	head(me:mve.LifeModel,it:ChromeTab,getENV:()=>ChromeTabEnv):EOChildren<Node>
	body(me:mve.LifeModel,it:ChromeTab,getENV:()=>ChromeTabEnv):EOChildren<Node>
}):ChromeTab{
	const envr=mve.valueOf(x.env)
	let it={
		changeEnv(v:ChromeTabEnv){
			envr(v)
		},
		head:null,
		body:null,
		destroy:null
	}
	const head=dom.root(function(me){
		const left=mve.valueOf(0)
		const top=mve.valueOf(0)
		const onMove=mve.valueOf(false)
		return {
			type:"span",
			children:x.head(me,it,envr),
			style:{
				position:"relative",
				left(){
					return left()+"px"
				},
				display:"inline-block",
				width(){
					return envr().header.width()+"px"
				},
				height(){
					return envr().header.height()+"px"
				},
				"line-height"(){
					return envr().header.height()+"px"
				},
				color(){
					return envr().current()==it?"white":"black";
				},
				"background-color"(){
					return envr().current()==it?"green":"white";
				},
				cursor:"pointer",
				"z-index"(){
					return onMove()?envr().current()==it?envr().tabs.size()+"":"":""
				}
			},
			action:{
				mousedown:dragMoveHelper({
					init(){
						envr().current(it)
						onMove(true)
						if(envr().tabs.size()==1){
							const panel=envr()
							panel.top(panel.top()+panel.header.height())
							panel.header.show(false)
						}
					},
					diff(v){
						if(envr().tabs.size()==1){
							const panel=envr()
							panel.left(panel.left()+v.x)
							panel.top(panel.top()+v.y)
							dynamicFloatWindow(envr())
						}else{
							const lf=left()+v.x
							const tp=top()+v.y
							const oh=envr().header.height()
							if(tp > oh || -tp > oh){
								//单出来
								left(0)
								top(0)
								const oldEnvr=envr()
								const bounds=oldEnvr.window.getBoundingClientRect()
								const x=v.e.x - bounds.left
								const y=v.e.y - bounds.top
								const npanel=chromeWindow(function(env){
									env.left(x - (oldEnvr.header.width() / 2))
									env.top(y + (oldEnvr.header.height() / 2))
									oldEnvr.tabs.removeEqual(it)
									env.current(it)
									env.tabs.push(it)
									it.changeEnv(env)
									env.header.show(false)
									oldEnvr.current(oldEnvr.tabs.getLast())
								})
								oldEnvr.window.model.push(npanel)
							}else{
								const ow=envr().header.width()
								if(lf > ow / 2){
									//向右移动
									const tabs=envr().tabs
									const idx=tabs.indexOf(it)
									if(idx<tabs.size()-1){
										tabs.move(idx,idx+1)
										left(lf - ow) //小于0
									}
								}else
								if(-lf > ow / 2){
									//向左移动
									const tabs=envr().tabs
									const idx=tabs.indexOf(it)
									if(idx>0){
										tabs.move(idx,idx-1)
										left(lf + ow) //大于0
									}
								}else{
									left(lf)
								}
							}
							top(tp)
						}
					},
					cancel(){
						left(0)
						top(0)
						onMove(false)
						dynamicFloatWindow(null)
						if(envr().tabs.size()==1){
							const panel=envr()
							panel.top(panel.top()-panel.header.height())
							panel.header.show(true)
						}
					}
				})
			}
		}
	})
	const body=dom.root(function(me){
		return {
			type:"div",
			style:{
				display(){
					return envr().current()==it ? "":"none"
				}
			},
			children:x.body(me,it,envr)
		}
	})
	const headOut=onceLife(head,true).out
	const bodyOut=onceLife(body,true).out
	//要最后来销毁
	const headDestroy=headOut.destroy
	it.head=[
		ChildLife.of({
			init:headOut.init
		}),
		headOut.element
	]
	const bodyDestroy=bodyOut.destroy
	it.body=[
		ChildLife.of({
			init:bodyOut.init
		}),
		bodyOut.element
	]
	it.destroy=function(){
		if(headDestroy){
			headDestroy()
		}
		if(bodyDestroy){
			bodyDestroy()
		}
	}
	return it
}
const dynamicFloatWindow=mve.valueOf<ChromeTabEnv>(null)
export function chromeWindow(init:(env:ChromeTabEnv)=>void){
	const hide=mve.valueOf(false)
	const panel=baseResizeForm({
		hide:hide,
		render(me,p,rp){
			const out=initEnv(hide,p,function(){
				p.model.removeEqual(panel)
			})
			init(out)
			return {
				allow(){
					return true
				},
				width(){
					return out.width()
				},
				height(){
					if(out.header.show()){
						return out.header.height()+out.height()
					}else{
						return out.height()
					}
				},
				left(){
					return out.left()
				},
				top(){
					return out.top()
				},
				addWidth(w){
					out.width(out.width()+w)
				},
				addHeight(h){
					out.height(out.height()+h)
				},
				addTop(t){
					out.top(out.top()+t)
				},
				addLeft(l){
					out.left(out.left()+l)
				},
				element:dom({
					type:"div",
					style:{
						background:"white"
					},
					destroy(){
						out.tabs.forEach(tab=>{
							tab.destroy()
						})
					},
					children:[
						dom({
							type:"div",
							style:{
								overflow:"hidden",
								"white-space":"nowrap",
								"text-align":"center",
								background:"yellow",
								display(){
									return out.header.show()?"":"none"
								}
							},
							children:modelChildren(out.tabs,function(me,row,i){
								return row.head
							}),
							action:{
								mousedown:dragMoveHelper({
									diffX(x){
										out.left(out.left()+x)
									},
									diffY(y){
										out.top(out.top()+y)
									}
								})
							}
						}),
						dom({
							type:"div",
							style:{
								width(){
									return out.width()+"px"
								},
								height(){
									return out.height()+"px"
								}
							},
							children:modelChildren(out.tabs,function(me,row,i){
								return row.body
							})
						})
					]
				}),
				shadow:dom({
					type:"div",
					action:{
						mouseup(e){
							if(e.offsetY < out.header.height()){
								if(dynamicFloatWindow()){
									const denv=dynamicFloatWindow()
									if(denv!=out){
										const idx=Math.round(e.offsetX / out.header.width())
										const tab=denv.tabs.get(0)
										denv.tabs.removeEqual(tab)
										denv.destroy()
										tab.changeEnv(out)
										out.tabs.insert(idx,tab)
										out.current(tab)
										dynamicFloatWindow(null)
										p.model.push(panel)
									}
								}
							}
						}
					}
				})
			}
		}
	})
	return panel
}