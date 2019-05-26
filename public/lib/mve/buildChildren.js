({
	data:{
		childOperate:"./childOperate.js",
		buildArray:"./buildArray.js",
		buildModel:"./buildModel.js",
		buildView:"./buildView.js"
	},
	/**
	 * 改变行的data()，需要逆向改变数组
	 依赖父元素，mve返回是一个函数function(pel){obj}，函数接受父的初始化后，才能成为实体
	 Value
	 Watcher
	 key
	 appendChild(pel,el)
	 insertChildBefore(pel,new_el,old_el)
	 removeChild(pel,el)
	 before 可选
	 after 可选
	 */
	success:function(p){
		var getOModel=function(row,i){
			return {
				data:row,
				index:p.Value(i)
			};
		};
		var updateModelIndex=function(view,index){
			view.row.index(index);
		};
		var getOArray=function(row,i){
			return {
				data:p.Value(row),
				index:i //因为使用复用，所以不会发生改变
			};
		};
		var updateArrayData=function(view,data){
			view.row.data(data);
		};
		var p_before=p.before||mb.Function.quote.one;
		var p_after=p.after||mb.Function.quote.one;

		var parseObject=function(child,e,x,init){
			var obj=x.Parse(x,{
				json:child,
				e:e,
				k:init.k,
				inits:init.inits,
				destroys:init.destroys
			});
			p.appendChild(e.pel,obj.element);
			return obj;
		};
		var parseArray=function(array,index,e,x,o){
			for(var i=index;i<array.length;i++){
				var child=array[i];
				o=parseObject(child,e,x,o);
			}
			return o;
		};
		/*解析重复*/
		var parseRepeat=function(children,e,x,o,appendChild){
			var inits=o.inits;
			var destroys=o.destroys;
			if(children.array){
				//计算
				var c_inits=[];
				var isInit=false;
				var bc=lib.buildArray({
					no_cache:p.no_cache,
					build:lib.childOperate.build(e,children.repeat,x.mve,getOArray),
					after:function(view){
						var init=lib.childOperate.getInit(view);
						if(isInit){
							init();
						}else{
							c_inits.push(init);
						}
					},
					update_data:updateArrayData,
					destroy:lib.childOperate.destroy,
					appendChild:appendChild,
					removeChild:function(view){
						p.removeChild(e.pel,view.obj.element);
					}
				});
				var watch=p.Watcher({
					before:function(){
						p_before(e.pel);
					},
					exp:function(){
						return children.array();
					},
					after:function(array){
						bc.after(array);
						p_after(e.pel);
					}
				});
				inits.push(function(){
					mb.Array.forEach(c_inits,function(c_i){
						c_i();
					});
					isInit=true;
				});
				destroys.push(function(){
					 watch.disable();
					 bc.destroy();
				});
				return {
					k:o.k,
					inits:inits,
					destroys:destroys
				};
			}else 
			if(children.model){
				//model属性
				var px={
					build:lib.childOperate.build(e,children.repeat,x.mve,getOModel),
					model:children.model,
					update_index:updateModelIndex,
					init:lib.childOperate.init,
					destroy:lib.childOperate.destroy,
					insertChildBefore:function(new_view,old_view){
						p.insertChildBefore(e.pel,new_view.obj.element,old_view.obj.element);
					},
					removeChild:function(view){
						p.removeChild(e.pel,view.obj.element);
					},
					appendChild:appendChild
				};

				var bm;
				if(mb.Array.isArray(children.model)){
					bm=lib.buildView(px);
					if(children.id){
						if(o[children.id]){
							mb.log(children.id+"该id已经存在，出错");
						}else{
							o.k[children.id]=bm.view;
						}
					}
				}else{
					bm=lib.buildModel(px);
				}
				inits.push(bm.init);
				destroys.push(bm.destroy);
				return {
					k:o.k,
					inits:inits,
					destroys:destroys
				};
			}else{
				mb.log("非array和model",children.model);
				return o;
			}
		};

		/*需要返回给重复作标记*/
		var parseAfter=function(array,e,x,o){
			o=parseObject(array[0],e,x,o);
			var flag=o;
			o=parseArray(array,1,e,x,o);
			return {
				o:o,
				appendChild:function(view){
					p.insertChildBefore(e.pel,view.obj.element,flag.element);
				}
			};
		};
		var defaultAppendChild=function(e){
			return function(view){
				p.appendChild(e.pel,view.obj.element);
			};
		};
		/**
		e {
			pel
			replaceChild(pel,old,new);
		}
		*/
		var buildChildren=function(e,x,o){
			var children=o.json[p.key];
			if(children){
				if(typeof(children)=="object"){
					if(mb.Array.isArray(children)){
						//列表
						return parseArray(children,0,e,x,o);
					}else{
						if(children.multi){
							var i=0;
							var length=children.multi.length;
							while(i<length){
								var child=children.multi[i];
								i++;
								if(mb.Array.isArray(child)){
									o=parseArray(child,0,e,x,o);
								}else{
									if(i<length){
										var next=children.multi[i];
										i++;
										if(mb.Array.isArray(next)){
											var mx=parseAfter(next,e,x,o);
											o=mx.o;
											var appendChild=mx.appendChild;
										}else{
											throw "multi中下一个必须是列表";
										}
									}else{
										var appendChild=defaultAppendChild(e);
									}
									o=parseRepeat(child,e,x,o,appendChild);
								}
							}
							return o;
						}else{
							if(children.before){
								o=parseArray(children.before,0,e,x,o);
							}
							if(children.after){
								var mx=parseAfter(children.after,e,x,o);
								o=mx.o;
								var appendChild=mx.appendChild;
							}else{
								var appendChild=defaultAppendChild(e);
							}
							return parseRepeat(children,e,x,o,appendChild);
						}
					}  
				}else{
					mb.log("错误children应该是字典或列表");
				}
			}else{
				return o;
			}
		};
		return buildChildren;
	}
});