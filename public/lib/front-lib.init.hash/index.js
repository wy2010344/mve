(function(){
	function getHash(v,d){
		var search="";
		if(d){
			search=mb.util.urlFromDic(d);
			if(v.indexOf("?")<0){
				search="?"+search;
			}
		}				
		/*
			需要从上一个页面向下一个传递很复杂的参数，
			但是历史回退的时候却找不到！！！！
			只有依赖后端吗？？？可以在前端模块、本地缓存模拟状态变更，或者把状态同步到服务器。
		*/
		return mb.util.calAbsolutePath(window.location.hash,v)+search;
	}
	var cp={
		version:Date.now(),
		baseUrl:".",
		query:{},
		act:"",
		page:null,
		go:function(v,d){
			window.location.hash=getHash(v,d)
		},
		back:function(i){
			history.go(i)
		},
		replace:function(v,d){
			var url=window.location.origin+window.location.pathname;
			var hash=getHash(v,d);
			window.location.replace(url+hash);
		}
	};
	mb.ajax.require.cp=cp;
	function destroyPage(){
		if(cp.page && cp.page.destroy){
			cp.page.destroy();
			document.body.removeChild(cp.page.element);
		}
	}
	function loadPage(){
		var hash=window.location.hash;
		cp.query={};
		if(hash.startsWith("#")){
			var hs=mb.util.decodeURI(hash).slice(1).split("?");
			cp.act=hs[0];
			if(hs[1]){
				cp.query=mb.util.dicFromUrl(hs[1])
			}
		}else{
			cp.act="index"
		}
		mb.ajax.require(cp.baseUrl+"/index/"+cp.act+".js",function(notice){
			//旧页面销毁
			destroyPage();
			cp.page=notice();
			//追加新页面
			document.body.appendChild(cp.page.element)
			if(cp.page.init){
				cp.page.init()
			}
		});
	}
	mb.DOM.addEvent(window,"hashchange",loadPage);
	mb.DOM.addEvent(window,"unload",destroyPage);
	loadPage();
})()