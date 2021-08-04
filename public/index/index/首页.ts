import { topTitleResizeForm } from "../../lib/front-mve.controls/window/form";
import { dom } from "../../lib/mve-DOM/index";
import { modelChildren } from "../../lib/mve/modelChildren";
import { mve } from "../../lib/mve/util";



function hrefOf(text:string,description:string,goto:()=>void){
	return dom({
		type:"tr",
		children:[
			{
				type:"td",
				children:[
					{
						type:"a",
						text,
						attr:{
							href:"javascript:void(0)"
						},
						action:{
							click:goto
						}
					}
				].map(dom)
			},
			{
				type:"td",
				text:description
			}
		].map(dom)
	})
}
export=topTitleResizeForm(function(me,p,r){
	const vs=mve.arrayModelOf<string>([])
	return {
		title:"首页",
		element:[
			{
				type:"table",
				children:[
					hrefOf("modelChildren","自定义模型的重复节点",function(){
						import("./modelChildren").then(function(modelChildren){
							p.model.push(modelChildren.panel)
						})
					}),
					dom({
						type:"button",text:"测试",action:{
							click(){
								vs.push("dddd")
							}
						}
					}),
					modelChildren(vs,function(me,row,index){
						return dom({
							type:"div",
							children:[
								{
									type:"button",
									text:"X",
									destroy(){
										mb.log("销毁")
									},
									action:{
										click(){
											vs.remove(index())
										}
									}
								}
							].map(dom)
						})
					})
				]
			}
		].map(dom)
	}
})