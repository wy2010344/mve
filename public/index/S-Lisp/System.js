
({
	data:{
		s:"./s.js"
	},
	success:function(p){
		var Fun=p.Fun;
		
        var or=function(a,b){
            return a||b;
        };
        var and=function(a,b){
            return a&&b;
        };
        var reduce=function(args,func,init) {
            for(var t=args;t!=null;t=t.Rest()){
                init=func(init,t.First());
            }
            return init;
        };
        var compare=function(args,check,func){
            var last=args.First();
            var init=true;
            check(last);
            //mb.log(args.toString())
            for(var t=args.Rest();t!=null;t=t.Rest()){
                var now=t.First();
                check(now);
                init=and(init,func(last,now));
                last=now;
            }
            return init;
        };
        var check_is_number=function(s){
            if(s==0){
                return true;
            }else
            if(s && s.constructor==Number){
                return true;
            }else{
                mb.log(s+"不是合法的数字类型"+s.constructor);
                return false;
            }
        };
        var kvs_path=function(kvs,paths){
            var value=null;
            while(paths!=null){
                var path=paths.First();
                value=lib.s.kvs_find1st(kvs,path);
                paths=paths.Rest();
                kvs=value;
            }
            return value;
        };
        var eq=function(args,check){
            //可用于数字，字符串，实体
            return compare(args,check,function(last,now){
                return (last==now);
            });
        };
		
		function FirstFun(){}
		FirstFun.prototype=new Fun();
		;
		mb.Object.ember(FirstFun.prototype,{
			toString:function(){
				return "first";
			},
			exec:function(args){
                
                var v=args.First();
                return v.First();
            
			},
			ftype:function(){
				return this.Function_type.lib;
			}
		});
						
		function RestFun(){}
		RestFun.prototype=new Fun();
		;
		mb.Object.ember(RestFun.prototype,{
			toString:function(){
				return "rest";
			},
			exec:function(args){
                
                var v=args.First();
                return v.Rest();
            
			},
			ftype:function(){
				return this.Function_type.lib;
			}
		});
						
		function ExtendFun(){}
		ExtendFun.prototype=new Fun();
		;
		mb.Object.ember(ExtendFun.prototype,{
			toString:function(){
				return "extend";
			},
			exec:function(args){
                
                return lib.s.extend(args.First(),args.Rest().First());
            
			},
			ftype:function(){
				return this.Function_type.lib;
			}
		});
						
		function LengthFun(){}
		LengthFun.prototype=new Fun();
		;
		mb.Object.ember(LengthFun.prototype,{
			toString:function(){
				return "length";
			},
			exec:function(args){
                
                return args.First().Length();
            
			},
			ftype:function(){
				return this.Function_type.lib;
			}
		});
						
		function IsemptyFun(){}
		IsemptyFun.prototype=new Fun();
		;
		mb.Object.ember(IsemptyFun.prototype,{
			toString:function(){
				return "empty?";
			},
			exec:function(args){
                
                return (args.First()==null);
            
			},
			ftype:function(){
				return this.Function_type.lib;
			}
		});
						
		function IsexistFun(){}
		IsexistFun.prototype=new Fun();
		;
		mb.Object.ember(IsexistFun.prototype,{
			toString:function(){
				return "exist?";
			},
			exec:function(args){
                
                return (args.First()!=null);
            
			},
			ftype:function(){
				return this.Function_type.lib;
			}
		});
						
		function IfFun(){}
		IfFun.prototype=new Fun();
		
            IfFun.base_run=function(args){
                if(args.First()){
                    return args.Rest().First();
                }else{
                    args=args.Rest().Rest();
                    if(args){
                        return args.First();
                    }else{
                        return null;
                    }
                }
            };
            ;
		mb.Object.ember(IfFun.prototype,{
			toString:function(){
				return "if";
			},
			exec:function(args){
                
                return IfFun.base_run(args);
            
			},
			ftype:function(){
				return this.Function_type.lib;
			}
		});
						
		function EqFun(){}
		EqFun.prototype=new Fun();
		;
		mb.Object.ember(EqFun.prototype,{
			toString:function(){
				return "eq";
			},
			exec:function(args){
                
                return eq(args,function(){return true;});
            
			},
			ftype:function(){
				return this.Function_type.lib;
			}
		});
						
		function ApplyFun(){}
		ApplyFun.prototype=new Fun();
		;
		mb.Object.ember(ApplyFun.prototype,{
			toString:function(){
				return "apply";
			},
			exec:function(args){
                
                var run=args.First();
                args=args.Rest();
                return run.exec(args.First());
            
			},
			ftype:function(){
				return this.Function_type.lib;
			}
		});
						
		function LogFun(){}
		LogFun.prototype=new Fun();
		;
		mb.Object.ember(LogFun.prototype,{
			toString:function(){
				return "log";
			},
			exec:function(args){
                
                var cs=[];
                for(var t=args;t!=null;t=t.Rest()){
                    cs.push(p.toString(t.First(),true));
                }
                p.log(cs);
            
			},
			ftype:function(){
				return this.Function_type.lib;
			}
		});
						
		function ToStringFun(){}
		ToStringFun.prototype=new Fun();
		;
		mb.Object.ember(ToStringFun.prototype,{
			toString:function(){
				return "toString";
			},
			exec:function(args){
                
                var b=args.First();
                return p.toString(b,false);
            
			},
			ftype:function(){
				return this.Function_type.lib;
			}
		});
						
		function StringifyFun(){}
		StringifyFun.prototype=new Fun();
		;
		mb.Object.ember(StringifyFun.prototype,{
			toString:function(){
				return "stringify";
			},
			exec:function(args){
                
                var b=args.First();  
                return p.toString(b,true);
            
			},
			ftype:function(){
				return this.Function_type.lib;
			}
		});
						
		function TypeFun(){}
		TypeFun.prototype=new Fun();
		
                TypeFun.base_run=function(n){
                    if(n==null){
                        return "list";
                    }else{
                        if(p.isList(n)){
                            return "list";
                        }else
                        if(p.isFun(n)){
                            return "function";
                        }else{
                            var t=typeof(n);
                            if(t=="string"){
                                return "string";
                            }else
                            if(t=="boolean"){
                                return "bool";
                            }else
                            if(t=="number"){
                                if(n%1===0){
                                    return "int";
                                }else{
                                    return "float";
                                }
                            }else{
                                return t;
                            }
                        }
                    }
                }
            ;
		mb.Object.ember(TypeFun.prototype,{
			toString:function(){
				return "type";
			},
			exec:function(args){
                
                var n=args.First();
                return TypeFun.base_run(n);
            
			},
			ftype:function(){
				return this.Function_type.lib;
			}
		});
						
		function AddFun(){}
		AddFun.prototype=new Fun();
		;
		mb.Object.ember(AddFun.prototype,{
			toString:function(){
				return "+";
			},
			exec:function(args){
                
                return reduce(args,function(last,now){
                    return last+now;
                },0);
            
			},
			ftype:function(){
				return this.Function_type.lib;
			}
		});
						
		function SubFun(){}
		SubFun.prototype=new Fun();
		;
		mb.Object.ember(SubFun.prototype,{
			toString:function(){
				return "-";
			},
			exec:function(args){
                
                var r=args.First();
                return reduce(args.Rest(),function(last,now){
                    return last-now;
                },r);
            
			},
			ftype:function(){
				return this.Function_type.lib;
			}
		});
						
		function MultiFun(){}
		MultiFun.prototype=new Fun();
		;
		mb.Object.ember(MultiFun.prototype,{
			toString:function(){
				return "*";
			},
			exec:function(args){
                
                return reduce(args,function(last,now){
                    return last*now;
                },1);
            
			},
			ftype:function(){
				return this.Function_type.lib;
			}
		});
						
		function DivFun(){}
		DivFun.prototype=new Fun();
		;
		mb.Object.ember(DivFun.prototype,{
			toString:function(){
				return "/";
			},
			exec:function(args){
                
                var r=args.First();
                return reduce(args.Rest(),function(last,now){
                    return last/now;
                },r);
            
			},
			ftype:function(){
				return this.Function_type.lib;
			}
		});
						
		function ParseIntFun(){}
		ParseIntFun.prototype=new Fun();
		;
		mb.Object.ember(ParseIntFun.prototype,{
			toString:function(){
				return "parseInt";
			},
			exec:function(args){
                
                return parseInt(args.First());
            
			},
			ftype:function(){
				return this.Function_type.lib;
			}
		});
						
		function MBiggerFun(){}
		MBiggerFun.prototype=new Fun();
		;
		mb.Object.ember(MBiggerFun.prototype,{
			toString:function(){
				return ">";
			},
			exec:function(args){
                
                //数字
                return compare(args,check_is_number,function(last,now){
                    return (last>now);
                });
            
			},
			ftype:function(){
				return this.Function_type.lib;
			}
		});
						
		function MSmallerFun(){}
		MSmallerFun.prototype=new Fun();
		;
		mb.Object.ember(MSmallerFun.prototype,{
			toString:function(){
				return "<";
			},
			exec:function(args){
                
                //数字
                return compare(args,check_is_number,function(last,now){
                    return (last<now);
                });
            
			},
			ftype:function(){
				return this.Function_type.lib;
			}
		});
						
		function MEqFun(){}
		MEqFun.prototype=new Fun();
		
                MEqFun.base_run=function(args){
                    return eq(args,check_is_number);
                }
            ;
		mb.Object.ember(MEqFun.prototype,{
			toString:function(){
				return "=";
			},
			exec:function(args){
                
                return MEqFun.base_run(args);
            
			},
			ftype:function(){
				return this.Function_type.lib;
			}
		});
						
		function AndFun(){}
		AndFun.prototype=new Fun();
		;
		mb.Object.ember(AndFun.prototype,{
			toString:function(){
				return "and";
			},
			exec:function(args){
                
                return reduce(args,function(init,v) {
                    return and(init,v);
                },true);
            
			},
			ftype:function(){
				return this.Function_type.lib;
			}
		});
						
		function OrFun(){}
		OrFun.prototype=new Fun();
		;
		mb.Object.ember(OrFun.prototype,{
			toString:function(){
				return "or";
			},
			exec:function(args){
                
                return reduce(args,function(init,v) {
                    return or(init,v);
                },false);
            
			},
			ftype:function(){
				return this.Function_type.lib;
			}
		});
						
		function NotFun(){}
		NotFun.prototype=new Fun();
		;
		mb.Object.ember(NotFun.prototype,{
			toString:function(){
				return "not";
			},
			exec:function(args){
                
                return !args.First();
            
			},
			ftype:function(){
				return this.Function_type.lib;
			}
		});
						
		function Str_eqFun(){}
		Str_eqFun.prototype=new Fun();
		;
		mb.Object.ember(Str_eqFun.prototype,{
			toString:function(){
				return "str-eq";
			},
			exec:function(args){
                
                return eq(args,function(s){
                    if(s && s.constructor==String){
                        return true;
                    }else{
                        return false;
                    }
                });
            
			},
			ftype:function(){
				return this.Function_type.lib;
			}
		});
						
		function Str_lengthFun(){}
		Str_lengthFun.prototype=new Fun();
		;
		mb.Object.ember(Str_lengthFun.prototype,{
			toString:function(){
				return "str-length";
			},
			exec:function(args){
                
                var str=args.First();
                return str.length;
            
			},
			ftype:function(){
				return this.Function_type.lib;
			}
		});
						
		function Str_charAtFun(){}
		Str_charAtFun.prototype=new Fun();
		;
		mb.Object.ember(Str_charAtFun.prototype,{
			toString:function(){
				return "str-charAt";
			},
			exec:function(args){
                
                var str=args.First();
                args=args.Rest();
                var index=args.First();  
                return str[index];
            
			},
			ftype:function(){
				return this.Function_type.lib;
			}
		});
						
		function Str_substrFun(){}
		Str_substrFun.prototype=new Fun();
		;
		mb.Object.ember(Str_substrFun.prototype,{
			toString:function(){
				return "str-substr";
			},
			exec:function(args){
                
                var a=args.First();
                args=args.Rest();
                var begin=args.First();
                args=args.Rest();
                if(args==null){
                    return a.substr(begin);
                }else{
                    return a.substr(begin,args.First());
                }
            
			},
			ftype:function(){
				return this.Function_type.lib;
			}
		});
						
		function Str_joinFun(){}
		Str_joinFun.prototype=new Fun();
		;
		mb.Object.ember(Str_joinFun.prototype,{
			toString:function(){
				return "str-join";
			},
			exec:function(args){
                
                //字符串
                var array=args.First();
                var split="";
                if(args.Rest()!=null){
                    split=args.Rest().First();
                }
                var r="";
                for(var t=array;t!=null;t=t.Rest()){
                    r=r+t.First()+split;
                }
                return r.substr(0,r.length-split.length);
            
			},
			ftype:function(){
				return this.Function_type.lib;
			}
		});
						
		function Str_splitFun(){}
		Str_splitFun.prototype=new Fun();
		;
		mb.Object.ember(Str_splitFun.prototype,{
			toString:function(){
				return "str-split";
			},
			exec:function(args){
                
                var a=args.First();
                var split="";
                args=args.Rest()
                if(args!=null){
                    split=args.First();
                }
                return a.split(split);
            
			},
			ftype:function(){
				return this.Function_type.lib;
			}
		});
						
		function Str_upperFun(){}
		Str_upperFun.prototype=new Fun();
		;
		mb.Object.ember(Str_upperFun.prototype,{
			toString:function(){
				return "str-upper";
			},
			exec:function(args){
                
                return args.First().toUpperCase();
            
			},
			ftype:function(){
				return this.Function_type.lib;
			}
		});
						
		function Str_lowerFun(){}
		Str_lowerFun.prototype=new Fun();
		;
		mb.Object.ember(Str_lowerFun.prototype,{
			toString:function(){
				return "str-lower";
			},
			exec:function(args){
                
                return args.First().toLowerCase();
            
			},
			ftype:function(){
				return this.Function_type.lib;
			}
		});
						
		function Str_trimFun(){}
		Str_trimFun.prototype=new Fun();
		;
		mb.Object.ember(Str_trimFun.prototype,{
			toString:function(){
				return "str-trim";
			},
			exec:function(args){
                
                var str=args.First();
                return str.trim();
            
			},
			ftype:function(){
				return this.Function_type.lib;
			}
		});
						
		function Str_indexOfFun(){}
		Str_indexOfFun.prototype=new Fun();
		;
		mb.Object.ember(Str_indexOfFun.prototype,{
			toString:function(){
				return "str-indexOf";
			},
			exec:function(args){
                
                var str=args.First();
                args=args.Rest();
                var v=args.First();
                return str.indexOf(v);
            
			},
			ftype:function(){
				return this.Function_type.lib;
			}
		});
						
		function Str_lastIndexOfFun(){}
		Str_lastIndexOfFun.prototype=new Fun();
		;
		mb.Object.ember(Str_lastIndexOfFun.prototype,{
			toString:function(){
				return "str-lastIndexOf";
			},
			exec:function(args){
                
                var str=args.First();
                args=args.Rest();
                var v=args.First();
                return str.lastIndexOf(v);
            
			},
			ftype:function(){
				return this.Function_type.lib;
			}
		});
						
		function Str_startsWithFun(){}
		Str_startsWithFun.prototype=new Fun();
		;
		mb.Object.ember(Str_startsWithFun.prototype,{
			toString:function(){
				return "str-startsWith";
			},
			exec:function(args){
                
                var str=args.First();
                args=args.Rest();
                var v=args.First();
                return str.startsWith(v);
            
			},
			ftype:function(){
				return this.Function_type.lib;
			}
		});
						
		function Str_endsWithFun(){}
		Str_endsWithFun.prototype=new Fun();
		;
		mb.Object.ember(Str_endsWithFun.prototype,{
			toString:function(){
				return "str-endsWith";
			},
			exec:function(args){
                
                var str=args.First();
                args=args.Rest();
                var v=args.First();
                return str.endsWith(v);
            
			},
			ftype:function(){
				return this.Function_type.lib;
			}
		});
						
		function QuoteFun(){}
		QuoteFun.prototype=new Fun();
		;
		mb.Object.ember(QuoteFun.prototype,{
			toString:function(){
				return "{(first args ) }";
			},
			exec:function(args){
                
                return args.First();
            
			},
			ftype:function(){
				return this.Function_type.user;
			}
		});
						
		function ListFun(){}
		ListFun.prototype=new Fun();
		;
		mb.Object.ember(ListFun.prototype,{
			toString:function(){
				return "{args }";
			},
			exec:function(args){
                
                return args;
            
			},
			ftype:function(){
				return this.Function_type.user;
			}
		});
						
		function Kvs_find1stFun(){}
		Kvs_find1stFun.prototype=new Fun();
		;
		mb.Object.ember(Kvs_find1stFun.prototype,{
			toString:function(){
				return "{(let (key kvs ) args find1st this ) (let (k v ...kvs ) args ) (if-run (str-eq k key ) {v } {(find1st key kvs ) } ) }";
			},
			exec:function(args){
                
                var kvs=args.First();
                args=args.Rest();
                var key=args.First();
                return lib.s.kvs_find1st(kvs,key);
            
			},
			ftype:function(){
				return this.Function_type.user;
			}
		});
						
		function Kvs_extendFun(){}
		Kvs_extendFun.prototype=new Fun();
		;
		mb.Object.ember(Kvs_extendFun.prototype,{
			toString:function(){
				return "{(let (k v kvs ) args ) (extend k (extend v kvs ) ) }";
			},
			exec:function(args){
                
                var key=args.First();
                args=args.Rest();
                var value=args.First();
                args=args.Rest();
                var kvs=args.First();
                return lib.s.kvs_extend(key,value,kvs);
            
			},
			ftype:function(){
				return this.Function_type.user;
			}
		});
						
		function IstypeFun(){}
		IstypeFun.prototype=new Fun();
		;
		mb.Object.ember(IstypeFun.prototype,{
			toString:function(){
				return "{(let (x n ) args ) (str-eq (type x ) n ) }";
			},
			exec:function(args){
                
                var x=args.First();
                args=args.Rest();
                var n=args.First();
                return (TypeFun.base_run(x)==n);
            
			},
			ftype:function(){
				return this.Function_type.user;
			}
		});
						
		function CallFun(){}
		CallFun.prototype=new Fun();
		;
		mb.Object.ember(CallFun.prototype,{
			toString:function(){
				return "call";
			},
			exec:function(args){
                
                var run=args.First();
                args=args.Rest();
                return run.exec(args);
            
			},
			ftype:function(){
				return this.Function_type.lib;
			}
		});
						
		function MNotEqFun(){}
		MNotEqFun.prototype=new Fun();
		;
		mb.Object.ember(MNotEqFun.prototype,{
			toString:function(){
				return "{(not (apply = args ) ) }";
			},
			exec:function(args){
                
                return !MEqFun.base_run(args);
            
			},
			ftype:function(){
				return this.Function_type.user;
			}
		});
						
		function Empty_funFun(){}
		Empty_funFun.prototype=new Fun();
		;
		mb.Object.ember(Empty_funFun.prototype,{
			toString:function(){
				return "{}";
			},
			exec:function(args){
                
                return null;
            
			},
			ftype:function(){
				return this.Function_type.user;
			}
		});
						
		function DefaultFun(){}
		DefaultFun.prototype=new Fun();
		;
		mb.Object.ember(DefaultFun.prototype,{
			toString:function(){
				return "{(let (a d ) args ) (if (exist? a ) a d ) }";
			},
			exec:function(args){
                
                var v=args.First();
                if(v!=null){
                    return v;
                }else{
                    args=args.Rest();
                    return args.First();
                }
            
			},
			ftype:function(){
				return this.Function_type.user;
			}
		});
						
		function LenFun(){}
		LenFun.prototype=new Fun();
		;
		mb.Object.ember(LenFun.prototype,{
			toString:function(){
				return "{(let (cs ) args ) (if-run (exist? cs ) {(length cs ) } {0 } ) }";
			},
			exec:function(args){
                
                var list=args.First();
                if(list){
                    return list.Length();
                }else{
                    return 0;
                }
            
			},
			ftype:function(){
				return this.Function_type.user;
			}
		});
						
		function If_runFun(){}
		If_runFun.prototype=new Fun();
		;
		mb.Object.ember(If_runFun.prototype,{
			toString:function(){
				return "{(let (a b c ) args ) (let x (default (if a b c ) ) ) (x ) }";
			},
			exec:function(args){
                
                var o=IfFun.base_run(args);
                if(o==null){
                    return null;
                }else{
                    return o.exec(null);
                }
            
			},
			ftype:function(){
				return this.Function_type.user;
			}
		});
						
		function LoopFun(){}
		LoopFun.prototype=new Fun();
		;
		mb.Object.ember(LoopFun.prototype,{
			toString:function(){
				return "{(let (f ...init ) args loop this ) (let (will ...init ) (apply f init ) ) (if-run will {(apply loop (extend f init ) ) } {init } ) }";
			},
			exec:function(args){
                
                var f=args.First();
                args=args.Rest();
                var will=true;
                while(will){
                    args=f.exec(args);
                    will=args.First();
                    args=args.Rest();
                }
                return args;
            
			},
			ftype:function(){
				return this.Function_type.user;
			}
		});
						
		function ReverseFun(){}
		ReverseFun.prototype=new Fun();
		
            ReverseFun.base_run=function(list){
                return lib.s.reverse(list);
            };
            ;
		mb.Object.ember(ReverseFun.prototype,{
			toString:function(){
				return "{(let (xs ) args ) (reduce xs {(let (init x ) args ) (extend x init ) } [] ) }";
			},
			exec:function(args){
                
                return ReverseFun.base_run(args.First());
            
			},
			ftype:function(){
				return this.Function_type.user;
			}
		});
						
		function Kvs_reverseFun(){}
		Kvs_reverseFun.prototype=new Fun();
		
            Kvs_reverseFun.base_run=function(kvs){
                var r=null;
                var tmp=kvs;
                while(tmp!=null){
                    var key=tmp.First();
                    tmp=tmp.Rest();
                    var value=tmp.First();
                    tmp=tmp.Rest();
                    r=lib.s.kvs_extend(key,value,r);
                }
                return r;
            };
            ;
		mb.Object.ember(Kvs_reverseFun.prototype,{
			toString:function(){
				return "{(let (kvs ) args ) (kvs-reduce kvs {(let (init v k ) args ) (kvs-extend k v init ) } [] ) }";
			},
			exec:function(args){
                
                return Kvs_reverseFun.base_run(args.First());
            
			},
			ftype:function(){
				return this.Function_type.user;
			}
		});
						
		function ReduceFun(){}
		ReduceFun.prototype=new Fun();
		
            ReduceFun.base_run=function(list,args){
                var f=args.First();
                args=args.Rest();
                var init=args.First();
                while(list!=null){
                    var x=list.First();
                    list=list.Rest();
                    var nargs=lib.s.list(init,x);
                    init=f.exec(nargs);
                }
                return init;
            }
            ;
		mb.Object.ember(ReduceFun.prototype,{
			toString:function(){
				return "{(let (xs run init ) args reduce this ) (if-run (exist? xs ) {(let (x ...xs ) xs ) (let init (run init x ) ) (reduce xs run init ) } {init } ) }";
			},
			exec:function(args){
                
                var list=args.First();
                args=args.Rest();
                return ReduceFun.base_run(list,args);
            
			},
			ftype:function(){
				return this.Function_type.user;
			}
		});
						
		function Reduce_rightFun(){}
		Reduce_rightFun.prototype=new Fun();
		;
		mb.Object.ember(Reduce_rightFun.prototype,{
			toString:function(){
				return "{(let (xs run init ) args reduce-right this ) (if-run (exist? xs ) {(let (x ...xs ) xs ) (run (reduce-right xs run init ) x ) } {init } ) }";
			},
			exec:function(args){
                
                var list=args.First();
                list=ReverseFun.base_run(list);
                args = args.Rest();
                return ReduceFun.base_run(list,args);
            
			},
			ftype:function(){
				return this.Function_type.user;
			}
		});
						
		function Kvs_reduceFun(){}
		Kvs_reduceFun.prototype=new Fun();
		
            Kvs_reduceFun.base_run=function(kvs,args){
                var f=args.First();
                args=args.Rest();
                var init=args.First();
                while(kvs!=null){
                    var key=kvs.First();
                    kvs=kvs.Rest();
                    var value=kvs.First();
                    kvs=kvs.Rest();
                    var nargs=lib.s.list(init,value,key);
                    init=f.exec(nargs);
                }
                return init;
            }
            ;
		mb.Object.ember(Kvs_reduceFun.prototype,{
			toString:function(){
				return "{(let (kvs run init ) args kvs-reduce this ) (if-run (exist? kvs ) {(let (k v ...kvs ) kvs ) (let init (run init v k ) ) (kvs-reduce kvs run init ) } {init } ) }";
			},
			exec:function(args){
                
                var kvs=args.First();
                args=args.Rest();
                return Kvs_reduceFun.base_run(kvs,args);
            
			},
			ftype:function(){
				return this.Function_type.user;
			}
		});
						
		function Kvs_reduce_rightFun(){}
		Kvs_reduce_rightFun.prototype=new Fun();
		;
		mb.Object.ember(Kvs_reduce_rightFun.prototype,{
			toString:function(){
				return "{(let (kvs run init ) args kvs-reduce-right this ) (if-run (exist? kvs ) {(let (k v ...kvs ) kvs ) (run (kvs-reduce-right kvs run init ) v k ) } {init } ) }";
			},
			exec:function(args){
                
                var kvs=args.First();
                kvs=Kvs_reverseFun.base_run(kvs);
                args=args.Rest();
                return Kvs_reduceFun.base_run(kvs,args);
            
			},
			ftype:function(){
				return this.Function_type.user;
			}
		});
						
		function Kvs_pathFun(){}
		Kvs_pathFun.prototype=new Fun();
		;
		mb.Object.ember(Kvs_pathFun.prototype,{
			toString:function(){
				return "{(let (e paths ) args kvs-path this ) (if-run (exist? paths ) {(let (path ...paths ) paths ) (kvs-path (kvs-find1st e path ) paths ) } {e } ) }";
			},
			exec:function(args){
                
                var kvs=args.First();
                args=args.Rest();
                var paths=args.First();
                return kvs_path(kvs,paths);
            
			},
			ftype:function(){
				return this.Function_type.user;
			}
		});
						
		function Kvs_path_runFun(){}
		Kvs_path_runFun.prototype=new Fun();
		;
		mb.Object.ember(Kvs_path_runFun.prototype,{
			toString:function(){
				return "{(let (e paths ...ps ) args ) (apply (kvs-path e paths ) ps ) }";
			},
			exec:function(args){
                
                var kvs=args.First();
                args=args.Rest();
                var paths=args.First();
                args=args.Rest();
                return kvs_path(kvs,paths).exec(args);
            
			},
			ftype:function(){
				return this.Function_type.user;
			}
		});
						
		function Slice_fromFun(){}
		Slice_fromFun.prototype=new Fun();
		
            Slice_fromFun.base_run=function(list,i){
                while(i!=0){
                    list=list.Rest();
                    i--;
                }
                return list;
            }
            ;
		mb.Object.ember(Slice_fromFun.prototype,{
			toString:function(){
				return "{(let (list i ) args offset this ) (if-run (= i 0 ) {list } {(offset (rest list ) (- i 1 ) ) } ) }";
			},
			exec:function(args){
                
            var list=args.First();
            args=args.Rest();
            var i=args.First();
            return Slice_fromFun.base_run(list,i);
            
			},
			ftype:function(){
				return this.Function_type.user;
			}
		});
						
		function Slice_toFun(){}
		Slice_toFun.prototype=new Fun();
		;
		mb.Object.ember(Slice_toFun.prototype,{
			toString:function(){
				return "{(let (xs to ) args slice-to this ) (if-run (= to 0 ) {[] } {(let (x ...xs ) xs ) (extend x (slice-to xs (- to 1 ) ) ) } ) }";
			},
			exec:function(args){
                
                var list=args.First();
                args=args.Rest();
                var i=args.First();
                var r=null;
                while(i!=0){
                    r=lib.s.extend(list.First(),r);
                    list=list.Rest();
                    i--;
                }
                return ReverseFun.base_run(r);
            
			},
			ftype:function(){
				return this.Function_type.user;
			}
		});
						
		function OffsetFun(){}
		OffsetFun.prototype=new Fun();
		;
		mb.Object.ember(OffsetFun.prototype,{
			toString:function(){
				return "{(first (apply slice-from args ) ) }";
			},
			exec:function(args){
                
                var list=args.First();
                args=args.Rest();
                var i=args.First();
                return Slice_fromFun.base_run(list,i).First()
            
			},
			ftype:function(){
				return this.Function_type.user;
			}
		});
						
		var m=null;
		
		m=lib.s.kvs_extend("first",new FirstFun(),m);
						
		m=lib.s.kvs_extend("rest",new RestFun(),m);
						
		m=lib.s.kvs_extend("extend",new ExtendFun(),m);
						
		m=lib.s.kvs_extend("length",new LengthFun(),m);
						
		m=lib.s.kvs_extend("empty?",new IsemptyFun(),m);
						
		m=lib.s.kvs_extend("exist?",new IsexistFun(),m);
						
		m=lib.s.kvs_extend("if",new IfFun(),m);
						
		m=lib.s.kvs_extend("eq",new EqFun(),m);
						
		m=lib.s.kvs_extend("apply",new ApplyFun(),m);
						
		m=lib.s.kvs_extend("log",new LogFun(),m);
						
		m=lib.s.kvs_extend("toString",new ToStringFun(),m);
						
		m=lib.s.kvs_extend("stringify",new StringifyFun(),m);
						
		m=lib.s.kvs_extend("type",new TypeFun(),m);
						
		m=lib.s.kvs_extend("+",new AddFun(),m);
						
		m=lib.s.kvs_extend("-",new SubFun(),m);
						
		m=lib.s.kvs_extend("*",new MultiFun(),m);
						
		m=lib.s.kvs_extend("/",new DivFun(),m);
						
		m=lib.s.kvs_extend("parseInt",new ParseIntFun(),m);
						
		m=lib.s.kvs_extend(">",new MBiggerFun(),m);
						
		m=lib.s.kvs_extend("<",new MSmallerFun(),m);
						
		m=lib.s.kvs_extend("=",new MEqFun(),m);
						
		m=lib.s.kvs_extend("and",new AndFun(),m);
						
		m=lib.s.kvs_extend("or",new OrFun(),m);
						
		m=lib.s.kvs_extend("not",new NotFun(),m);
						
		m=lib.s.kvs_extend("str-eq",new Str_eqFun(),m);
						
		m=lib.s.kvs_extend("str-length",new Str_lengthFun(),m);
						
		m=lib.s.kvs_extend("str-charAt",new Str_charAtFun(),m);
						
		m=lib.s.kvs_extend("str-substr",new Str_substrFun(),m);
						
		m=lib.s.kvs_extend("str-join",new Str_joinFun(),m);
						
		m=lib.s.kvs_extend("str-split",new Str_splitFun(),m);
						
		m=lib.s.kvs_extend("str-upper",new Str_upperFun(),m);
						
		m=lib.s.kvs_extend("str-lower",new Str_lowerFun(),m);
						
		m=lib.s.kvs_extend("str-trim",new Str_trimFun(),m);
						
		m=lib.s.kvs_extend("str-indexOf",new Str_indexOfFun(),m);
						
		m=lib.s.kvs_extend("str-lastIndexOf",new Str_lastIndexOfFun(),m);
						
		m=lib.s.kvs_extend("str-startsWith",new Str_startsWithFun(),m);
						
		m=lib.s.kvs_extend("str-endsWith",new Str_endsWithFun(),m);
						
		m=lib.s.kvs_extend("quote",new QuoteFun(),m);
						
		m=lib.s.kvs_extend("list",new ListFun(),m);
						
		m=lib.s.kvs_extend("kvs-find1st",new Kvs_find1stFun(),m);
						
		m=lib.s.kvs_extend("kvs-extend",new Kvs_extendFun(),m);
						
		m=lib.s.kvs_extend("type?",new IstypeFun(),m);
						
		m=lib.s.kvs_extend("call",new CallFun(),m);
						
		m=lib.s.kvs_extend("!=",new MNotEqFun(),m);
						
		m=lib.s.kvs_extend("empty-fun",new Empty_funFun(),m);
						
		m=lib.s.kvs_extend("default",new DefaultFun(),m);
						
		m=lib.s.kvs_extend("len",new LenFun(),m);
						
		m=lib.s.kvs_extend("if-run",new If_runFun(),m);
						
		m=lib.s.kvs_extend("loop",new LoopFun(),m);
						
		m=lib.s.kvs_extend("reverse",new ReverseFun(),m);
						
		m=lib.s.kvs_extend("kvs-reverse",new Kvs_reverseFun(),m);
						
		m=lib.s.kvs_extend("reduce",new ReduceFun(),m);
						
		m=lib.s.kvs_extend("reduce-right",new Reduce_rightFun(),m);
						
		m=lib.s.kvs_extend("kvs-reduce",new Kvs_reduceFun(),m);
						
		m=lib.s.kvs_extend("kvs-reduce-right",new Kvs_reduce_rightFun(),m);
						
		m=lib.s.kvs_extend("kvs-path",new Kvs_pathFun(),m);
						
		m=lib.s.kvs_extend("kvs-path-run",new Kvs_path_runFun(),m);
						
		m=lib.s.kvs_extend("slice-from",new Slice_fromFun(),m);
						
		m=lib.s.kvs_extend("slice-to",new Slice_toFun(),m);
						
		m=lib.s.kvs_extend("offset",new OffsetFun(),m);
						
		return m;
	}
});
								