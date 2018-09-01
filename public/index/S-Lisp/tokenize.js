({
	data:{
		s:"./s.js"
	},
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
				index:function() {
					return index;
				},
				substr:function(a,b) {
					return txt.substr(a,b);
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
		var trans_map=[
			"r","\r",
			"n","\n",
			"t","\t"
		];
		var trans_from_char=function(c) {
			var x=null;
			var i=0;
			while(i<trans_map.length && x==null){
				var key=trans_map[i];
				i++;
				var value=trans_map[i];
				i++;
				if(key==c){
					x=value;
				}
			}
			return x;
		};
		var trans_to_char=function(c) {
			var x=null;
			var i=0;
			while(i<trans_map.length && x==null){
				var value=trans_map[i];
				i++;
				var key=trans_map[i];
				i++;
				if(key==c){
					x=value;
				}
			}
			return x;
		};

		var string_from_trans=function(str,end,trans_time) {
			var s="";
			var i=0;
			var len=str.length;
			while(i<len){
				var c=str[i];
				if(c=='\\'){
					i++;
					c=str[i];
					if(c==end){
						s=s+end;
					}else
					if(c=="\\"){
						s=s+"\\";
					}else{
						var x=trans_from_char(c);
						if(x){
							s=s+x;
						}else{
							throw "非法转义"+c+"在字符串"+str;
						}
					}
				}else{
					s=s+c;
				}
				i++;
			}
			return s;
		};
		var string_to_trans=function(str,end) {
			var s=end;
			var i=0;
			var len=str.length;
			while(i<len){
				var c=str[i];
				if(c=="\\"){
					s=s+"\\\\";
				}else
				if(c==end){
					s=s+"\\"+end;
				}else{
					var x=trans_to_char(c);
					if(x){
						s=s+"\\"+x;
					}else{
						s=s+c;
					}
				}
				i++;
			}
			s=s+end;
			return s;
		}
		var parseStr=function(end,q) {
			//字符串
			var loc=q.loc();
			q.shift();
			var nobreak=true;
			var start=q.index();
			var trans_time=0;
			while(q.current()!=undefined && nobreak){
				if(q.current()==end){
					nobreak=false;
				}else{
					if(q.current()=='\\'){
						q.shift();
						trans_time++;
					}
					q.shift();
				}
			}
			if(q.current()==undefined){
				throw end+"过早结束"+q.locMsg();
			}else{
				var s=q.substr(start,q.index()-start);
				q.shift();
				if(trans_time!=0){
					return string_from_trans(s,end,trans_time);
				}else{
					return s;
				}
			}
		};
		var extend=lib.s.extend;
		function Token(type,value,loc) {
			this.type=type;
			this.value=value;
			this.loc=loc;
		};
		mb.Object.ember(Token.prototype,{
			toString:function() {
				if(this.type=="quote"){
					return "'"+this.value;
				}else
				if(this.type=="string"){
					return string_to_trans(this.value,"\"");
				}else{
					return this.value;
				}
			}
		});
		var tokenize=function(txt) {
			var q=que(txt);
			var tokens=null;
			while(q.current()!=undefined){
				if(is.whiteSpace(q.current())){
					q.shift();
				}else
				if(is.brackets.in(q.current())){
					tokens=extend(
						new Token("BraL",q.current(),q.loc()),
						tokens
					);
					q.shift();
				}else
				if(is.brackets.out(q.current())){
					tokens=extend(
						new Token("BraR",q.current(),q.loc()),
						tokens
					);
					q.shift();
				}else
				if(q.current()=='"'){
					var loc=q.loc();
					var s=parseStr('"',q);
					tokens=extend(
						new Token("string",s,loc),
						tokens
					);
				}else
				if(q.current()=='`'){
					var s=parseStr('`',q);
					//mb.log(s);//注释
				}else
				{
					//id
					var loc=q.loc();
					var start=q.index();
					while(q.current()!=undefined && is.notEnd(q.current())){
						q.shift();
					}
					var s=q.substr(start,q.index()-start);
					if(s[0]=='\''){
						s=s.slice(1);
						if(s==""){
							throw "ID过早结束"+locMsg(loc);
						}else{
							tokens=extend(
								new Token("quote",s,loc),
								tokens
							);
						}
					}else
					if(isInt(s)) {
						//整数
						tokens=extend(
							new Token("int",parseInt(s),loc),
							tokens
						);
					}else
					if(isFloat(s)){
						//浮点数
						tokens=extend(
							new Token("float",parseFloat(s),loc),
							tokens
						);
					}else{
						//纯id
						tokens=extend(
							new Token("id",s,loc),
							tokens
						);
					}
				}
			}
			return tokens;
		};
		return tokenize;
	}
})