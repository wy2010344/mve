


const forEachRun=function(array:(()=>void)[]){
	mb.Array.forEach(array,function(r:any){r();});
};
export=function(cache:mve.Value<any>){
	interface CreateDep{
		():DepCls;
		target:any;
	};
	class DepCls {
		static uid=0;
		id:number;
		subs:{[key:number]:any}={};
		constructor() {
			this.id=DepCls.uid++;
		}
		depend(){
			if(mveUtil.Dep.target){
				this.subs[mveUtil.Dep.target.id]=mveUtil.Dep.target;
			}
		}
		notify(){
			const oldSubs=this.subs;
			this.subs={};
			for(let key in oldSubs){
				oldSubs[key].update()
			}
		}
	};
	const mveUtil={
		 forEachRun,
		 Dep:(function(){
			let x:CreateDep=cache();
			 if(!x){
				const createDep=function(){
					return new DepCls();
				} as CreateDep;
				x=createDep;
				cache(x);
			}
			return x;
		 })(),
		 Value(v){       
			const dep=mveUtil.Dep();
			const ret:any=function(){
				 if(arguments.length==0){
					 //getter
					 dep.depend();
					 return v;
				 }else{
					 if(mveUtil.Dep.target){
						 throw "计算期间不允许修改";
					 }else{
						 v=arguments[0];
						 dep.notify();
					 }
				 }
			 };
			 ret._dep_=dep;
			 return ret;
		 },
		 /*将模型变成只读的*/
		 ReadValue(v){
			 return function(){
				 return v();
			 };
		 },
		 ArrayModel:(function(){
			 class ArrayModel<T> {
				 private _array:T[];
				 private _views:any[];
				 size:mve.Value<number>;
				 constructor(array?:T[]) {
					this._array=mb.Array.map(array||[],function(row){
						return row;
					});
					this._views=[];
					//长度是可观察的
					this.size=mveUtil.Value(0);
					this._reload_size_();
				 }
				 _reload_size_(){
					 this.size(this._array.length);
				 }
				 addView(view){
					 this._views.push(view);
					 //自动初始化
					 for(var i=0;i<this._array.length;i++){
						 view.insert(i,this._array[i])
					 }
				 }
				 removeView(view){
					 var index=mb.Array.indexOf(this._views,view);
					 if (index!=-1) {
						 this._views.splice(index,1);
					 }
				 }
				 insert(index:number,row:T){
					 this._array.splice(index,0,row);
					 mb.Array.forEach(this._views,function(view:any){
						 view.insert(index,row);
					 });
					 this._reload_size_();
				 }
				 removeAt(index:number){
					 /*更常识的使用方法*/
					 var row=this.get(index);
					 this._array.splice(index,1);
					 mb.Array.forEach(this._views,function(view:any){
						 view.remove(index);
					 });
					 this._reload_size_();
					 return row;
				 }
				 remove(row:T){
					 /*更常识的使用方法*/
					 var index=this.indexOf(row);
					 if(index>-1){
						 return this.removeAt(index);
					 }
				 }
				 move(row:T,target_row:T){
					 /*
					 常识的移动方式，向前手动则向前，向后移动则向后
					 如5中第3个，可移动1,2,4,5。分别是其它几个的序号而已
					 */
					 var target_index=this.indexOf(target_row);
					 if(target_index>-1){
						 this.moveTo(row,target_index);
					 }
				 }
				 moveTo(row:T,target_index:number){
					 var index=this.indexOf(row);
					 if(index>-1){
						 this._array.splice(index,1);
						 this._array.splice(target_index,0,row);
						 mb.Array.forEach(this._views,function(view:any){
							 view.move(index,target_index);
						 });
					 }
				 }
				 /*多控件用array和model，单控件用包装*/
				 moveToFirst(row:T) {
					 this.moveTo(row,0);
				 }
				 moveToLast(row:T){
					 this.moveTo(row,this.size()-1);
				 }
				 get(index:number){
					 return this._array[index];
				 }
				 shift(){
					 return this.removeAt(0);
				 }
				 unshift(row:T){
					 return this.insert(0,row)
				 }
				 pop(){
					 return this.removeAt(this.size()-1);
				 }
				 push(row:T){
					 return this.insert(this.size(),row);
				 }
				 clear(){
					 while(this.size()>0){
						 this.pop();
					 }
				 }
				 reset(array?:T[]){
					 this.clear();
					 let that=this;
					 mb.Array.forEach(array||[],function(row){
						 that.push(row);
					});
				 }
				 forEach(fun:(row:T,i:number)=>void){
					 for(var i=0;i<this.size();i++){
						 fun(this.get(i),i);
					 }
				 }
				 map(fun:<V>(row:T,i:number)=>V){
					 var ret=[];
					 for(var i=0;i<this.size();i++){
						 ret[i]=fun(this.get(i),i);
					 }
					 return ret;
				 }
				 reduce<V>(fun:(init:V,row:T,i:number)=>V,init:V){
					 for(var i=0;i<this.size();i++){
						 init=fun(init,this.get(i),i);
					 }
					 return init;
				 }
				 filter(fun:(row:T,i:number)=>boolean){
					 var ret=[];
					 for(var i=0;i<this.size();i++){
						 var row=this.get(i);
						 if(fun(row,i)){
							 ret.push(row);
						 }
					 }
					 return ret;
				 }
				 find_index(fun:(row:T,i:number)=>boolean){
					 var ret=-1;
					 for(var i=0;i<this.size() && ret==-1;i++){
						 if(fun(this.get(i),i)){
							 ret=i;
						 }
					 }
					 return ret;
				 }
				 indexOf(row:T,fun?:(row:T,i:number)=>boolean){
					 const func=fun||function(c){
							return c==row;
						};
					 return this.find_index(func);
				 }
				 find_row(fun:(row:T,i:number)=>boolean){
					 var index=this.find_index(fun);
					 if(index>-1){
						 return this.get(index);
					 }
				 }
			 }
				return function(array){
					return new ArrayModel(array);
				};
		 })(),
		 Watcher:(function(){      
			var uid=0;
			const w=window as any;
			w._watcher_size=0;
			w._watcher={};//监视Watcher是否销毁。
			class Watcher {
				enable=true;
				id:number;
				p;
				constructor(p) {
					p.before=p.before||mb.Function.quote.one;
					p.after=p.after||mb.Function.quote.one;
					this.p=p;
					this.id=uid++;
					w._watcher[this.id]=p.exp;
					w._watcher_size++;
					this.update();
				}
				update(){
					if(this.enable){
						var before=this.p.before();
						/**
						 * 每一次exp计算时，将计算中引用到的Value/Cache等的subs包含自己。
						 * 每次改变通知时，subs的每个watch
						 * 
						 * 条件依赖b，不依赖时，b的任何变化影响不到，依赖时，b的任何变化都能影响。
						 * a->true,引用b,a->false，不引用b,但是b的subs都含有me，只有下一次b改变时才计算更新。也就是b的计算不影响，仍通知了，通知了更新了引用。
						 * 
						 * 静态的，所有watch实例与dep(Value/Cache)一起销毁。
						 * 通常作为源的dep(Value/Cache)生存期更长，某些动态生成的watch组件，如Array的repeat和navigation，没办法销毁subs中的引用，每次仍会计算，则会累积膨胀，内存泄露。
						 * 有一个办法，就是销毁时，watch中的exp自动置为空，则下一次更新时不依赖到。
						 * Array的repeat每个都会平等地依赖到，影响倒是不大
						 * navigation的更新只能是事件更新，不能传递value。
						 */
						mveUtil.Dep.target=this;
						var after=this.p.exp(before);
						mveUtil.Dep.target=null;
						
						this.p.after(after);
					}
				}
				disable(){
					this.enable=false;
					delete w._watcher[this.id];
					w._watcher_size--;
				}
			}
			return function(p){
				return new Watcher(p);
			};
		 })(),
		 Cache(watch,func){
			 var dep=mveUtil.Dep();
			 var cache;
			 watch({
				 exp:function(){
					cache=func();
					dep.notify();
				 }
			 });
			 return function(){
				 //只有getter;
				 dep.depend();
				 return cache;
			 };
		 },
		 generateMe:(function(){
			const bindFactory=function(watch){
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
			const if_bind=function(bind) {
				return function(value,f){
					if(value!=undefined){
						bind(value,f);
					} 
				};
			};

			const children=function(av){
				return [av];
			};
			return function(){
				const watchPool=[];
				const Watch=function(p){
					const w=mveUtil.Watcher(p);
					watchPool.push(w);
					return w;
				};
				const Cache=function(exp){
					return mveUtil.Cache(Watch,exp);
				};
				/**
				element
				init
				destroy
	
				out:附加到生成的实体上
				*/
				const bind=bindFactory(Watch);
				return {
					me:<mve.OldInner>{
						k:{},
						Value:mveUtil.Value,
						ReadValue:mveUtil.ReadValue,
						ArrayModel:mveUtil.ArrayModel as any,
						Watch:Watch,
						Cache:Cache,
						//兼容旧的js脚本（非ts脚本）
						children:children
					},
					life:{
						watch:Watch,
						bind:bind,
						if_bind:if_bind(bind)
					},
					forEachRun,
					destroy(){
						var w;
						while((w=watchPool.shift())!=null){
							w.disable();
						}
					}
				};
			}
		 })()
	};
	return mveUtil;
}