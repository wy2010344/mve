'use strict';
if(!Function.prototype.bind){
	Function.prototype.bind = function(context) {
		var self=this,args = Array.prototype.slice.call(arguments);    
    return function(){
      return self.apply(context, args.slice(1));
    };
	};
}
var mb={};
/**惰性加载Promise*/
mb._promise_=function(){
	if(mb._promise_.one){
		return mb._promise_.one
	}
	//参考了https://zhuanlan.zhihu.com/p/138322849
	var Promise=function (callback){
		this.handlers=[];
		this.state=Promise.PENDING;
		this.value=null;
		var reject=Promise.generatePromistSet(this,Promise.REJECTED);
		try{
			callback(Promise.generatePromistSet(this,Promise.RESOLVED),reject);
		}catch(e){
			reject(e);
		}
	}
	Promise.PENDING="PENDING";
	Promise.RESOLVED="RESOLVED";
	Promise.REJECTED="REJECTED";
	Promise.generatePromistSet=function(that,state){
		return function(value){
			that.value=value;
			that.state=state;
			that.execHandlers();
		}
	};
	Promise.prototype.execHandlers=function(){
		var that=this;
		var handlers=that.handlers;
		that.handlers=[];
		handlers.forEach(function(handler){
			if(that.state==Promise.REJECTED){
				return handler.onFail(that.value);
			}else{
				return handler.onSuccess(that.value);
			}
		});
	};
	Promise.prototype.attachHandler=function(handler){
		this.handlers.push(handler);
		if(this.state!=Promise.PENDING){
			//PENDING期间不允许进来
			this.execHandlers();
		}
	};
	Promise.prototype.then=function(onSuccess,onFail){
		const that=this;
		return new Promise(function(resolve,reject){
			return that.attachHandler({
				onSuccess:onSuccess?function(result){
					try{
						return resolve(onSuccess(result));
					}catch(e){
						return reject(e);
					}
				}:resolve,
				onFail:onFail?function(reason){
					try{
						return resolve(onFail(reason));
					}catch(e){
						return reject(e);
					}
				}:reject
			});
		});
	};
	mb._promise_.one=Promise;
	return Promise;
};


mb.Function=(function(){
	var quote=function(){
		return function(a){
			return a;
		}
	};
	quote.one=quote();
	var as_null=function(){
		return function(){
			return null;
		};
	};
	as_null.one=as_null();
	var list=function(){
		return function(){
			var r=[];
			for(var i=0;i<arguments.length;i++){
				r.push(arguments[i]);
			}
			return r;
		};
	};
	list.one=list();
	var equal=function(){
		return function(a,b){
			return a==b
		}
	};
	equal.one=equal();
	return {
		quote:quote,
		list:list,
		as_null:as_null,
		equal:equal,
		or_run:function(fun){
			if(fun){
				return fun();
			}
		},
		or_apply:function(fun,array){
			/*apply，将数组转化成参数列表*/
			if(fun){
				return fun.apply(null,array);
			}
		},
		or_call:function(fun){
			/*call，将参数列表转化成数组*/
			if(fun){
				var array=Array.prototype.slice.call(arguments,1);
				return fun.apply(null,array);
			}
		}
	};
})();

/**
冻结
*/
if(Object.freeze){
	mb.freeze=Object.freeze.bind(Object);
}else{
	mb.freeze=mb.Function.quote.one;
}


mb.Array={
	isArray:function(array){
		return Object.prototype.toString.call(array) === '[object Array]';
	},
	ieEmpty:(function(){
		if(mb.isIE){
			return function(ary){
				var ret=[];
				mb.Array.forEach(ary, function(ar){
					if(ar!==undefined){
						//去除其中的undefined
						ret.push(ar);
					}
				});
				ary.length=0;
				mb.Array.forEach(ret,function(ar){
					ary.push(ar);
				});
				return ary;
			};
		}else{
			return mb.Function.as_null.one;
		}
	})(),
	getLast:function(array){
		return array.get(array.size()-1)
	},
	forEach:function(array,func){
		var size=array.size();
		for(var i=0;i<size;i++){
			func(array.get(i),i);
		}
	},
	map:function(array,func){
		var ret=[];
		var size=array.size();
		for(var i=0;i<size;i++){
			ret[i]=func(array.get(i),i);
		}
		return ret;
	},
	flatMap:function(array,func){
		var ret=[];
		var size=array.size();
		for(var i=0;i<size;i++){
			var vr=func(array.get(i),i)
			var bsize=vr.size();
			for(var x=0;x<bsize;x++){
				ret.push(vr.get(x));
			}
		}
		return ret;
	},
	reduce:function(array,func,init){
		var size=array.size();
		for(var i=0;i<size;i++){
			init=func(init,array.get(i),i,array);
		}
		return init;
  },
  some:function(array,fun){
    return mb.Array.reduce(array,function(init,row,index){
      return fun(row,index) || init;
    },false)
  },
  every:function(array,fun){
    return mb.Array.reduce(array,function(init,row,index){
      return fun(row,index) && init;
    },true)
  },
	filter:function(array,func){
		var ret=[];
		var size=array.size();
		for(var i=0;i<size;i++){
			var row=array.get(i);
			if(func(row,i)){
				ret.push(row);
			}
		}
		return ret;
	},
	findIndex:function(array,fun){
		var ret=-1;
		var size=array.size();
		for(var i=0;i<size && ret==-1;i++){
			if(fun(array.get(i))){
				ret=i;
			}
		}
		return ret;
	},
	indexOf:function(array,row){
		return mb.Array.findIndex(array,function(c){
			return row==c;
		});
	},
	findRow:function(array,fun){
		return array.get(mb.Array.findIndex(array,fun));
	},
	findIndexes:function(array,fun){
		var ret=[];
		var size=array.size();
		for(var i=0;i<size;i++){
			if(fun(array.get(i))){
				ret.push(i);
			}
		}
		return ret;
	},
	indexesOf:function(array,row){
		return mb.Array.findIndexes(array,function(c){
			return row==c;
		});
	},
	/**其实是filter */
	findRows:function(array,fun){
		return mb.Array.filter(array,fun);
	},
	removeWhere:function(array,fun){
		var i=array.size()-1
		while(i>-1){
			var theRow=array.get(i);
			if(fun(theRow,i)){
				array.remove(i);
			}
			i--
		}
	},
	removeEqual:function(array,row){
		mb.Array.removeEqual(function(theRow){
			return theRow==row;
		})
	},
	move:function(array,oldIndex,newIndex){
	  var row=array.splice(oldIndex,1)[0];
		array.splice(newIndex,0,row);
	}
};
mb.Object={
	forEach:function(object,func){
		for(var key in object){
			func(object[key],key);
		}
	},
	map:function(object,func){
		var ret={};
		for(var key in object){
			ret[key]=func(object[key],key);
		}
		return ret;
	},
	reduce:function(obj,func,init){
		for(var k in obj){
			init=func(init,obj[k],k);
		}
		return init;
	},
	toArray:function(obj,func){
		var r=[];
		for(var k in obj){
			r.push(func(obj[k],k,obj));
		}
		return r;
	},
	ember:function(me,obj){
		for(var key in obj){
			me[key]=obj[key];
		}
		return me;
	},
	orDefault:function(me,obj){
		for(var key in obj){
			me[key]=me[key]||obj[key];
		}
		return me;
	},
	combine:function(a,b) {
		var ret={};
		for(var key in a){
			ret[key]=a[key];
		}
		for(var key in b){
			ret[key]=b[key];
		}
		return ret;
	},
	size:function(a){
		var i=0;
		for(var key in a){
			i++;
		}
		return i;
	}
};

mb.Date={
	stringify:function(v,format){
		var str = format;  
		str=str.replace(/yyyy|YYYY/,v.getFullYear());  
		str=str.replace(/MM/,(v.getMonth()+1)>9?(v.getMonth()+1).toString():'0' + (v.getMonth()+1));   
		str=str.replace(/dd|DD/,v.getDate()>9?v.getDate().toString():'0' + v.getDate());
		str=str.replace(/hh|HH/,v.getHours()>9?v.getHours().toString():'0' + v.getHours());
		str=str.replace(/mm/,v.getMinutes()>9?v.getMinutes().toString():'0' + v.getMinutes());
		str=str.replace(/ss/,v.getSeconds()>9?v.getSeconds().toString():'0' + v.getSeconds());   
		return str;   
	},
	getDays:function(year,month){
		if ((month == 1) || (month == 3) || (month == 5) || (month == 7) || (month == 8) || (month == 10) || (month == 12)){
			return 31
		}
		if ((month == 4) || (month == 6) || (month == 9) || (month == 11)){
			return 30
		}
		if ((year % 4 == 1) || (year % 4 == 2) || (year % 4 == 3)){
			return 28
		}
		if(year % 400 == 0){
			return 29
		}
		if(year % 100 == 0){
			return 28
		}
		return 29;
	}
};

mb.repeat={
	forEach(n,fun){
		for(var i=0;i<n;i++){
			fun(i);
		}
	},
	map(n,fun){
		var vs=[]
		for(var i=0;i<n;i++){
			vs.push(fun(i))
		}
		return vs;
	}
}


if(!String.prototype.trim){
	String.prototype.trim=function(){  
      return this.replace(/(^\s*)|(\s*$)/g, "");  
  };
}
if(!String.prototype.startsWith){
	String.prototype.startsWith=function(str) {
		return (this.indexOf(str)==0);
	};
}
if(!String.prototype.endsWith){
	String.prototype.endsWith=function(str) {
		return (this.lastIndexOf(str)==this.length-str.length);
	};
}
/**
 * 时间格式化
 * yyyy-MM-dd HH:mm:ss
 */
Date.prototype.format = function(formatStr){
	return mb.Date.stringify(this,formatStr);
};

Array.prototype.get = function(i){
	return this[i];
};
Array.prototype.size = function(){
	return this.length;
};
Array.prototype.getLast = function(){
	return this[this.length - 1]
};
Array.prototype.remove = function(i){
	this.splice(i,1)
};
Array.prototype.insert = function(i,row){
	this.splice(i,0,row)
};
Array.prototype.clear = function(){
	this.length=0;
};
Array.prototype.move = function(oldI,newI){
	var row=this.splice(oldI,1)[0]
	this.splice(newI,0,row)
};
if(!Array.prototype.forEach){
	Array.prototype.forEach=function(fun){
		mb.Array.forEach(this,fun);
	};
}
if(!Array.prototype.map){
	Array.prototype.map=function(fun){
		return mb.Array.map(this,fun);
	};
}
if(!Array.prototype.every){
	Array.prototype.every=function(fun){
		return mb.Array.every(this,fun);
	};
}
if(!Array.prototype.some){
	Array.prototype.some=function(fun){
		return mb.Array.some(this,fun);
	};
}
if(!Array.prototype.find){
	Array.prototype.find=function(fun){
		return mb.Array.findRow(this,fun)
	}
}
if(!Array.prototype.findIndex){
	Array.prototype.findIndex=function(fun){
		return mb.Array.findIndex(this,fun)
	}
}