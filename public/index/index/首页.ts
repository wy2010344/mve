import { topTitleResizeForm } from "../../lib/front-mve.controls/window/form";
import { PNJO } from "../../lib/mve-DOM/index";



function hrefOf(text:string,description:string,goto:()=>void):PNJO{
	return {
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
				]
			},
			{
				type:"td",
				text:description
			}
		]
	}
}
export=topTitleResizeForm(function(me,p,r){
	return {
		title:"首页",
		element:{
			type:"div",
			children:[
				{
					type:"table",
					children:[
						hrefOf("modelChildren","自定义模型的重复节点",function(){
							import("./modelChildren").then(function(modelChildren){
								p.model.push(modelChildren.panel)
							})
						})
					]
				}
			]
		}
	}
})