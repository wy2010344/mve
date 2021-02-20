import { mve } from "../mve/util"

function addLink(href:string,onLoad?:()=>void){
	const link=document.createElement("link")
	link.href=href
	link.rel="stylesheet"
	link.onload=onLoad
	document.head.appendChild(link)
	return link
}
function addScript(src:string,onLoad?:()=>void){
	const script=document.createElement("script")
	script.type="text/javascript"
	script.src=src
	script.onload=onLoad
	document.head.appendChild(script)
	return script
}

function linkLoader(href:string){
	return function(notice){
		return addLink(href,notice)
	}
}
function scriptLoadr(src:string){
	return function(notice){
		return addScript(src,notice)
	}
}
const prefix="https://unpkg.com/prismjs@1.23.0/"
interface PrismLoad{
	Prism:typeof import("./Prism")
	components:{
		languages:{[key:string]:{
			owner: string
			title:string
		}}
		plugins:{[key:string]:{
			description:string
			noCSS:boolean
			owner: string
			title:string
		}}
		themes:{[key:string]:string|{
			owner?: string
			title:string
		}}
	}
	theme(key:string):void
	theme():string
	ifLoadTheme(key?:string):void
}
export=mb.ajax.require.async<PrismLoad>(function(notice){
	mb.task.all({
		data:mb.Array.toObject([
			scriptLoadr(`${prefix}components/prism-core.min.js`),
			scriptLoadr(`${prefix}plugins/autoloader/prism-autoloader.min.js`),
			scriptLoadr(`${prefix}components.js`)
		],function(v,i){return [i+"",v]}),
		success(v){
			let theme:HTMLLinkElement
			const themeValue=mve.valueOf("")
			function loadTheme(key?:string){
				if(arguments.length==0){
					return themeValue()
				}else{
					const key=arguments[0]
					themeValue(key)
					const href=`${prefix}themes/${key}.css`
					if(theme){
						theme.href=href
					}else{
						theme=addLink(href)
					}
				}
			}
			notice({
				Prism:window["Prism"],
				components:window["components"],
				theme:loadTheme,
				ifLoadTheme(key?:string){
					if(themeValue()==""){
						loadTheme(key||"prism-dark")
					}
				}
			})
		}
	})
})