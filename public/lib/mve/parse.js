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
		var forEachRun=function(array){
			mb.Array.forEach(array,function(array){
				row();
			});
		};

		var addLifeCycle=function(object,o){
			if(object.init){
				o.inits.push(object.init);
			}
			if(object.destroy){
				o.destroys.push(object.destroy);
			}
			return o;
		};
		return function(p){
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
						addLifeCycle(obj,o);
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
					var vm=x.mve(o.json)(x.e);
					addLifeCycle(vm,o);
					return {
						element:vm.element,
						k:o.k,
						inits:o.inits,
						destroys:o.destroys
					};
				}else{
					return ParseObject(x,o);
				}
			};
			/*me的element会发生改变*/
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
				return ParseObject(x,o);
			};
		};
	}
})