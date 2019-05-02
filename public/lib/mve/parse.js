({
	delay:true,
	success:function(){
		var bindFactory=function(watch){
			return function(value,f){
				if(typeof(value)=="function"){
					//observe
					watch({
						exp:function(){
							return value();
						},
						after:function(v){
							f(v);
						}
					});
				}else{
					f(value);
				}
			};
		};
		var if_bind=function(bind) {
			return function(value,f){
				if(value!=undefined){
					bind(value,f);
				} 
			};
		};
		var add_k=function(k,id,obj){
			if (id) {
				var old=k[id];
				if(old!=null){
					mb.log("已经存在重复的定义"+id,old,"不能添加",obj);
				}else{
					k[id]=obj;
				}
			}
			return k;
		};
		return function(p){
			var ParseFun=function(x,o){
				var change=mb.cache();
				x.watch({
					exp:function(){
					   return o.json(); 
					},
					after:function(jo){
						var newObj=x.mve(function(){
							return {
								element:jo
							};
						})(o.e);
						var obj=change();
						change(newObj);
						if(obj){
							//非第一次生成
							o.e.replaceChild(o.e,obj.element,newObj.element);
							obj.destroy();
							newObj.init();
						}
					}
				});
				//最后一个销毁
				o.destroys.push(function() {
					var destroy=change().destroy||mb.Function.quote.one;
					destroy();
				});
				o.inits.push(change().init);
				return {
					change:change,
					inits:o.inits,
					destroys:o.destroys
				};
			};
			var ParseObject=function(x,o){
				var json=o.json||"";
				if(typeof(json)!="object"){
					return p.createTextNode(x,o);
				}else{
					var type=o.json.type;
					var id=o.json.id;
					if(typeof(type)=="string"){
						var obj=p.buildElement(x,o);
						var el=obj.element;
						return {
							element:el,
							k:add_k(obj.k,id,el),
							inits:obj.inits,
							destroys:obj.destroys
						};
					}else{
						var obj=type(json)(o.e);
						var el=obj.element;
						/*虽然mve模板是有init与destroy，但原生模块并没有*/
						if(obj.init){
							o.inits.push(obj.init);
						}
						if(obj.destroy){
							o.destroys.push(obj.destroy);
						}
						return {
							element:el,
							k:add_k(o.k,id,obj.out),//只将out部分暴露出去
							inits:o.inits,
							destroys:o.destroys
						};
					}
				};
			};
			var Parse=function(x,o){
				if(typeof(o.json)=="function"){
					var vm=ParseFun(x,o);
					return {
						element:vm.change().element,
						k:o.k,
						inits:vm.inits,
						destroys:vm.destroys
					};
				}else{
					return ParseObject(x,o);
				}
			};
			return function(e,json,watch,mve,k){
				/*不变的*/
				var bind=bindFactory(watch);
				var x={
					Parse:Parse,
					watch:watch,
					mve:mve,
					bind:bind,
					if_bind:if_bind(bind)
				};
				/*变化的*/
				var o={
					json:json,
					e:e,
					k:{},
					inits:[],
					destroys:[]
				};
				if(typeof(o.json)=='function'){
					//根是function，要更新最新的el。
					var vm=ParseFun(x,o);
					return {
						element:vm.change().element,
						k:{},
						inits:vm.inits,
						destroys:vm.destroys
					};
				}else{
					return ParseObject(x,o);
				}
			};
		};
	}
})