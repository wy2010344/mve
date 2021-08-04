import { dom, DOMNode } from "../../mve-DOM/index";
import { dragMoveHelper } from "../../mve-DOM/other/drag";
import { mve } from "../../mve/util";
import { tab } from "./index";


export function top_tab<T>(me:mve.LifeModel,p:{
	tabs:mve.ArrayModel<T>
	current?:mve.Value<T>
	width:mve.GValue<number>
	title:(me:mve.LifeModel,row:T,index:mve.GValue<number>)=>string
	render:(me:mve.LifeModel,row:T,index:mve.GValue<number>)=>DOMNode
}){
	return tab(me,{
		tabs:p.tabs,
		current:p.current||mve.valueOf(null),
		render(me,x){
			function on_hiden(){
				return p.tabs.size()>0?"":"none";
			};
			let contentSpan:HTMLSpanElement
			return dom({
				type:"div",
				children:[
					dom({
						type:"div",
						children:[
							dom({
								type:"button",
								text:"<",
								style:{
									display:on_hiden
								},
								action:{
									click(){
										var c=contentSpan;
										c.scrollLeft=c.scrollLeft-10;
									}
								}
							}),
							dom({
								type:"span",
								id(v){
									contentSpan=v
								},
								style:{
									display:"inline-block",
									overflow:"hidden",
									"vertical-align":"middle",
									width(){
										if (p.tabs.size()>0) {
											return p.width()-60+"px";
										}
									}
								},
								action:{
									wheel(e:WheelEvent){
										var c=contentSpan;
										c.scrollLeft=c.scrollLeft + mb.DOM.wheelDelta(e);
									}
								},
								children:[
									dom({
										type:"span",
										style:{
											"white-space":"nowrap"
										},
										children:x.build_head_children(function(me,row,index){
											const left=mve.valueOf(0)
											let div:HTMLDivElement
											return {
												type:"div",
												init(it){
													div=it
												},
												style:{
													position:"relative",
													left(){
														return left()+"px"
													},
													display:"inline-block",
													border:"1px solid gray",
													padding:"2px",
													margin:"1px",
													color(){
														return x.current()==row?"white":"black";
													},
													"background-color"(){
														return x.current()==row?"green":"";
													},
													cursor:"pointer",
													"z-index"(){
														return x.current()==row?p.tabs.size()+"":""
													}
												},
												text:p.title(me,row,index),
												action:{
													mousedown:dragMoveHelper({
														diff(v){
															const lf=left()+v.x
															const ow=div.offsetWidth
															if(lf > ow / 2){
																//向右移动
																p.tabs.move(index(),index()+1)
																left(lf - ow) //小于0
															}else
															if(-lf > ow / 2){
																//向左移动
																p.tabs.move(index(),index()-1)
																left(lf + ow) //大于0
															}else{
																left(lf)
															}
														},
														cancel(){
															left(0)
														}
													})
												}
											}
										})
									})
								]
							}),
							dom({
								type:"button",
								text:">",
								style:{
									display:on_hiden
								},
								action:{
									click:function(){
										var c=contentSpan;
										c.scrollLeft=c.scrollLeft+10;
									}
								}
							})
						]
					}),
					dom({
						type:"div",
						children:x.build_body_children(function(me,row,index){
							return p.render(me,row,index);
						})
					})
				]
			})
		}
	})
}