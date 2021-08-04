import { DesktopParam, formBuilder, FormPanel } from "./index";
import { buildTitle } from "./title";
import { dom, DOMNodeAll, DOMNode, StyleMap } from "../../mve-DOM/index";
import { mve } from "../../mve/util";
import { dragMoveHelper, dragResizeHelper } from "../../mve-DOM/other/drag";
import { resizeZoom } from "../../mve-DOM/other/resize";
import { EOChildren } from "../../mve/childrenBuilder";
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
		style?:StyleMap
    element:EOChildren<Node>
		shadow?:EOChildren<Node>
		panels?:EOChildren<Node>
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
			function currentWidth(){
				return result.width()+"px"
			}
			function currentHeight(){
				return result.height()+"px"
			}
			return {
				left(){return result.left()+"px"},
				top(){return result.top()+"px" },
				width:currentWidth,
				height:currentHeight,
				panels:result.panels,
				shadow:result.shadow,
				style:result.style,
				element:[
					element,
					...zoom
				]
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
    element:EOChildren<Node>
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
						}
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
		style?:StyleMap
    element:EOChildren<Node>
		panels?:EOChildren<Node>
		close?():void
		init?():void
		destroy?():void
		shadow?:EOChildren<Node>
		shadowClick?():void
  },
  focus?:mve.GValue<void>
){
  const out={
    left:mve.valueOf(20),
    top:mve.valueOf(20),
    width:mve.valueOf(800),
    height:mve.valueOf(600),
    max:mve.valueOf(mb.DOM.isMobile()),
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
				const titleHeight=25
				const rect={
					out,
					index:rp.index,
					innerHeight(){
						if(out.max()){
							return p.height() - titleHeight
						}else{
							return out.height()
						}
					},
					innerWidth(){
						if(out.max()){
							return p.width()
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
					height:titleHeight,
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
							return out.width()
						}
					},
					height(){
						if(out.max()){
							return p.height()
						}else{
							return out.height() + titleHeight
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
					shadow:result.shadow,
					shadowClick:result.shadowClick,
					panels:result.panels,
					element:dom({
						type:"div",
						init:result.init,
						destroy:result.destroy,
						style:addShadow({
							background:"#ededed",
							"border-radius":"5px"
						}),
						children:[
							title,
							dom({
								type:"div",
								style:mb.Object.ember(result.style||{},{
									width(){
										return rect.innerWidth() +"px"
									},
									height(){
										return rect.innerHeight() +"px"
									}
								}),
								children:result.element
							})
						]
					})
				}
			},
			focus
		})
  }
}

/**
 * 以x方向为例，菜单的最终位置
 * @param x 鼠标触发的在父容器下的x
 * @param pwidth 父容器宽度
 * @param width 自己的宽度
 * @returns 菜单应该放置的宽度
 */
function menuLV(x:number,pwidth:number,width:number){
	const after = x + width
	if(after > pwidth){
		//会超出,尝试向前
		const before= x - width
		if(before < 0){
			//尝试向前也会超出
			if(after > before){
				//向后超出的多
				return before
			}else{
				return x
			}
		}else{
			return before
		}
	}else{
		return x
	}
}

/**
 * 计算鼠标事件导致的相对位置
 * @param e 
 * @param pe 
 * @param me 
 * @returns 
 */
export function autoMenuMouse(e:MouseEvent,pe:DOMRect,me:DOMRect){
	return {
		x:menuLV(e.clientX-pe.left,pe.width,me.width),
		y:menuLV(e.clientY-pe.top,pe.height,me.height)
	}
}

function menuNode(
	rtop:number,
	rleft:number,
	peWidth:number,
	peHeight:number,
	eWidth:number,
	eHeight:number,
	meWidth:number,
	meHeight:number
) {
	let x=0
	let y=0
	const diffDownTop= peHeight - (rtop  + eHeight + meHeight)
	if(diffDownTop > 0){
		y = rtop + eHeight
	}else{
		const diffUpTop=rtop - meHeight
		if(diffUpTop > 0){
			y = diffUpTop
		}else{
			if(diffUpTop < diffDownTop){
				//上面更小，依下面
				y = rtop + eHeight
			}else{
				y = diffUpTop
			}
		}
	}
	const rd=peWidth - (rleft + meWidth)
	if(rd > 0){
		//靠左
		x = rleft
	}else{
		const ld=rleft + eWidth - meWidth
		if(ld > 0){
			//靠右
			x = ld
		}else{
			if(ld < rd){
				//超得多，
				x = rleft
			}else{
				//靠右
				x = ld
			}
		}
	}
	return [x,y]
}
/**
 * 自动排布菜单，相对定位
 * @param e 环绕元素
 * @param pe 父元素
 * @param me 菜单元素
 * @param dir 上下结构还是左右结构，默认上下结构y
 */
export function autoMenuNode(e:DOMRect,pe:DOMRect,me:DOMRect,dir:"x"|"y"="y"){
	const rtop=e.top - pe.top
	const rleft=e.left - pe.left
	if(dir=="x"){
		const [y,x]=menuNode(rleft,rtop,pe.height,pe.width,e.height,e.width,me.height,me.width)
		return {x,y}
	}else{
		const [x,y]=menuNode(rtop,rleft,pe.width,pe.height,e.width,e.height,me.width,me.height)
		return {x,y}
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