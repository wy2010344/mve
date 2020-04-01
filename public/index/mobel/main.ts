import { mve } from "../../lib/mve/util";
import { UAllView } from "../../lib/fixView/index";
import { EOParseResult } from "../../lib/mve/model";
import { listView } from "../../lib/fixView/util/listView";



export function main(width:mve.Value<number>,height:mve.Value<number>):EOParseResult<UAllView>{


	return {
		element:{
			type:"view",
			x:0,y:0,w:width,h:height,
			background:"green",
			children:[
				{
					type:"scroll",
					x:20,y:20,h:100,w:100,sw:200,sh:200,background:"gray",
					children:[
						{
							type:"button",
							x:100,y:100,w:20,h:30,text:"点击",background:"black",click(){
								mb.log("点击")
							}
						}
					]
				},
				{
					type:"input",
					x:100,y:100,w:200,h:40,
					value:"我是文字"
				},
				listView({
					x:20,y:200,h:300,w:200,
					model:mve.arrayModelOf([
						{
							h:30,
							background:"black",
							children:[

							]
						},
						{
							h:20,
							background:"red",
							children:[

							]
						},
						{
							h:100,
							background:"blue"
						}
					])
				})
			]
		},
		destroy(){
			mb.log("销毁")
		},
		init(){
			mb.log("初始化")
		}
	}
}