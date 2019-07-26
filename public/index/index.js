({
	data:{
		div:"./div.js"
	},
	success:function() {
		return mve(function(me) {
			var a=function(text,href) {
				return {
					type:"a",
					text:text,
					attr:{
						target:"_blank",
						href:href
					}
				};
			};
			var br={
				type:"br"
			};
			var list=me.Value([]);
			return {
				element:{
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
						{
							type:"input",
							id:"input"
						},
						{
							type:"button",
							text:function() {
								return "添加第"+(list().length+1)+"条记录";
							},
							action:{
								click:function() {
									var v=me.k.input.value.trim();
									mb.log(v);
									if(v){
										list().unshift(v);
										list(list());
										me.k.input.value="";
									}else{
										alert("需要输入内容");
									}
								}
							}
						},
						{
							type:"ul",
							children:{
								array:function() {
									return list();
								},
								repeat:function(me,row,index) {
									return {
										element:{
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
												index+1,
												"-----------",
												{
													type:"span",
													text:function(){
														return row();
													}
												}
											]
										}
									};
								},
								before:[
									{
										type:"div",
										text:function(){
											return "添加第"+(list().length+1)+"条记录";
										}
									}
								],
								after:[
									{
										type:"div",
										text:function(){
											return "添加第"+(list().length+1)+"条记录";
										}
									}
								]
							}
						},
						{
							type:lib.div,
							text:function() {
								return "我是子组件。"+list().length;
							}
						},
						function(){
							return "我是文字";
						},
						function(){
							return {
								type:"div",
								text:"我是返回div"
							};
						},
						{
							type:"div",
							children:{
								multi:[
									[
										"测试multi",
										"我亦是内容"
									],
									{
										array:function(){
											return list();
										},
										repeat:function(me,row,index){
											return {
												element:{
													type:"div",
													text:function(){
														return index+"---->"+row();
													}
												}
											}
										}
									},
									[
										{
											type:"span",
											text:function(){
												return "长度"+list().length;
											}
										},
										"这也是一条内容"
									],
									{
										array:function(){
											return list();
										},
										repeat:function(me,row,index){
											return {
												element:{
													type:"div",
													text:function(){
														return index+"---->"+row();
													}
												}
											}
										}
									},
									[
										{
											type:"span",
											text:function(){
												return "长度"+list().length;
											}
										},
										"这也是一条新1111内容"
									],
									{
										array:function(){
											return list();
										},
										repeat:function(me,row,index){
											return {
												element:{
													type:"div",
													text:function(){
														return index+"---->"+row();
													}
												}
											}
										}
									},
									[
										{
											type:"span",
											text:function(){
												return "长度"+list().length;
											}
										},
										"这也是一条新1111内容"
									]
								]
							}
						}
					]
				}
			}
		})
	}
})