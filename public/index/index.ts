import { div } from "./div";

export=function(){

	return mve(function(me) {
		const a=function(text:string,href:string) {
			return {
				type:"a",
				text:text,
				attr:{
					target:"_blank",
					href:href
				}
			};
		};
		const br={
			type:"br"
		};
		const list=mve.Value<string[]>([]);

		let input:HTMLInputElement
		const element:mve.ViewItem<mve.dom.SElement>={
			type:"div",
			style:{
				overflow:"auto"
			},
			children:[
				a("更新或重打包S-Lisp目录","./S-Lisp/package"),
				br,
				a("S-Lisp版mve演示","?act=S-Lisp>index>index"),
				br,
				a("S-Lisp的简单交互","?act=S-shell"),
				br,
				a("s-html测试","?act=s-html&path=index/s-html-test/a.s-html"),
				br,
				a("测试ViewModel","?act=test>ViewModel"),
				a("新的mve","?act=mve_new/demo"),
				{
					type:"input",
					id(v){
						input=v
					}
				},
				{
					type:"button",
					text() {
						return "添加第"+(list().length+1)+"条记录";
					},
					action:{
						click() {
							var v=input.value.trim();
							mb.log(v);
							if(v){
								list().unshift(v);
								list(list());
								input.value="";
							}else{
								alert("需要输入内容");
							}
						}
					}
				},
				{
					type:"ul",
					children:[
						{
							type:"li",
							text:function(){
								return "添加第"+(list().length+1)+"条记录";
							}
						},
						mve.repeat(list,function(me,row,index) {
							return [
								{
									type:"li",
									children:[
										{
											type:"button",
											text:"x",
											action:{
												click:function() {
													list().splice(index,1);
													list(list());
												}
											}
										},
										index+1+"",
										"-----------",
										{
											type:"span",
											text:row+""
										}
									]
								},
								{
									type:"li",
									text:"我是第"+index+"个元素"
								}
							]
						}),
						{
							type:"li",
							text:function(){
								return "添加第"+(list().length+1)+"条记录";
							}
						}
					]
				},
				div({
					text() {
						return "我是子组件。"+list().length;
					}
				}), 
				"我是文字，兼容性测试",
				{
					type:"div",
					text:"我是返回div"
				},
				{
					type:"div",
					children:[
						"测试multi",
						"我亦是内容",
						mve.repeat(list,function(me,row,index){
							return {
								element:{
									type:"div",
									text:index+"---->"+row
								}
							}
						}),
						{
							type:"span",
							text:function(){
								return "长度"+list().length;
							}
						},
						"这也是一条内容",
						mve.repeat(list,function(me,row,index){
							return {
								element:{
									type:"div",
									text:index+"---->"+row
								}
							}
						}),
						mve.repeat(list,function(me,row,index){
							return {
								element:{
									type:"div",
									text:index+"---->"+row
								}
							}
						}),
						{
							type:"span",
							text:function(){
								return "长度"+list().length;
							}
						},
						"这也是一条新1111内容",
						/*
						return {
							type:"div",
							text(){
								return "奇数"+list().length
							}
						}
						*/
						mve.renders(function(){
							if(list().length%2==0){
								return [
									{
											type:"div",
											text(){
												mb.log("求取偶数")
												return "偶数"+list().length;
											}
										}
									]
							}else{
								return function(me){
									return {
										init(){
											mb.log("奇数初始化")
										},
										destroy(){
											mb.log("奇数销毁")
										},
										element:{
											type:"div",
											text(){
												return "奇数"+list().length
											}
										}
									}
									
								}
							}
						})
					]
				}
			]
		};
		return {
			init(){
				mb.log("初始化")
			},
			element,
			destroy(){
				mb.log("销毁")
			}
		}
	})
}