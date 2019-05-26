({
	data:{
		util:"../mve/util.js",
		exp:"../mve/exp.js",
		parse:"../mve/parse.js",
		buildChildren:"../mve/buildChildren.js",

		DOM:"./DOM.js"
	},
	success:function(){
		/**
		 * repeat生成json结果是被观察的，受哪些影响，重新生成，替换原来的节点。
		 * 生成过程，而json叶子结点里的函数引用，如style,attr，则受具体的影响
		 */
		var buildChildren=lib.buildChildren({
			Value:lib.util.Value,
			Watcher:lib.util.Watcher,
			key:"children",
			appendChild:lib.DOM.appendChild,
			removeChild:lib.DOM.removeChild,
			insertChildBefore:lib.DOM.insertChildBefore
		});
		var bindEvent=function(map,f){
			if(map){
				mb.Object.forEach(map,function(v,k){
					f(k,v);
				});
			}
		};
		var bindKV=function(bind,key,value,f){
			bind(value,function(v){
				f(key,v);
			});
		};
		var bindMap=function(bind,map,f){
			if(map){
				mb.Object.forEach(map,function(v,k){
					bindKV(bind,k,v,f);
				});
			}
		};
		var replaceChild=function(e,old_el,new_el){
			lib.DOM.replaceWith(old_el,new_el);
		};

		var makeUp=function(e,x,json){   
			bindMap(x.bind,json.attr,function(key,value){
				lib.DOM.attr(e,key,value);
			});
			
			x.if_bind(json.cls,function(cls){
				lib.DOM.attr(e,"class",cls);
			});
			
			bindMap(x.bind,json.prop,function(key,value){
				lib.DOM.prop(e,key,value);
			});
			
			bindMap(x.bind,json.style,function(key,value){
				lib.DOM.style(e,key,value);
			});
			
			bindEvent(json.action,function(key,value){
				lib.DOM.action(e,key,value);
			});
			
			x.if_bind(json.text,function(value){
				lib.DOM.text(e,value);
			});
			
			x.if_bind(json.value,function(value){
				lib.DOM.value(e,value);
			});

			x.if_bind(json.html,function(html){
				lib.DOM.html(e,html);
			});
		};

		var create=function(v){
			return lib.exp(
				lib.parse(
					{
						createTextNode:function(x,o){
							return {
								element:lib.DOM.createTextNode(o.json||""),
								k:o.k,
								inits:o.inits,
								destroys:o.destroys
							};
						},
						buildElement:function(x,o){
							var e=v.createElement(o);
							makeUp(e,x,o.json);
							var obj=buildChildren({
								pel:e,
								replaceChild:replaceChild
							},x,o);
							return {
								element:e,
								k:obj.k,
								inits:obj.inits,
								destroys:obj.destroys
							};
						}
					}
				)
			);
		};
		var mve=create({
			createElement:function(o){
				var NS=o.json.NS;
				if(NS){
					return lib.DOM.createElementNS(o.json.type,o.json.NS);
				}else{
					return lib.DOM.createElement(o.json.type);
				}
			}
		});
		mve.svg=create({
			createElement:function(o){
				return lib.DOM.createElementNS(o.json.type,"http://www.w3.org/2000/svg");
			}
		});
		return mve;
	}
});