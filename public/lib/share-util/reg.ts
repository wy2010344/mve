import { emptyDelayStream, List, Pair, Stream, streamAppendStream } from "./kanren"

class Char{
	readonly code:number
	private char:string
	constructor(c:string){
		this.code=c.charCodeAt(0)
		this.char=c.charAt(0)
	}
	toString(){
		return this.char
	}
}

type RegRule=RuleMatch | AndRule | OrRule | RepeatRule
type RuleMatch=(str:string,i:number)=>boolean
/**
 * 和prolog有一定的联系
 * 只有prolog的匹配才是完美的
 * 这个只是限定长度
 * 主要是引入了不定长度的问题。如果长度是确定的。通常正则匹配确定的长度，就不会出现贪婪的问题
 * 不定长度，即使0-1次，也可能出现问题。选择了0次或1次对后面的匹配都是不确定的。
 * 
 * 
 * 一种是将字符串划成字符的列表，再用kanren/prolog。
 * 另一种是底层字符串、列表使用共享的字符串列表，在slice等，将内部位置调整，所以不用重新分配（但不是列表）
 * 否则得在kanren里支持数字的加减法，才能实现移位。
 * 匹配成功的后继？
 * 
 * 当然有贪婪匹配和不贪婪匹配
 */
interface RepeatRule{
	type:"repeat"
	rule:RegRule
	min:number
	max:number
}
interface OrRule{
	type:"or"
	rules:RegRule[]
}

interface AndRule{
	type:"and"
	rules:RegRule[]
}
export const match={
	andRule(...rules:RegRule[]):AndRule{
		return {
			type:"and",
			rules
		}
	},
	orRule(...rules:RegRule[]):OrRule{
		return {
			type:"or",
			rules
		}
	},
	repeatRule(rule:RegRule,min=0,max=Infinity):RepeatRule{
		return {
			type:"repeat",
			rule,
			min,
			max
		}
	},
	eq(v:string):RuleMatch{
		v=v.charAt(0)
		return function(str,i){
			return str[i]==v
		}
	}, 
	between(a:string,b:string):RuleMatch{
		const an=a.charCodeAt(0)
		const bn=b.charCodeAt(0)
		return function(str,i){
			const v=str.charCodeAt(i)
			return an<=v && v<=bn
		}
	},
	in(...vs:string[]):RuleMatch{
		vs=vs.map(v=>v.charAt(0))
		return function(str,i){
			return vs.indexOf(str[i])>-1
		}
	}
}
export function test(str:string,i:number,rule:RegRule){
	if(typeof(rule)=='function'){
		return rule(str,i)
	}else{
		if(rule.type=="and"){
			for(let x=0;x<rule.rules.length;i++){
				if(test(str,i,rule.rules[i])){
					i++
				}else{
					return false
				}
			}
			return true
		}else
		if(rule.type=="or"){
			for(let x=0;x<rule.rules.length;i++){
				if(test(str,i,rule.rules[i])){
					return true
				}
			}
			return false
		}else{
			let count=0
			while(true){
				if(test(str,i,rule.rule)){
					count++
					i++
				}else{
					break
				}
			}
			return rule.min <= count && count <=rule.max
		}
	}
}

/////////////////////////////////////////////////////////////////


export class ShareString{
	public readonly length:number
	private constructor(
		private str:string,
		private begin:number,
		private end:number
	){
		this.length=end-begin
	}
	static of(str:string,begin=0,end=str.length){
		return new ShareString(str,begin,end)
	}
	toString(){
		return this.str.slice(this.begin,this.end)
	}
	charAt(i:number){
		return this.str.charAt(i+this.begin)
	}
	charCodeAt(i:number){
		return this.str.charCodeAt(i+this.begin)
	}
	slice(begin=0,end=this.length){
		return ShareString.of(this.str,this.begin+begin,this.end+end)
	}
	indexOfStr(str:string,i=0){
		const index=this.str.indexOf(str,this.begin + i)
		if(index < 0 || index > (this.end - str.length)){
			return -1
		}else{
			return index - this.begin
		}
	}
	indexOf(str:ShareString,i=0){
		return this.indexOfStr(str.toString(),i)
	}
	startsWithStr(str:string){
		return this.indexOfStr(str)==0
	}
	startsWith(str:ShareString){
		return this.startsWithStr(str.toString())
	}
	endsWith(str:ShareString){
		return this.endsWithStr(str.toString())
	}
	endsWithStr(str:string){
		const idx=this.length-str.length
		return this.indexOfStr(str,idx)==idx
	}

	unshiftStr(str:string){
		const idx=this.begin-str.length
		if(this.str.indexOf(str,idx)==idx){
			return ShareString.of(this.str,idx,this.end)
		}
	}	
	
	pushStr(str:string){
		if(this.str.indexOf(str,this.end)==this.end){
			return ShareString.of(this.str,this.begin,this.end+str.length)
		}
	}

	shiftStr(str:string){
		if(str.length < this.length && this.str.indexOf(str,this.begin)==this.begin){
			return ShareString.of(this.str,this.begin+str.length,this.end)
		}
	}

	popStr(str:string){
		const idx=this.end - str.length
		if(str.length < this.length && this.str.indexOf(str,idx)==idx){
			return ShareString.of(this.str,this.begin,idx)
		}
	}
}

export function eqStr(){
	
}
export function appendStr(){

}