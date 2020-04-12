import { MveUtil } from "../../lib/baseView/mveUtil";
import { mve } from "../../lib/mve/util";
import { navigationOf } from "../../lib/baseView/BNavigationView";
import { BView } from "../../lib/baseView/index";


const me=new MveUtil()

const out={
	width:mve.valueOf(0),
	height:mve.valueOf(0)
}
const element=document.createElement("div")
const view=new BView()
view.setBackground("yellow")
const navigation=navigationOf(me,{
	view,
	width(){
		return 320
	},
	height(){
		return 640
	}
})
element.style.background="gray"
me.Watch(function(){
	view.setX((out.width() - navigation.width())/2)
})
me.Watch(function(){
	view.setY((out.height() - navigation.height())/2)
})
element.appendChild(view.getElement())
export={
	out,
	element:element,
	init(){
		mb.log("初始化")
		navigation.push(function(index){
			return {
				view:new BView()
			}
		})
	},
	destroy(){
		me.destroy()
	}
}