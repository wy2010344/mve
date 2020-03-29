import { XModel, LifeModel, EModel, EWithLife, KModel, MveOuterModel, ParseType, MveFun } from "./model";
function add_k(k:KModel,id,obj,nowarn?:boolean){
	if (id) {
		if(typeof(id)=='function'){
			id(obj);
		}else{
			mb.log("未来要淘汰使用id形式绑定到me.k",id);
			var old=k[id];
			if(nowarn){
				k[id]=obj;
			}else{
				if(old!=null){
					mb.log("已经存在重复的定义"+id,old,"不能添加",obj);
				}else{
					k[id]=obj;
				}
			}
		}
	}
	return k;
};

function addLifeCycle(object,m:LifeModel){
	if(object.init){
		m.inits.push(object.init);
	}
	if(object.destroy){
		m.destroys.push(object.destroy);
	}
	return m;
};

/**
 * 添加mve元素
 * @param obj 
 * @param m 
 * @param id 
 */
function addMve(obj:MveOuterModel,m:LifeModel,id){
	const el=obj.element;
	/*虽然mve模板是有init与destroy，但原生模块并没有*/
	m=addLifeCycle(obj,m);
	m.k=add_k(m.k,id,obj.out)
	return {
		element:el,
		m:m
	};
};

/**
 * 动态的mve组件，类似if的watch
 * @param g 
 * @param x 
 * @param e 
 * @param json 
 * @param m 
 */
function addDynamicMve(mve:MveFun,x:XModel,e:EModel,json,m:LifeModel){
	const id=json.id;
	const returnObject:EWithLife={
		element:<any>null,
		m:m
	};
	let currentObject;
	let initFlag=false;
	x.watch({
		exp(){
			return json.render();
		},
		after(json){
			if(json){
				/**如果是普通节点，也可能陷入观察，需要包装起来*/
				if(typeof(json)=='object'){
					var mveReturn=mve(function(me){
						return {
							element:json
						}
					});
				}else{
					var mveReturn=mve(json);
				}
				const obj:MveOuterModel=mveReturn(e);
				if(currentObject){
					if(initFlag){
						//替换
						e.replaceChild(e.pel,currentObject.element,obj.element);
						currentObject.destroy();
						obj.init();
					}
					if(id){
						add_k(returnObject.m.k,id,obj,true);
					}
				}else{
					add_k(returnObject.m.k,id,obj);
				}
				returnObject.element=obj.element;
				currentObject=obj;
			}else{
				//看来这里还无法支持单个替换
				mb.log("尚无法支持无返回值")
			}
		}
	})
	returnObject.m.inits.push(function(){
		initFlag=true;
		if(currentObject && currentObject.init){
			currentObject.init();
		}
	})
	returnObject.m.destroys.push(function(){
		if(currentObject && currentObject.destroy){
			currentObject.destroy();
		}
	})
	return returnObject;
}

export=function(p:{
	whenNotObject(mve:MveFun,x:XModel,e:EModel,json,m:LifeModel):EWithLife;
	buildElement(mve:MveFun,x:XModel,e:EModel,json,m:LifeModel):EWithLife;
}):ParseType{
	function buildElement(mve:MveFun,x:XModel,e:EModel,json,m:LifeModel){
		const obj=p.buildElement(mve,x,e,json,m);
		const el=obj.element;
		m=obj.m;
		m.k=add_k(m.k,json.id,el);
		return {
			element:el,
			m:m
		};
	}
	const ParseObject=function(mve:MveFun,x:XModel,e:EModel,json,m:LifeModel):EWithLife{
		json=json||"";
		if(typeof(json)!="object"){
			return p.whenNotObject(mve,x,e,json,m);
		}else{
			const type=json.type;
			const id=json.id;
			if(type){
				const tp=typeof(type)
				if(tp=="string"){
					return buildElement(mve,x,e,json,m);
				}else{
					//这种子组件方式无法表达泛型，需要移除。type直接是mve节点，不需要接受自身的json参数
					if(tp=='function'){
						const obj=type(json)(e);
						mb.log("已经快淘汰，type节点不作函数，直接返回mve的返回",json,obj);
						return addMve(obj,m,id);
					}else{
						mb.log("不合法的type类型",type);
					}
				}
			}else{
				if(json.mve && typeof(json.mve)=='function'){
					mb.log("未来逐渐不使用这个mve.Return，直接返回mve.Outter,生命周期重用",json)
					const obj=json.mve(e);
					return addMve(obj,m,id);
				}else if(json.render && typeof(json.render)=='function'){
					return addDynamicMve(mve,x,e,json,m);
				}else if(json.element){
					m=addLifeCycle(json,m);
					return buildElement(mve,x,e,json.element,m);
				}else{
					mb.log("暂时不支持",json)
				}
			}
		};
	};
	function parse(mve:MveFun,x:XModel,e:EModel,json,m:LifeModel){
		if(typeof(json)=="function"){
			mb.log("未来逐渐不使用这个mve.Return，直接返回mve.Outter,生命周期重用",json)
			const vm=json(e);
			m=addLifeCycle(vm,m);
			return {
				element:vm.element,
				m:m
			};
		}else{
			return ParseObject(mve,x,e,json,m);
		}
	};
	return parse;
};