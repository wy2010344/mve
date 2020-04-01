import { allBuilder } from "../../lib/fixView/index";
import { mve } from "../../lib/mve/util";
import { main } from "./main";




export=allBuilder.view.mve(function(me){

	const width=mve.valueOf(0)
	const height=mve.valueOf(0)

	const size={
		width:mve.valueOf(320),
		height:mve.valueOf(640)
	}
	return {
		out:{
			width,height
		},
		init(){},destroy(){},
		element:{
			type:"view",
			x:0,y:0,h:0,w:0,
			children:[
				{
					type:"view",
					w:size.width,
					h:size.height,
					x(){
						return (width()-size.width())/2
					},
					y(){
						return (height()-size.height())/2
					},
					background:"gray",
					children:[
						main(size.width,size.height)
					]
				}
			]
		}
	}
})