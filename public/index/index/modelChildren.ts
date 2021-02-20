import { topTitleResizeForm } from "../../lib/front-mve.controls/window/form"
import { newline, NJO, PNJO } from "../../lib/mve-DOM/index"
import { newArticle } from "../../lib/mve/childrenBuilder"

export=topTitleResizeForm(function(me,p,r){

	const article=newArticle<NJO,Node>()
	.append(`modelChildren是重复子元素，定义在lib/mve/modelChildren.ts`)
	.append(newline)
	.append(`它接收两个参数，一个是列表模型mve.ArrayModel，另一个是将列表模型的每一个元素转化成JOChildren类型，大致相当于将模型转化成视图`)
	.append(newline)
	.append(`mve.ArrayModel是可观察的列表，除了单纯的get方法。使用modelChildren使渲染出的每一个视图片段与模型一一对应`)
	.append(newline)
	.append(`如果要使用filter，最好对视图元素的顶层display绑定模型的某一个可观察属性，filter即遍历将可用的记录的该属性设置成true，其余的设置成false`)
	
	return {
		title:"modelChildren",
		element:{
			type:"div",
			children:article.out
		}
	}
})