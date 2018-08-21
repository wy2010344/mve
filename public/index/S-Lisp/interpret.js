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
		var buildKVSMatch=function(scope,x,kvs,buildLibFun){
			x=x.substr(0,x.length-1);
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
		var buildKVSMatch=function() {
			throw "为了雪藏的kvs-match，暂时不允许以*号结尾";
		};
		var buildBracket=function(cs,vs,scope,buildLibFun){
			var max=cs.children.length-1;
			mb.Array.forEach(cs.children,function(c,i){
				var v=null;
				if(i==max && c.value.startsWith("...")){
					//最后的省略号
					var k=c.value.slice(3);
					if(k.endsWith("*")){
						scope=buildKVSMatch(scope,k,kvs,buildLibFun);
					}else{
						scope=buildNormal(scope,k,vs);
					}
				}else{
					if(vs!=null){
						v=vs.First();
						vs=vs.Rest();
					}
					scope=buildMatch(scope,c,v,buildLibFun);
				}
			});
			return scope;
		};
		var buildNormal=function(scope,k,v) {
			if(isID(k)){
				scope=lib.util.kvs_extend(k,v,scope);
			}else{
				throw k+"不是合法的ID1";
			}
			return scope;
		};
		var buildMatch=function(scope,c,v,buildLibFun) {
			if(c.type=="()"){
				scope=buildBracket(c,v,scope,buildLibFun);
			}else
			if(c.type=="id"){
				if(c.value.endsWith("*")){
					scope=buildKVSMatch(scope,c.value,v,buildLibFun);
				}else{
					scope=buildNormal(scope,c.value,v);
				}
			}else{
				throw c.toString()+"不是合法的ID类型";
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
			buildBracket:buildBracket,
			buildMatch:buildMatch,
			util:lib.util
		}
	}
})