({
	data:{
		util:"./util.js"
	},
	delay:true,
	success:function() {
		var isID=function(str){
			var ret=true;
			for(var i=0;i<str.length;i++){
				var c=str[i];
				if(c==' ' || c=='\t' || c=='\n' || c=='\r'){
					ret=false;
				}else
				if(c=='*'||c=='\''){ // || c=='.' 
					ret=false;
				}
			}
			return ret;
		};

		var buildBracket=function(cs,vs,scope){
			var max=cs.children.length-1;
			mb.Array.forEach(cs.children,function(c,i){
				var v=null;
				if(i==max && c.value.startsWith("...")){
					//最后的省略号
					var k=c.value.slice(3);
					if(isID(k)){
						scope=lib.util.kvs_extend(k,vs,scope);
					}else{
						throw k+"不是合法的ID4";
					}
				}else
				if (c.type=="id"&&isID(c.value)) {
					if(vs!=null){
						v=vs.First();
						vs=vs.Rest();
					}
					scope=lib.util.kvs_extend(c.value,v,scope);
				}
			});
			return scope;
		};
		var buildMatch=function(c,kvs,scope,buildLibFun){
			var x=c.value.substr(0,c.value.length-1);
			if(isID(x)){
				scope=lib.util.kvs_extend(
					x,
					buildLibFun(function(node){
						return lib.util.kvs_find1st(kvs,node.First());
					}),
					scope
				);
				/*由于可能重复定义，必须倒转，倒转后是v-k-v-k的形式*/
				for(var t=lib.util.reverse(kvs);t!=null;t=t.Rest()){
					var v=t.First();
					t=t.Rest();
					if(t==null){
						throw "过早结束"+n;
					}else{
						var k=t.First();
						if(isID(k)){
							scope=lib.util.kvs_extend(x+"."+k,v,scope);
						}else{
							//忽略
						}
					}
				}
			}else{
				throw x+"不是合法的ID2";
			}
			return scope;
		};

		var fun_toString=function(){
			return this.exp.toString.apply(this.exp,arguments);
		};
		var buildFunc=function(input,parentScope) {
			return new UserFun(input,parentScope);
		};
		return {
			isID:isID,
			buildBracket:buildBracket,
			buildMatch:buildMatch,
			util:lib.util
		}
	}
})