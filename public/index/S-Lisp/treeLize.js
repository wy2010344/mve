({
	delay:true,
	success:function() {
		var bracketType={
			"(":"()",
			"[":"[]",
			"{":"{}"
		};

		var toString={
			bracket:function(bool){
				var current=this;
				var rs=[];
				rs.push(current.type[0]);
				mb.Array.forEach(current.children,function(c,i){
					rs.push(c.toString(bool));
				});
				rs.push(current.type[1]);
				return rs.join("  ");
			},
			prevent:function(){
				return "'"+this.value;
			},
			normal:function(){
				return this.value;
			}
		};
		var treeLize=function(tokens) {
			var root={
				type:"{}",
				children:[],
				toString:toString.bracket
			};
			var current=root;
			var index=0;
			var jumpIn=function(token) {
				if (token.type=="brackets_in") {
					var tmp={
						type:bracketType[token.value],
						loc:token.loc,
						parent:current,
						children:[]
					};
					current.children.push(tmp);
					current=tmp;
					return true;
				}else{
					return false;
				}
			};
			var jumpOut=function(token) {
				if(token.type=="brackets_out"){
					current.toString=toString.bracket;
					var tmp=current.parent;
					current.parent=undefined;
					current=tmp;
					return true;
				}else{
					return false;
				}
			};
			var line=function(token,index){
				if(jumpIn(token) || jumpOut(token)){

				}else{
					if(token.type=="prevent"){
						token.toString=toString.prevent;
					}else{
						token.toString=toString.normal;
					}
					if(token.type=="prevent"){
						if(current.type=='()' || current.type=='{}'){
							 token.type="string";
						}else
						if(current.type=='[]'){
							 token.type="id";
						}
					}else
					if(token.type=="id"){
						if(current.type=='[]'){
							 token.type="string";
						}
					}
					current.children.push(token);
				}
			};
			while(index<tokens.length){
				var token=tokens[index];
				line(token,index);
				index++;
			}
			return root;
		};
		return treeLize;
	}
});