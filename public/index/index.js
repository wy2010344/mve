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
								repeat:function(o) {
									return {
										type:"li",
										children:[
											{
												type:"button",
												text:"x",
												action:{
													click:function() {
														list().splice(o.index,1);
														list(list());
													}
												}
											},
											o.index+1,
											"-----------",
											function() {
												return o.data();
											}
										]
									}
								}
							}
						},
						{
							type:lib.div,
							params:{
								text:function() {
									return "我是子组件。"+list().length;
								}
							}
						}
					]
				}
			}
		})
	}
})