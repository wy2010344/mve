# mve

mve的核心是vue的单线程依赖统计，使用纯javascript(目前已经全用TypeScript重写，并未开启严格类型，只渐进性地使用TypeScript)。

特点：无组件。不显式定义组件，纯js函数与数据结构构成。DOM片段是自组装的嵌套Object树。不增加js/ts本身的概念。（这是数次自迭代的研究结果）。

mve或vue的mvvm特点，尽可能做到了DOM树的复用。且内部操作DOM属性的根本方法，会比较所赋值与原始值，若相同则不会触发对DOM的操作。

核心代码：

public\lib\mve	mve的内核核心

public\lib\mve-DOM	mve在DOM上的实现

public\lib\share-util 自己积累的一些js基础方法。基础依赖1

public\lib\front-lib 自己实现的一些与浏览器相关的js基础方法。基础依赖2

本来是自己定义的一种模块方法。但可以拷贝到相应的目录下实现工作。我的目录方式一般是
```
index.html
lib\
	mve
	mve-DOM
	share-util
	front-lib
index\
	....
```

index.html依赖了share-util\share.js和front-lib\lib.js
定义了函数
```js
window.load_success=function(){
	var cp={
		version:new Date(),
		baseUrl:".",
		query:mb.util.dicFromUrl(window.location.search)
	}
	if(!cp.query.act){
		cp.query.act="index"
	}
	mb.ajax.require.cp=cp;
	mb.ajax.require(cp.baseUrl()+"/index/"+cp.query.act+".js",function(notice){
		var body=document.body
		var mve=notice.mve
		body.appendChild(mve.element)
		if(mve.init){
			mve.init()
		}
		if(mve.destroy){
			mb.DOM.addEvent(window,"unload",mve.destroy)
		}
		if(notice.resize){
			var outResize=notice.resize
			function resize(){
				var w=body.clientWidth
				var h=body.clientHeight
				outResize({width:w,height:h})
			}
			mb.DOM.addEvent(window,"resize",resize)
			resize()
		}
	});
}
```
因为使用的typescript是生成的AMD模块，而加载AMD是自己用ajax实现的一套系统，所以有一定的预处理。AMD的优点：项目超大时不需要再考虑分割代码，虽然首屏可能加载很多，但可以通过一定处理将首屏的代码打包只加载一次。缺点：加密？全局的window.load_success，是在mb.js加载完成后才执行。mb.js依赖share.js。

这里使用查询参数中的act动态定位一个页面。实际使用中可以根据情况调整。暴露到页面的生命周期可能有init\destroy，element即是渲染而成的元素。这里还使用了一个resize，从全局获得浏览器尺寸。这个根本对外暴露的节点是通过parseHTML.mve函数生成的，parseHTML.mve的唯一入参函数就是自定义代码的内容。可以根据实际需要局部使用mve。

parseHTML.mve的类型是
```ts 
(fun:(me:mve.LifeModel)=>JO):EOParseResult<EO>
```
其中JO代码自定义的DOM片段，EO代表生成的HTML元素。

mve.LifeModel是将类似于mve中的watch，cache作为函数暴露出来。

在public\lib\mve-DOM\index.ts里定义了mve使用的DOM元素模型，NJO=PNJO|string。其中PNJO的类型为
```ts
export type StringValue=mve.MTValue<string>
export type ItemValue=mve.MTValue<string|number|boolean>
export type AttrMap={[key:string]:ItemValue}
export type PropMap={ [key: string]:mve.MTValue<string|number|boolean>}
export type StyleMap={[key:string]:mve.MTValue<string>}
export interface PNJO{
	type:string
	init?(v):void
	destroy?(v):void
	id?:(o:any)=>void
	cls?:StringValue
	text?: ItemValue
	attr?: AttrMap
	style?: StyleMap
	prop?:PropMap
	action?: ActionMap
	children?:JOChildren<NJO,Node>
	value?: ItemValue
}
```
总之，可变属性，就是属性节点可以是一个值，可以是一个函数。具体详见代码，并不多。

从实例入手了解mve：


---
#旧介绍

以vue单线程依赖统计为核心的一个类vue框架，更准确说是函数，用纯javascript实现而无xml/css依赖，基于自己做的简单的mb.ajax.require，附带简单的JavaScript上S-Lisp实现及简单的mve的S-Lisp版本


因为单线程依赖统计最初是在vue里的，当时接触佩服得不得了，在网上反复研究总算勉强明白了，但不满于vue是框架，必须得按它的方式写，即最好写成.vue文件，虽然后续放开template可以是字符串。它这样做是为了兼容传统方式，但对于使用纯语言编程的我不太灵活，而且mvvm的方式也不太灵活。一来二去，我总结了自己的vue核心使用方式，自己的私有项目目前使用起来似乎没多大问题，但我仍然不能够保证严谨，我没有足够精力去做这事，个人的智慧也很有限，所以开源出来，私心当然是希望大家能帮助改进，当然也觉得能帮到大家，特别是当下前端流行的方式，我觉得不太好，如果能使自己的方式流行，一方面应该使前端编程的效率提高，更统一规范，另一方面相信这种自己的习惯也会得到良好的生态支持。

取名mve，是觉得毕竟非完全原创，最好带有vue中的字眼，当时脑子里就出现这个词（感觉挺不起眼也不大气的样子），但似乎也挺有意味。因为它的parse部分出自我前一个总结函数，那个函数(字典)叫jsdom，感觉很好，但后来发现这个词被别的框架占用了，我得找一个未被使用过的词。暂时就叫mve好了。

它是一个函数，接收一个函数作参数，这个回调的函数的参数比较特殊，举例
```js

mve(function(me){
	var a=me.Value(9);
	var c=me.Value([1,2,3])
	return {
		element:{
			type:"div",
			children:[
				{
					type:"button",
					text:function(){
						return a()+98;
					},
					action:{
						click:function(){
							a(a()+1);
							c().push(89);
							c(c());
						}
					}
				},
				{
					type:"ul",
					children:{
						array:function(){
							return c();
						},
						repeat:function(o){
							return {
								type:"li",
								text:function(){
									return o.data()
								}
							}
						}
					}
				}
			]
		}
	}
});

/*
其中，me.Value函数返回类似vue中的model，你可以声明无数可model，但跟vue的model不同，它是原子的，不嵌套。
me.Value返回一个函数，无参时返回缓存值，有参时更新缓存值。
这种方式可以兼容到IE8以下

数组被当成原子节点。
一直纠结于数组的更新，后来发现把数组也当值结点好了。

me中还有Cache，类似于Vue的Computed，Cache接受一个函数作参数（目前都少用，没具体测过）。
*/
```

事件周期，return 里 init函数和destroy函数，内部实现它花费比较麻烦，当初只是因为组件未贴到DOM时是，scrollTop等属性是0。这部分也不知道严谨不严谨(其实并不多用)。

me里有k字典，元素如果有id，会被绑定到k，像传统手动修改DOM元素。

元素有attr字典\style字典\action字典，会按传统的DOM操作绑定到元素上。如果attr\style中键对应的值是函数，则其就是vue中的属性。这样的写法，只是内部实现比较简单。当然，id会被绑定到k上。
> 在未接触vue之前，一直用这种DSL来写组件，避免jQuery等拼凑HTML造成的注入危险。但回写DOM很麻烦，后来出现了vue。将属性值变成函数就能享有动态变化，但vue这种更新方式似乎一直没有严格的数学证明，这也是有些人会排斥它的原因，虽然感觉不会有问题，而且一些简单示例确实符合预期。如果未来有问题，可得难免只有每次统一更新，像react一样，而不是依赖统计精确更新。

children的repeat，没什么说的，内部实现没想到特别优雅的方式。

mve返回一个字典，有getElement函数，init函数和destroy函数等。通过getElement函数附着到旧元素上。

组件化，只是简单的高阶化，type键下不再是字符串，而是一个函数，另一个键是params，即这个函数接受的字典参数，函数内调用mve并返回其结果。

节点还可以是字符串，则简单地createTextNode。

节点还可以是函数，则动态附着这个函数计算的元素。

```js
mve(function(me){
	return {
		element:{
			type:"div",
			children:[
				function(){
					return {
						type:"div"
					};
				},
				"abcdefe"
			]
		}
	}
});

```

js的函数化语法使这种类似的DSL成为可能，但js还是比较复杂，易出错，所以我总结了S-Lisp语法方案，逐渐发现S-Lisp拥有强大其它方面的潜力，这是后话了。

也简单实现了一个S-Lisp版的mve（感觉比较卡、慢），~~目前其children的repeat还没做好~~。

## 使用方法

node ./index.js

然后打开网页http://localhost:3000/index.html