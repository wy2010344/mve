import { DesktopParam, formBuilder } from "./index";
import { buildTitle } from "./title";
import { NJO, PNJO, StyleMap } from "../../mve-DOM/index";
import { mve } from "../../mve/util";
import { dragMoveHelper, dragResizeHelper } from "../../mve-DOM/other/drag";
import { resizeZoom } from "../../mve-DOM/other/resize";
import { JOChildren } from "../../mve/childrenBuilder";
export interface BaseResizeFormParam{
	move(e:MouseEvent):void
	index:mve.GValue<number>
}
/**
 * 标题栏可以放在顶部，也可以放在底部
 * 首先没有标题栏，只有位置可变化
 * 最大化禁止外部位置变化，但不禁止内部的业务尺寸
 * 不使用绝对尺寸，是为了兼容最大化。
 * 很可能有移动，先做好
 * @param fun 
 */
export function baseResizeForm(x:{
	hide:mve.GValue<boolean>
	render(me:mve.LifeModel,p:DesktopParam,r:BaseResizeFormParam):{
		shadowClick?():void
    allow():boolean,
    width():number,
    height():number,
    left():number,
    top():number,
    addWidth(w:number):void,
    addHeight(h:number):void,
    addTop(t:number):void,
    addLeft(l:number):void
    element:PNJO
		panels?:JOChildren<NJO,Node>
	},
	focus?:mve.GValue<void>
}){
  return formBuilder({
		hide:x.hide,
		focus:x.focus,
		render(me,p,index){
			const result=x.render(me,p,{
				move:dragMoveHelper({
					diffX(x){
						result.addLeft(x)
					},
					diffY(y){
						result.addTop(y)
					}
				}),
				index
			})
			const zoom=resizeZoom({
				allow:result.allow,
				resize:dragResizeHelper({
					allow:result.allow,
					addTop:result.addTop,
					addHeight:result.addHeight,
					addLeft:result.addLeft,
					addWidth:result.addWidth
				})
			})
			const element=result.element
			element.style=element.style||{}
			function currentWidth(){
				return result.width()+"px"
			}
			function currentHeight(){
				return result.height()+"px"
			}
			addShadow(element.style)
			return {
				left(){return result.left()+"px"},
				top(){return result.top()+"px" },
				width:currentWidth,
				height:currentHeight,
				panels:result.panels,
				element:{
					type:"div",
					children:[
						element,
						...zoom
					]
				}
			}
		}
	})
}
export interface ResizeFormParam{
  out:{
    left:mve.Value<number>,
    top:mve.Value<number>,
    width:mve.Value<number>,
    height:mve.Value<number>,
	},
	index:mve.GValue<number>
  move(e:MouseEvent):void
}
export function resizeForm(
  fun:(me:mve.LifeModel,p:DesktopParam,r:ResizeFormParam)=>{
		shadowClick?():void
    allow():boolean,
    element:PNJO
  },focus?:mve.GValue<void>){
    const rect={
      left:mve.valueOf(20),
      top:mve.valueOf(20),
      width:mve.valueOf(400),
			height:mve.valueOf(200),
			hide:mve.valueOf(false)
    }
    return {
      out:rect,
      panel:baseResizeForm({
				hide:rect.hide,
				focus,
				render(me,p,r){
					const result=fun(me,p,{
						out:rect,
						index:r.index,
						move:r.move
					})
					return {
						shadowClick:result.shadowClick,
						allow:result.allow,
						element:result.element,
						addHeight(h){
							rect.height(rect.height()+h)
						},
						addLeft(l){
							rect.left(rect.left()+l)
						},
						addTop(t){
							rect.top(rect.top()+t)
						},
						addWidth(w){
							rect.width(rect.width()+w)
						},
						width(){
							return rect.width()
						},
						height(){
							return rect.height()
						},
						top(){
							return rect.top()
						},
						left(){
							return rect.left()
						},
					}
				}
			})
    }
}
export interface TitleResizeFormParam{
  out:{
    left:mve.Value<number>,
    top:mve.Value<number>,
    width:mve.Value<number>,
    height:mve.Value<number>,
    max:mve.Value<boolean>,
    resizeAble:mve.Value<boolean>
    showClose:mve.Value<boolean>
		showMax:mve.Value<boolean>
		hide:mve.Value<boolean>
	},
	index:mve.GValue<number>
  innerWidth():number,
	innerHeight():number
	hideToFirst():void
	showAtLast():void
}
export type TopTitleResizeForm=ReturnType<typeof topTitleResizeForm>
export function topTitleResizeForm(
  fun:(me:mve.LifeModel,p:DesktopParam,r:TitleResizeFormParam)=>{
    title:mve.TValue<string>
    element:PNJO
		panels?:JOChildren<NJO,Node>
		close?():void
		init?():void
		destroy?():void
		shadowClick?():void
  },
  focus?:mve.GValue<void>
){
  const out={
    left:mve.valueOf(20),
    top:mve.valueOf(20),
    width:mve.valueOf(400),
    height:mve.valueOf(600),
    max:mve.valueOf(false),
    resizeAble:mve.valueOf(true),
    showClose:mve.valueOf(true),
		showMax:mve.valueOf(true),
		hide:mve.valueOf(false)
	}
  return {
    out,
    panel:baseResizeForm({
			hide:out.hide,
			render(me,p,rp){
				const rect={
					out,
					index:rp.index,
					innerHeight(){
						if(out.max()){
							return p.height() - 20 - 10
						}else{
							return out.height()
						}
					},
					innerWidth(){
						if(out.max()){
							return p.width() - 10
						}else{
							return out.width()
						}
					},
					hideToFirst(){
						out.hide(true)
						p.model.moveToFirst(rp.index())
					},
					showAtLast(){
						out.hide(false)
						p.model.moveToLast(rp.index())
					}
				}
				const result=fun(me,p,rect)
				const title=buildTitle({
					move:rp.move,
					title:result.title,
					close_click(){
						if(result.close){
							result.close()
						}else{
							p.model.remove(rp.index())
						}
					},
					max:out.max,
					showClose:out.showClose,
					showMax:out.showMax
				})
				const element=result.element
				element.style=element.style||{}
				element.style.width=function(){
					return rect.innerWidth() +"px"
				}
				element.style.height=function(){
					return rect.innerHeight() +"px"
				}
				/*
				element.style.background=function(){
					return gstate()?"#f0f3f9":"black"
				}
				*/
				return {
					allow(){
						if(out.max()){
							return false
						}else
						if(out.resizeAble()){
							return true
						}else{
							return false
						}
					},
					addHeight(h){
						out.height(out.height()+h)
					},
					addLeft(l:number){
						out.left(out.left()+l)
					},
					addTop(t:number){
						out.top(out.top()+t)
					},
					addWidth(w){
						out.width(out.width()+w)
					},
					width(){
						if(out.max()){
							return p.width()
						}else{
							return 10 + out.width()
						}
					},
					height(){
						if(out.max()){
							return p.height()
						}else{
							return 10 + out.height() + 20
						}
					},
					top(){
						if(out.max()){
							return 0
						}else{
							return out.top()
						}
					},
					left(){
						if(out.max()){
							return 0
						}else{
							return out.left()
						}
					},
					shadowClick:result.shadowClick,
					panels:result.panels,
					element:{
						type:"div",
						init:result.init,
						destroy:result.destroy,
						style:{
							padding:"5px",
							background:"#f0f3f9"
						},
						children:[
							title,
							element
						]
					}
				}
			},
			focus
		})
  }
}
export function addShadow(style:StyleMap){
  const shadow="rgb(102, 102, 102) 0px 0px 20px 5px"//"20px 20px 40px #666666";
  style["box-shadow"]=shadow
  style["-webkit-box-shadow"]=shadow
  style["-moz-box-shadow"]=shadow
  style.filter="progid:DXImageTransform.Microsoft.Shadow(color=#666666,direction=120,strength=40)"
	return style
}