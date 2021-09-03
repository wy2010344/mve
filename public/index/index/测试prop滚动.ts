import { topTitleResizeForm } from "../../lib/front-mve.controls/window/form";
import { dom } from "../../lib/mve-DOM/index";




export=topTitleResizeForm(function(me,p,r){
	return {
		title:"测试prop滚动",
		element:[
			dom({
				type:"div",
				style:{
					overflow:"auto",
					height:"100%"
				},
				prop:{
					scrollTop:30
				},
				children:[
					dom({
						type:"div",
						style:{
							height:"800px"
						},
						children:[
							dom({
								type:"input",
								attr:{
									type:"checkbox"
								},
								prop:{
									checked:true
								}
							})
						]
					})
				]
			})
		]
	}
})