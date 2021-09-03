import { topTitleResizeForm } from "../../lib/front-mve.controls/window/form";
import { dom } from "../../lib/mve-DOM/index";
import { modelChildren } from "../../lib/mve/modelChildren";
import { mve } from "../../lib/mve/util";
import { testDomNode } from "./util";



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
						event:{
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
					dom({
						type:"button",text:"测试",event:{
							click(){
								vs.push("dddd")
							}
						}
					}),
					dom({
						type:"button",text:"测试滚动",event:{
							click(){
								import("./测试prop滚动").then(function(pv){
									p.model.push(pv.panel)
								})
							}
						}
					}),
					modelChildren(vs,function(me,row,index){
						return dom({
							type:"div",
							children:[
								dom({
									type:"button",
									text:"X",
									event:{
										click(){
											vs.remove(index())
										}
									}
								}),
								testDomNode()
							]
						})
					})
				]
			}
		].map(dom)
	}
})