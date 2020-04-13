import { mve } from "../../lib/mve/util";
import { BView } from "../../lib/baseView/index";
import { BParamImpl } from "../../lib/baseView/arraymodel";
import { BNavigationViewSuper } from "../../lib/baseView/BNavigationView";
import { allBuilder } from "../../lib/baseView/mveFix/index";


const me=new BParamImpl()

const out={
	width:mve.valueOf(0),
	height:mve.valueOf(0)
}
const element=document.createElement("div")
const view=new BView()
view.setBackground("yellow")
class MainNavigation extends BNavigationViewSuper{
	getHeight(){
		return 640
	}
	getWidth(){
		return 320
	}
}
const navigation=new MainNavigation(me,view)
element.style.background="gray"
me.Watch(function(){
	view.kSetX((out.width() - navigation.getWidth())/2)
})
me.Watch(function(){
	view.kSetY((out.height() - navigation.getHeight())/2)
})
let cellHeight=mve.valueOf(0)
const result=allBuilder.view.view(me,{
	type:"view",
	x:0,
	y:0,
	w:320,
	h:640,
	children:[
		{
			type:"label",
			x:0,
			y:0,
			w:320,
			h:40,
			background:"red",
			text:"点击"
		},
		{
			type:"button",
			x:0,
			y:40,
			w:320,
			h:40,
			background:"gray",
			text:"点击",
			click(){
				mb.log("点击")
				cellHeight(cellHeight()+10)
			}
		},
		{
			type:"list",
			x:0,
			y:80,
			w:320,
			children:[
				{
					height:40,
					children:[
						{
							type:"view",
							x:0,y:0,w:200,h:20,
							background:"gray"
						}
					]
				},
				{
					height(){
						return cellHeight()
					},
					children:[
						{
							type:"view",
							x:0,y:0,w:200,h:20,
							background:"blue"
						}
					]
				}
			]
		}
	]
})
element.appendChild(view.getElement())
export={
	out,
	element:element,
	init(){
		mb.log("初始化")
		navigation.push(function(index){
			return {
				view:result.element
			}
		})
	},
	destroy(){
		result.destroy()
		me.destroy()
	}
}