({
	delay:true,
	success:function() {
		var is=(function() {
			
			var has=function(cs,c) {
				return cs.indexOf(c)>-1;
			};
			return {
				whiteSpace:(function() {
					var cs=[' ','\r','\n','\t'];
					return function(c) {
						return has(cs,c)
					};
				})(),
				brackets:(function() {
					var cs_in=['(','[','{'];
					var cs_out=[')',']','}'];

					var rin=function(c) {
						return has(cs_in,c);
					};
					var rout=function(c) {
						return has(cs_out,c);
					};
					var all=function(c) {
						return (rin(c) || rout(c));
					};
					all.in=rin;
					all.out=rout;
					return all;
				})(),
				notEnd:function(c) {
					return !(is.whiteSpace(c) || is.brackets(c));
				},
				num:function(c) {
					return ('0'<=c && c<='9');
				}
			};
		})();

		/*
		允许负数
		*/
		var isInt=function(s) {
			var ret=true;
			var i=0;
			if(s[i]=='-'){
				i==1;
			}
			while(i<s.length){
				var c=s[i];
				ret=(ret && '0'<=c && c<='9'); 
				i++;
			}
			return ret;
		};
		var isFloat=function(s) {
			var ret=true;
			var i=0;
			if(s[i]=='-'){
				i==1;
			}
			var noPoint=true;
			while(i<s.length){
				var c=s[i];
				if(c=='.'){
					if(noPoint){
						noPoint=false;
					}else{
						//重复出现小数点
						ret=ret && false;
					}
				}else
				{
					ret=(ret && '0'<=c && c<= '9');
				}
				i++;
			}
			return ret;
		};
		var que=function(txt) {
			var index=0;
			var row=0,col=0;
			return {
				current:function() {
					return txt[index];
				},
				shift:function() {
					index++;
					if (txt[index]=='\n') {
						row++;
						col=0;
					}else{
						col++;
					}
				},
				loc:function() {
					return {
						col:col,
						row:row
					};
				},
				locMsg:function() {
					return "{"+(row+1)+"行"+(col+1)+"列}";
				}
			};
		};
		var locMsg=function(loc) {
			return "{"+(loc.row+1)+"行"+(loc.col+1)+"列}";
		};
		var parseStr=function(end,q) {
			//字符串
			var loc=q.loc();
			q.shift();
			var nobreak=true;
			var notrans=true;
			var s="";
			while(q.current()!=undefined && nobreak){

				if(q.current()==end && notrans){
					nobreak=false;
				}else{
					var add=true;
					if(q.current()=='\\'){
						if(notrans){
							//此时要转义，不添加"\\"
							add=false;
						}
						notrans=!notrans;
					}else{
						notrans=true;
					}
					if(add){
						s=s+q.current();
					}
					q.shift();
				}
			}
			if(q.current()==undefined){
				throw "过早结束"+q.locMsg();
			}else{
				q.shift();
				return s;
			}
		};
		var tokenize=function(txt) {
			var q=que(txt);

			var tokens=[];

			var jumpBra=function(type) {
				tokens.push({
					value:q.current(),
					type:type,
					loc:q.loc()
				});
				q.shift();
			};
			while(q.current()!=undefined){
				if(is.whiteSpace(q.current())){
					while(q.current()!=undefined && is.whiteSpace(q.current())){
						q.shift();
					}
				}else
				if(is.brackets.in(q.current())){
					jumpBra("brackets_in");
				}else
				if(is.brackets.out(q.current())){
					jumpBra("brackets_out");
				}else
				if(q.current()=='"'){

					var s=parseStr('"',q);
					tokens.push({
						value:s,
						type:"string",
						loc:loc
					});
				}else
				if(q.current()=='`'){
					var s=parseStr('`',q);
					//mb.log(s);//注释
				}else
				{
					//id
					var s="";
					var loc=q.loc();
					while(q.current()!=undefined && is.notEnd(q.current())){
						s=s+q.current();
						q.shift();
					}
					if(s[0]=='\''){
						s=s.slice(1);
						if(s==""){
							throw "过早结束"+locMsg(loc);
						}else{
							tokens.push({
								value:s,
								type:"prevent",
								loc:loc
							});
						}
					}else
					if(isInt(s)) {
						//整数
						tokens.push({
							value:parseInt(s),
							type:"int",
							loc:loc
						});
					}else
					if(isFloat(s)){
						//浮点数
						tokens.push({
							value:parseFloat(s),
							type:"float",
							loc:loc
						});
					}else{
						//纯id
						tokens.push({
							value:s,
							type:"id",
							loc:loc
						});
					}
				}
			}
			return tokens;
		};
		return tokenize;
	}
})