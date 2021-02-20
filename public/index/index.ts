import { DesktopIndex } from "../lib/front-mve.controls/window/index";
import { modelChildren } from "../lib/mve/modelChildren";

export=DesktopIndex(function(p){
  return {
		type:"div",
		init(){
			import("./index/首页").then(function(index){
				p.model.push(index.panel)
			})
		},
		style:{
			width(){
				return p.width()+"px"
			},
			height(){
				return p.height()+"px"
			}
		},
		children:modelChildren(p.model,function(me,row,index) {
			return row.render(me,p,index)
		})
	}
})