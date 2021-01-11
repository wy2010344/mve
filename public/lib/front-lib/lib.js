'use strict';
window.mb=mb;
mb.log=(function(){
	if(window.console && window.console.log){
		try{
			var log=window.console.log.bind(window.console);
			log("测试支持控制台");
			return log;
		}catch(e){
			mb.isIE=true;
			return mb.Function.list.one;
		}
	}else{
		return mb.Function.list.one;
	}
})();
mb.emptyFunc=function(item){
	mb.log("请调用mb.Function.quote/as_null/list或其one属性");
	return item;
};
var emptyFunc=mb.emptyFunc;
mb.cache=function(obj) {
	return function() {
		if(arguments.length==0){
			return obj;
		}else{
			obj=arguments[0];
		}
	};
};
mb.task={
	/**
	 * 
	 * 无顺序执行完
	 * @param data
	 * @param trans{
	 * key,
	 * value,
	 * notice
	 * }如果没有trans，data中的每一个就是带回调的函数
	 * @param success
	 */
	all:function(p){
		var success=p.success||mb.Function.as_null.one;
		var data=p.data||{};
		var trans=p.trans||function(xp){
			xp.value(xp.notice);
		};
		
		var count=0;
		var tcount=0;
		for(var k in data){
			count++;
		}
		
		var ret={};
		if(count==0){
			//空
			success(ret);
		}else{
			//有
			var notice=function(){
				tcount++;
				if(tcount==count){
					success(ret);
				}
			};
			mb.Object.forEach(data, function(v,k){
				trans({
					value:v,
					key:k,
					notice:function(back){
						ret[k]=back;
						notice();
					}
				});
			});
		}
	},
	/***
	 * 有顺序执行完
	 * @param array
	 * @param trans{
	 * row
	 * index
	 * notice
	 * }
	 * @param success
	 */
	queue:function(p){
		var array=p.array||[];
		var success=p.success||mb.Function.as_null.one;
		var trans=p.trans||function(xp){
			xp.row(xp.notice);
		};
		var ret=[];
		var cache=[];
		mb.Array.forEach(array, function(row){
			cache.push(row);
		});
		var idx=0;
		var load=function(){
			//这种方法总是可行的
			if(cache.length!=0){
				trans({
					row:cache.shift(),
					index:idx,
					notice:function(val){
						ret.push(val);
						idx++;
						load();
					}
				});
			}else{
				//mb.log(array.length,idx,"成功");//竟然有1、0成功的
				success(ret);
			}
			//为什么总是不行！
			/*
			if(idx<array.length){
				var row=array[idx];
				row(function(val){
				   ret.push(val);
				   load();
				});
				idx=idx+1;
				mb.log("增加了",idx,row,"xx")
			}else{
				success(ret);
			}
			*/
		};
		load();
	}
};
mb.ajax=(function(){
	var getXHR=(function(){
		if(window.XMLHttpRequest){
			return function(){
				return new XMLHttpRequest();
			};
		}else{
			return function(){
				return new ActiveXObject('Microsoft.XMLHTTP');
			};
		}
	})();

	/*
	type 选填，默认GET
	operate(xhr)
	data 选填
	success 必填

	*/
	var baseAjax=function(p,type){
		var xhr=getXHR();
		xhr.onreadystatechange=function(){
			if (xhr.readyState==4 && xhr.status==200)
			{
				p.success(xhr);
			}
		};
		xhr.open(type,encodeURI(p.url),true);
		xhr.setRequestHeader("x-requested-with","XMLHttpRequest");//区别为ajax
		if(p.operate){
			p.operate(xhr);
		}
		return xhr;
	};
	var normalGET=function(p) {
		if(p.data){
			var query=mb.util.urlFromDic(p.data);
			if(p.url.indexOf("?")>0){
				p.url=p.url+"&"+query;
			}else{
				p.url=p.url+"?"+query;
			}
		}
		var xhr=baseAjax(p,"GET");
		xhr.send();//不能sendData
	};

	var common_getData=function(xhr,p){  
		var data=p.data;    
		if(!p.dataType){
			var dataType="application/x-www-form-urlencoded;charset=UTF-8";//一定要charset否则乱码，最后一定不能加分号，会出问题！
			data=mb.util.urlFromDic(p.data);
			xhr.setRequestHeader("Content-Type",dataType);
		}
		if(p.dataType=="json"){
			var dataType="application/json";
			data=JSON.stringify(p.data);
			xhr.setRequestHeader("Content-Type",dataType);
		}else
		if(p.dataType=="formdata"){
			data=new FormData();
			if(mb.Array.isArray(p.data)){
				mb.Array.forEach(p.data,function(row){
					data.append(row.key,row.value);
				});
			}else{
				mb.Object.forEach(p.data,function(value,key){
					data.append(key,value);
				});
			}
    }else
    if(p.dataType=="text"){
      data=p.data
			xhr.setRequestHeader("Content-Type","text/plain");
    }
		return data;
	};
	var getData=common_getData;
	if(window.FormData){
		getData=function(xhr,p){
			if(p.data instanceof window.FormData){
				return p.data;
			}else{
				return common_getData(xhr,p);
			}
		};
	}
	var normalPOST=function(p) {
		var xhr=baseAjax(p,"POST");
		var data;
		if(p.data){
			data=getData(xhr,p);
		}
		xhr.send(data);
	};
	var me={
		text:function(p) {
			var success=p.success||mb.Function.as_null.one;
			p.success=function(xhr) {
				success(xhr.responseText);
			};
			normalGET(p);
		},
		get:normalGET,
		//请求格式化是contentType,返回格式化是dataType
		post:normalPOST,
		util:{
			cros:function(xhr) {
				xhr.withCredentials=true;
			},
			parseJSON:function(txt){
				/**
				 * 如今全局条件引入json，则无此问题
				 * 可能被脚本注入攻击，但如果后端用框架生成的JSON而非字符串拼凑，则没问题。
				 */
				/*
				var a=null;
				eval('a='+txt);
				return a;
				*/
				return JSON.parse(txt);
			}
		},
		/**
		 * @data{key,url},
		 * @success dic/function
		 */
		require:(function(){
			/**
			 * 
			 * @param {any} body
			 * @param {any} url 仅用于报错
			 */
			var get_success=function(body,url){
				var success;
				if(typeof(body.success)=='function'){
					success=function(){
						try{
							return body.success.apply(body.success,arguments);
						}catch(ex){
							mb.ajax.require.dealEX(url,"运行时",ex);
						}
					};
					if(body.delay){
						/*必须是同步的*/
						success=success();
					}
				}else{
					/*非函数*/
					success=body.success;
				}
				return success;
			};
			/**
			 * 兼容TypeScript生成的AMD模块
			 * @param {any} keys
			 * @param {any} fun
			 */
			var define = function (libs, run) {
				return {
					type: "amd",
					libs:libs,
					run:run
				};
			};
			/**
			 * AMD加载多个模块
			 * @param {any} baseUrl
			 */
			var amdRequire = function (pathOf,exports) {
				var require=function (urls, notice) {
					mb.task.queue({
						array: urls,
						trans: function (o) {
							var url = o.row;
							//如果需要导出require
							if(url=="require"){
								return o.notice(require);
							}
							//如果需要导出exports
							if(url=="exports"){
								return o.notice(exports);
							}
							if(url[0]!='.' && url[0]!='/'){
								var ug=mb.ajax.require.cp.alias[url];
								if(ug){
									mb.log(ug,pathOf(ug));
									return loader(pathOf(ug),o.notice);
								}
							}
							//其它情况
							if(!url.endsWith(".js")){
								url=url+".js";
							}
							loader(pathOf(url),o.notice);
						},
						success: function (o) {
							notice.apply(null, o);
						}
					});
				};
				return require;
			};
			/**
			 * 成功后通知
			 * @param {any} value
			 */
			var loadedNotice = function (value){
				const waits=value.waits;
				value.waits=undefined;
				mb.Array.forEach(waits, function (wait) {
					wait(value.success);
				});
			};

			var generateNotice=function(value){
				var notice_count=0;
				return function(success){
					if(notice_count==0){
						notice_count++;
						value.success=success;
						loadedNotice(value);
					}else{
						mb.log("出错，禁止通知两次:"+url,success);
					}
				};
			};
			/**
			 * 绝对路径
			 * 如果在远程服务器，服务器内部的模块的相对路径能正常加载，绝对路径不能正常加载，因为绝对路径定位到本地
			 * @param {any} url
			 * @param {any} success
			 */
			var loader=function(url,success){
				var value=require_getUrl(url);
				if (value) {
					if (value.waits) {
						value.waits.push(success);
					} else {
						success(value.success);
					}
				} else {
					value = {
						waits: [success]
					};
					/*计算success*/
					require_saveUrl(url, value);
					mb.ajax.require.getTxt(url,function(txt){
						/**
						 * 从once中获得数据
						 */
						var cp=mb.ajax.require.cp;//全局共享
						try {
							txt="//"+url+"\r\n"+txt;
							var body = eval(txt);
						}catch(ex){
							mb.ajax.require.dealEX(url,"Eval时",ex);
						}
						if (body) {
							/**
							 *
								计算相对路径，
								或自身路径，
								全局通用，
								根路径转成baseUrl()+路径
							 * @param {any} x
							 */
							var pathOf = function (x) {
								if (x) {
									return mb.ajax.require.calUrl(url, x);
								} else {
									return url;
								}
							};
							if (body.type=="amd") {
								//AMD加载模式
								var exports={};
								var require = amdRequire(pathOf,exports);
								require(body.libs||[], function () {
									var success = body.run.apply(null, arguments);
									if(body.async){
										success(generateNotice(value));
									}else{
										//不是异步，直接取返回值
										if (success) {
											body.success = success;
										}else{
											body.success = exports;
										}
										if(body.success.async && body.success.success){
											//内部的异步
											body.success.success(generateNotice(value));
										}else{
											//原始的方式
											value.success = body.success;
											loadedNotice(value);
										}
									}
								});
							} else {
								//原加载方式
								/**
								 * 内部的模块加载，与data部分一致
								 * @param {any} v
								 * @param {any} notice
								 */
								var require = function (v, notice) {
									loader(pathOf(v), notice);
								};
								/**
								 * 注入lib
								 */
								var lib = {};
								/*结束*/
								//不再使用once，而是通过data中使用的all将异步库转成标准的require库
								/*模块加载*/
								mb.task.all({
									data:body.data,
									trans:function(o){
										var tp=typeof(o.value);
										var load_success=function(value){
											lib[o.key]=value;
											o.notice();
										};
										if(tp=='string'){
											require(o.value,load_success);
										}else
										if(tp=='function'){
											//未作缓存加载
											o.value(load_success);
										}else{
											mb.log("暂时不支持的require类型",o.value);
										}
									},
									success:function () {
										var success = get_success(body, url);
										if(body.async){
											success(generateNotice(value));
										}else{
											//不是异步，取返回值
											value.success = success;
											loadedNotice(value);
										}
									}
								});
							}
						} else {
							loadedNotice(value);
						}
					});
				}
			};
			
			(function(){
				//缓存文件
				var willDef=false;
				if(window.top!=window){
					try{
						if(window.top.mb){
							loader._getTxt=window.top.mb.ajax.require._getTxt;
							loader._saveTxt=window.top.mb.ajax.require._saveTxt;
						}else{
							willDef=true;
						}
					}catch(e){
						willDef=true;
					}
				}else{
					willDef=true;
				}
				if(willDef){
					loader._required_txt=window._required_txt||{};
					loader._saveTxt=function(k,v){
						if(v){
							loader._required_txt[k]=v;
						}else{
							loader._required_txt[k]=undefined;
						}
					};
					loader._getTxt=function(k){
						return loader._required_txt[k];
					};
				}
			})();
			/*从远端请求文件，如果是嵌入webView，可能重写*/
			var ajaxText=function(url,success){
				mb.ajax.text({
					url:url+"?_id="+mb.ajax.require.cp.version,
					success:success
				});
			};
			/**
			 * 兼容ts的异步模块
			 */
			loader.async=function(fun){
				return {
					async:true,
					success:fun
				};
			};
			/**
			 * 本地缓存，所有地方可用
			 */
			loader.getTxt=function(url,suc){
				var txt=loader._getTxt(url);
				if(txt){ //存在而且版本号相同
					suc(txt);
				}else{
					ajaxText(url,function(txt){
						loader._saveTxt(url,txt);
						suc(txt);
					});
				}
			};
			//不同iframe缓存js函数
			var _required={};
			loader._required=_required;
			var require_saveUrl=function(k,v){
				_required[k]=v;
			};
			var require_getUrl=function(k){
				return _required[k];
			};
			loader.calUrl=function(current_url,url){
				if(url[0]=='.'){
					url=mb.util.calAbsolutePath(current_url,url);
				}else{
					//baseUrl的本质是，定位html页面与js仓库的相对路径。多html页面，不一定在同一个地方
					url=mb.ajax.require.cp.baseUrl()+url;
					if(url.startsWith("./")){
						url=url.slice(2);
					}
				}
				return url;
			};
			/*错误处理*/
			loader.dealEX=function(url,step,ex) {
				mb.log(url);
				mb.log(step);
				mb.log(JSON.stringify(ex));
				throw ex;
			};
			/**清理指定路径 */
			loader.clear=function(path){
				loader._saveTxt(path,null)
				loader._required[path]=undefined;
			}
			return loader;
		})()
	};
	return me;
})();
mb.util={
  decodeURI:function(search){
		var dsearch;
		while(search!=dsearch){
			dsearch=search;
			search=decodeURI(search);
		}
		return search;
  },
	dicFromUrl:function(uri){
		var url = decodeURI(uri); //获取url中"?"符后的字串
		var theRequest = new Object();
		if (url.indexOf("?") != -1) {
			var str = url.substr(1);
			var strs = str.split("&");
			for(var i = 0; i < strs.length; i ++) {
				theRequest[strs[i].split("=")[0]]=unescape(strs[i].split("=")[1]);
			}
		}
		return theRequest; 
	},    
	/***
	 * 字典转请求参数
	 * @param dic
	 * @param prefix 如"xmlRequest."
	 * @returns {String} 只是a=x&b=x...这样的部分请求语句
	 */
	urlFromDic:function(dic,prefix){
		var xk=[];
		if(prefix==null)
		{
			for(var k in dic)
			{
				xk.push(encodeURI(k)+"="+encodeURI(dic[k]));
			}
		}else
		{
			for(var k in dic){
				xk.push(encodeURI(prefix+k)+"="+encodeURI(dic[k]));
			}
		}
		return xk.join("&");
	},
	/**
	 * 计算绝对路径
	 */
	calAbsolutePath:function(base_url,url){
		if(url[0]=="."){
			var idx=base_url.lastIndexOf('/');
			var base="";
			if(idx<0){
				base=url;
			}else{
				base=base_url.substr(0,idx)+'/'+url;
			}
			var nodes=base.split('/');
			var rets=[];
			var last=null;
			for(var i=0;i<nodes.length;i++){
				var node=nodes[i];
				if(node=='..'){
					if(last=='..'){
						rets.push(node);
					}else
					if(last==null){
						rets.push(node);
						last=node;
					}else{
						rets.pop();
						last=rets[rets.length-1];
					}
				}else
				if(node=='.'){
					//忽略
				}else{
					rets.push(node);
					last=node;
				}
			}
			return rets.join('/');
		}else{
			return url;
		}
	}
};
mb.browser=(function(){
	//http://www.jb51.net/article/50464.htm
	var myBrowser=function(){
		var ret={};
		
		var userAgent = navigator.userAgent; //取得浏览器的userAgent字符串
		var isOpera = userAgent.indexOf("Opera") > -1; //判断是否Opera浏览器
		var isIE = userAgent.indexOf("compatible") > -1 && userAgent.indexOf("MSIE") > -1 && !isOpera; //判断是否IE浏览器
		var isFF = userAgent.indexOf("Firefox") > -1; //判断是否Firefox浏览器
		var isSafari = userAgent.indexOf("Safari") > -1; //判断是否Safari浏览器
		if (isIE) {
			mb.isIE=true;
			var reIE = new RegExp("MSIE (\\d+\\.\\d+);");
			reIE.test(userAgent);
			ret.type="IE";
			ret.version=parseFloat(RegExp["$1"]);
			ret.documentMode=document.documentMode;//IE的文档模式
		}
		if (isFF) {
			ret.type="FF";
		}
		if (isOpera) {
			ret.type=="Opera";
		}
		if (isSafari){
			ret.type=="Safari";
		}
		return ret;
	};
	var ret=myBrowser();
	mb.log(ret,navigator.userAgent);
	return ret;
})();
mb.DOM=(function(){
	var isTouch= ("ontouchend" in document)? true : false;
	var transDic={};
	if(isTouch){
		transDic={
			//click:"touchstart",
			mousedown:"touchstart",
			mousemove:"touchmove",
			mouseup:"touchend"
		};
	}
	return {
		cls:function(el){
			var clss=[];
			var update=function(){
				el.setAttribute("class",clss.join(" "));
			};
			var indexOf=function(cls){
				return mb.Array.indexOf(clss,cls);
			};
			return {
				add:function(cls){
					if(indexOf(cls)==-1){
						clss.push(cls);
						update();
					}
				},
				remove:function(cls){
					var index=indexOf(cls);
					if(index!=-1){
						clss.splice(index,1);
						update();
					}
				}
			};
		},
		empty:function(el){
			while(el.firstChild){
				el.removeChild(el.firstChild);
			};
		},
		addEvent:(function(){
			if(window.addEventListener){
				return function(e,t,f,o){
					t=transDic[t]||t;
					e.addEventListener(t,f,o);
				};
			}else
			if(window.attachEvent){
				return function(e,t,f,o){
					e.attachEvent("on"+t,f,o);
				};
			}else{
				alert("不支持");
			}
		})(),
		removeEvent:(function(){
			if(window.removeEventListener){
				return function(e,t,f,o){
					t=transDic[t]||t;
					e.removeEventListener(t,f,o);
				};
			}else
			if(window.detachEvent){
				return function(e,t,f,o){
					e.detachEvent("on"+t,f,o);
				};
			}else{
				alert("不支持");
			}
		})(),
		preventDefault:function(e){
			if(!e){
				e=window.event;
			}
			if(e.preventDefault){
				e.preventDefault();
			}else{
				e.returnValue=false;
			}
		},
		stopPropagation:function(e){
		   if(e.stopPropagation){
			   e.stopPropagation();
		   }else{
			   e.cancelBubble=true;
		   }
		},
		eventPoint:(function(){
			if(isTouch){
				return function(e){
					return {
						x:e.targetTouches[0].pageX,
						y:e.targetTouches[0].pageY
					};
				};
			}else{
				return function(e){
					return {
						x:e.clientX,
						y:e.clientY
					};
				};
			}
		})(),
		//滚动条宽度
		//https://www.cnblogs.com/liumangdashi/p/8036103.html
		scrollWidth:(function(){
			var cache;
			return function(){
				if(!cache){
					var el=document.createElement("div");
					el.style.width="100px";
					el.style.height="100px";
					el.style.overflow="scroll";
					document.body.appendChild(el);
					cache=el.offsetWidth-el.clientWidth;//ie下clientWidth始终是0，但width设置小一点，能看到原本的17
					document.body.removeChild(el);
				}
				return cache;
			};
		})(),
		//div允许tab,需要contenteditable
		divTabAllow:function(e){
			if (e.keyCode === 9) { // tab key
				e.preventDefault();  // this will prevent us from tabbing out of the editor
				
				// now insert four non-breaking spaces for the tab key
				var editor = e.target;
				var doc = editor.ownerDocument.defaultView;
				var sel = doc.getSelection();
				var range = sel.getRangeAt(0);
				
				var tabNode = document.createTextNode("\u00a0\u00a0\u00a0\u00a0");
				range.insertNode(tabNode);
				
				range.setStartAfter(tabNode);
				range.setEndAfter(tabNode);
				sel.removeAllRanges();
				sel.addRange(range);
			}
		},
		//inpu允许tab
		inputTabAllow:function(e,tabReplace){
			if (e.keyCode === 9){
				tabReplace=tabReplace||'\t';
				var tabSize=tabReplace?tabReplace.length:1;
				mb.DOM.preventDefault(e);
				//参考https://segmentfault.com/q/1010000000694609
				var el=e.target;
				var start = el.selectionStart,
					end = el.selectionEnd, 
					value = el.value;
				var lineStart = value.lastIndexOf('\n', start),
					lineEnd = value.indexOf('\n', end),
					offset = 0;

				if (lineStart === -1) lineStart = 0;
				if (lineEnd === -1) lineEnd = value.length;

				if (lineStart === lineEnd);
				else if (lineStart !== 0) lineStart += 1;

				var lines = value.substring(lineStart, lineEnd).split('\n');
				if (lines.length > 1) {
					//多行
					var firstPart=value.substring(0, lineStart);
					var lastPart=value.substring(lineEnd);
					if(e.shiftKey){
						if(lines[0].startsWith(tabReplace)){
							start=start-1*tabSize;
						}

						offset=0;
						lines=mb.Array.map(lines,function(line){
							if(line.startsWith(tabReplace)){
								offset+=tabReplace.length;
								return line.substr(tabReplace.length);
							}else{
								return line;
							}
						})
						el.value=firstPart + lines.join('\n')+ lastPart;


						el.selectionStart=start;
						el.selectionEnd=end - offset;
					}else{

						el.value = firstPart + tabReplace + lines.join('\n'+tabReplace) + lastPart;

						el.selectionStart = start + 1*tabSize;
						offset = lines.length*tabSize;
						el.selectionEnd = end + offset;
					}
				} else {
					//单
					offset = 1*tabSize;
					
					var firstPart=value.substring(0, start);
					var lastPart=value.substring(end);
					if(e.shiftKey){
						if(firstPart.endsWith(tabReplace)){
							el.value=firstPart.substr(0,firstPart.length-tabReplace.length)+lastPart;
							el.selectionStart = el.selectionEnd = start - offset;
						}
					}else{
						lines = lines[0];
						el.value = firstPart + tabReplace + lastPart
						el.selectionStart = el.selectionEnd = start + offset;
					}
				}
			}
		},
		//是否是手机
		isMobile:(function(){
			var _is_=window.screen.availWidth<800;
			return function(){
				return _is_;
			}
		})(),
		copyElement:function(div){
			var selection = window.getSelection();
			var range = document.createRange();
			range.selectNodeContents(div);
			selection.removeAllRanges();
			selection.addRange(range);
			document.execCommand('Copy');
		}
	};
})();
if(!window.Promise){
	window.Promise=mb._promise_()
}
if(window.load_success){
	window.load_success("front-lib/lib.js");
}