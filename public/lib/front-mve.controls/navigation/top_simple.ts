import { dom, ItemValue, DOMNode } from "../../mve-DOM/index";
import { mve } from "../../mve/util";
import { navigation, NavMethod } from "./index";


/**
 顶部有导航条，点击返回，可以重载自己的返回事件。
 假设了导航条的返回，需要询问每一个，返回到指定页面，阻止后验证，验证后手动调用返回到指定页面。
 */
export interface Top_simple_nav_item{
	title:ItemValue;
	render:(me:mve.LifeModel,params:{
		width:mve.GValue<number>;
		height:mve.GValue<number>;
	})=>DOMNode
}
export function top_simple_navigation(p:{
	width:mve.GValue<number>;
	height:mve.GValue<number>;
	init:(x:NavMethod<Top_simple_nav_item>)=>void;
}){
	return navigation<Top_simple_nav_item>({
		render(me,x,v){
			var content_param={
				width:p.width,
				height:function(){
					return p.height()-30;
				}
			};
			var on_hidden=function(){
				return x.size()==1?"none":"";
			};
			let contentElement:HTMLDivElement
			return {
				init:function(){
					p.init(x);
				},
				type:"div",
				style:{
					height:function(){
						return p.height()+"px"
					}
				},
				children:[
					dom({
						type:"div",
						style:{
							height:"30px"
						},
						children:[
							dom({
								type:"button",
								text:"返回上一页",
								style:{
									display:on_hidden
								},
								action:{
									click:x.pop
								}
							}),
							dom({
								type:"span",
								text:"|",
								style:{
									display:on_hidden
								}
							}),
							dom({
								type:"button",
								text:"<",
								style:{
									display:on_hidden
								},
								action:{
									click:function(){
										var c=contentElement
										c.scrollLeft=c.scrollLeft-10;
									}
								}
							}),
							dom({
								type:"span",
								id(v){
									contentElement=v
								},
								style:{
									overflow:"hidden",
									display:"inline-block",
									"vertical-align":"middle",
									width:function(){
										var w=(x.size()==1?p.width():p.width()-90);
										return w-60+"px";
									}
								},
								action:{
									wheel:function(e:any){
										var c=contentElement
										c.scrollLeft=c.scrollLeft+e.wheelDelta;
									}
								},
								children:[
									dom({
										type:"span",
										style:{
											"white-space":"nowrap"
										},
										children:v.build_head_children(function(me,row,index){
											return dom({
												type:"span",
												children:[
													dom({	
														type:"a",
														attr:{
															href:function(){
																return (x.size()-1==index())?null:"javascript:void(0)";
															}
														},
														action:{
															click:function(){
																while(row!=x.current()){
																	x.pop();
																}
															}
														},
														text:row.title
													}),
													dom({
														type:"span",
														text:">",
														style:{
															display:function(){
																return (index()==x.size()-1)?"none":"";
															}
														}
													})
												]
											})
										})
									})
								]
							}),
							dom({
								type:"button",
								text:">",
								style:{
									display:on_hidden
								},
								action:{
									click:function(){
										var c=contentElement
										c.scrollLeft=c.scrollLeft+10;
									}
								}
							})
						]
					}),
					dom({
						type:"div",
						children:v.build_body_children(function(me,row,index){
							return row.render(me,content_param)
						})
					})
				]
			}
		}
	})
}