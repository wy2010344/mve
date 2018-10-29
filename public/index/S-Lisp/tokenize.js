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
					return !(is.whiteSpace(c) || is.brackets(c) || c=='"' || c=='`');
				},
				num:function(c) {
					return ('0'<=c && c<='9');
				}
			};
		})();
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
				/*begin,end*/
				substr:function(begin,end) {
					return txt.substr(begin,end-begin);
				},
				loc:function() {
					return lib.s.Location(row,col,index);
				},
				locMsg:function() {
					return "{"+(row+1)+"行"+(col+1)+"列}";
				}
			};
		};
		var locMsg=function(loc) {
			return "{"+(loc.row+1)+"行"+(loc.col+1)+"列}";
		};
		var string_from_trans=function(str,end,trans_map,trans_time) {
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
						var x=trans_map[c];
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
		var tokenize_split=function(q,tokens,type,loc,end) {
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
				var s=q.substr(start,q.index());
				q.shift();
				var old_s=q.substr(start-1,q.index()+1)
				if(trans_time!=0){
					s=string_from_trans(s,end,trans_map,trans_time);
				}
				return extend(
					lib.s.Token(type,s,old_s,loc),
					tokens
				);
			}
		};
		var trans_map={
			"r":"\r",
			"n":"\n",
			"t":"\t"
		};
		var extend=function(x,xs){
			return lib.s.extend(x,xs);
		};
		var tokenize=function(txt) {
			var q=que(txt);
			var tokens=null;
			while(q.current()!=undefined){
				if(is.whiteSpace(q.current())){
					q.shift();
				}else
				if(is.brackets.in(q.current())){
					var v=q.current();
					tokens=extend(
						lib.s.Token("BraL",v,v,q.loc()),
						tokens
					);
					q.shift();
				}else
				if(is.brackets.out(q.current())){
					var v=q.current();
					tokens=extend(
						lib.s.Token("BraR",v,v,q.loc()),
						tokens
					);
					q.shift();
				}else
				if(q.current()=='"'){
					tokens=tokenize_split(q,tokens,"string",q.loc(),'"');
				}else
				if(q.current()=='`'){
					tokens=tokenize_split(q,tokens,"comment",q.loc(),'`');
					//mb.log(s);//注释
				}else
				{
					//id
					var loc=q.loc();
					var start=q.index();
					while(q.current()!=undefined && is.notEnd(q.current())){
						q.shift();
					}
					var s=q.substr(start,q.index());
					if(s[0]=='\''){
						var n_s=s.slice(1);
						if(s==""){
							throw "ID过早结束"+locMsg(loc);
						}else{
							tokens=extend(
								lib.s.Token("quote",n_s,s,loc),
								tokens
							);
						}
					}else
					if(lib.s.isInt(s)) {
						//整数
						tokens=extend(
							lib.s.Token("int",parseInt(s),s,loc),
							tokens
						);
					}else
					/*
					if(lib.s.isFloat(s)){
						//浮点数
						tokens=extend(
							lib.s.Token("float",parseFloat(s),s,loc),
							tokens
						);
					}else
					*/
					if(s=="true"||s=="false"){
						//纯id
						tokens=extend(
							lib.s.Token("bool",s=="true",s,loc),
							tokens
						);
					}else{
						//纯id
						tokens=extend(
							lib.s.Token("id",s,s,loc),
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