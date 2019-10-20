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
		var addLifeCycle=function(object,o){
			if(object.init){
				o.inits.push(object.init);
			}
			if(object.destroy){
				o.destroys.push(object.destroy);
			}
			return o;
		};
		var addMve=function(obj,o,id){
			var el=obj.element;
			/*虽然mve模板是有init与destroy，但原生模块并没有*/
			addLifeCycle(obj,o);
			return {
				element:el,
				k:add_k(o.k,id,obj.out),//只将out部分暴露出去
				inits:o.inits,
				destroys:o.destroys
			};
		};
		return function(p){
			var ParseObject=function(x,o){
				var json=o.json||"";
				if(typeof(json)!="object"){
					return p.createTextNode(x,o);
				}else{
					var type=o.json.type;
					var id=o.json.id;
					if(type){
						var tp=typeof(type)
						if(tp=="string"){
							var obj=p.buildElement(x,o);
							var el=obj.element;
							return {
								element:el,
								k:add_k(obj.k,id,el),
								inits:obj.inits,
								destroys:obj.destroys
							};
						}else{
							//这种子组件方式无法表达泛型，需要移除。type直接是mve节点，不需要接受自身的json参数
							if(tp=='function'){
								var obj=type(json)(o.e);
								return addMve(obj,o,id);
							}else{
								mb.log("不合法的type类型",type);
							}
						}
					}else{
						if(json.mve && typeof(json.mve)=='function'){
							var obj=json.mve(o.e);
							return addMve(obj,o,id);
						}else{
							mb.log("暂时不支持",json)
						}
					}
				};
			};
			var Parse=function(x,o){
				if(typeof(o.json)=="function"){
					/*
					o.json=function(me)=>MveOuter这种，可以构造，返回模块。但没有id无法被持有
					*/
					var vm=o.json(x.e);
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