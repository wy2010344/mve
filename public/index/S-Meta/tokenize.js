({
	success:function(){
		var is=(function(){
			return {
				whiteSpace:(function() {
					var cs=[' ','\r','\n','\t'];
					return function(c) {
						return has(cs,c)
					};
				})()
			};
		})();

		var parse_until=function(txt,flag,end){
			var start=flag;
			var nobreak=true;
			while(flag<txt.length && nobreak){
				var c=txt[flag];
				if (c==end) {
					nobreak=false;
				}else{
					if (c=='\\') {
						flag++;
					}
					flag++;
				}
			}
			return flag;
		};
		return function(txt){
			var flag=0;
			while(flag<txt.length){
				var c=txt[flag];
				if (is.whiteSpace(c)) {
					flag++;
				}else{
					if (c=='"') {
						var index=flag;
						flag++;
						var end=parse_until(txt,flag,'"');
						if (end<txt.length) {
							var str=txt.substr(index,end+1-index);
							flag=index+str.length;
							tokens=lib.s.extend({type:"string",begin:index,value:str},tokens);
						}else{
						}
					}else if(c=='`'){

					}else if(c=='('){

					}else if(c==')'){

					}else{

					}
				}
			}
		};
	}
})