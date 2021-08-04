import { dom, DOMNode } from "../mve-DOM/index"
import { dragMoveHelper, dragResizeHelper } from "../mve-DOM/other/drag"
import { resizeZoom } from "../mve-DOM/other/resize"
import { mve, orDestroy, orInit } from "../mve/util"
import { addShadow } from "./window/form"

/**
 * 单个拖拽面板，伪窗口
 * @param fun 
 */
export function dragPanel(fun:(me:mve.LifeModel,rect:{
	top:mve.Value<number>
	left:mve.Value<number>
	width:mve.Value<number>
	height:mve.Value<number>
	destroy():void
	show:mve.Value<boolean>
})=>{
	title:mve.TValue<string>
	/**与对外的show共同决定是否展示*/
	show():boolean
	/**重写点击事件 */
	minClick?():void
	init?():void
	destroy?():void
	element:DOMNode
}){
	let firstShow=true
	const show=mve.valueOf(false)
	const rect={
		top:mve.valueOf(100),
		left:mve.valueOf(100),
		width:mve.valueOf(100),
		height:mve.valueOf(100),
		destroy(){
			if(!firstShow){
				orDestroy(dialog)
				document.body.removeChild(dialog.element)
			}
		},
		show:<mve.Value<boolean>>function(v?:boolean){
			if(arguments.length==1){
				if(v && firstShow){
					//首次初始化
					document.body.appendChild(dialog.element)
					orInit(dialog)
					firstShow=false
				}
				show(v)
			}else{
				return show()
			}
		}
	}
	const dialog=dom.root(function(me){
		const result=fun(me,rect)
		function addTop(x:number){
			rect.top(rect.top()+x)
		}
		function addLeft(x:number){
			rect.left(rect.left()+x)
		}
		const zoom=resizeZoom({
			resize:dragResizeHelper({
				addTop,
				addLeft,
				addWidth(x){
					rect.width(rect.width()+x)
				},
				addHeight(x){
					rect.height(rect.height()+x)
				}
			})
		})
		const titleHeight=20
		result.element.style=result.element.style||{}
		result.element.style.width=function(){
			return rect.width()+"px"
		}
		result.element.style.height=function(){
			return rect.height() +"px"
		}
		const minClick=result.minClick|| function(){
			show(false)
		}
		return {
			type:"div",
			init:result.init,
			destroy:result.destroy,
			style:addShadow({
				position:"absolute",
				display(){
					return rect.show() && result.show()?"":"none"
				},
				border:"1px solid gray",
				background:"white",
				left(){return rect.left()+"px"},
				top(){return rect.top()+"px"},
				width(){return rect.width()+"px"},
				height(){return rect.height() + titleHeight +"px"}
			}),
			children:[
				dom({
					type:"div",text:result.title,style:{cursor:"pointer",height:titleHeight+"px","line-height":titleHeight+"px"},
					action:{
						mousedown:dragMoveHelper({
							diff(v){
								const vx=v.x
								if(vx!=0){
									addLeft(vx)
								}
								const vy=v.y
								if(vy!=0){
									addTop(vy)
								}
							}
						})
					}
				}),
				dom({
					type:"div",
					text:"-",
					style:{
						position:"absolute",height:titleHeight-2+"px","line-height":titleHeight-2+"px",
						top:"0px",right:"0px",cursor:"pointer",width:titleHeight-2+"px",
						"text-align":"center",
						border:"1px solid black"
					},
					action:{
						click:minClick
					}
				}),
				dom(result.element),
				...zoom
			]
		}
	})
	return rect
}