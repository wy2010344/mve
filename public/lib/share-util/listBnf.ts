
import { Map } from "./map"

export interface BaseListReadArray<V> extends BaseReadArray<V>{
	slice(begin?:number,end?:number):BaseListReadArray<V>
	join(v?:string):string
}

class ParserFail<V>{
	constructor(
		public readonly value:BaseListReadArray<V>,
		public readonly index:number,
		public readonly rule:BaseRule<V>,
		public readonly message:string
	){}
}
type ParserFun<V>=(value:BaseListReadArray<V>,i:number)=>(number|ParserFail<V>)
type MatchFun<V>=(value:BaseListReadArray<V>,i:number)=>(number|string)
/**匹配成功与失败*/
export class Match<V>{
	constructor(
		public readonly run:MatchFun<V>
	){}
	static of<V>(run:MatchFun<V>){
		return new Match(run)
	}
}

type BaseRule<V>=Match<V>|AndRule<V>|OrRule<V>|ManyRule<V>
type DelayBaseRule<V>=()=>BaseRule<V>
type UBaseRule<V>=DelayBaseRule<V>|BaseRule<V>

function isDelayBaseRule<V>(v:UBaseRule<V>):v is DelayBaseRule<V>{
	return typeof(v)=='function'
}

class AndRule<V>{
	constructor(
		public readonly rules:UBaseRule<V>[]
	){}
}
export function and<V>(...rules:UBaseRule<V>[]){
	return new AndRule(rules)
}

class OrRule<V>{
	constructor(
		public readonly rules:UBaseRule<V>[]
	){}
}
export function or<V>(...rules:UBaseRule<V>[]){
	return new OrRule(rules)
}

class ManyRule<V>{
	constructor(
		public readonly rule:UBaseRule<V>,
		public readonly min=0,
		public readonly max=Infinity
	){}
}
export function many<V>(rule:UBaseRule<V>,min=0,max=Infinity){
	return new ManyRule(rule,min,max)
}
export function zeroOrOne<V>(rule:UBaseRule<V>){
	return new ManyRule(rule,0,1)
}
export const empty=Match.of(function(vs,i){
	return i
})
export const eof=Match.of(function(vs,i){
	return i==vs.size()?i:`并非达到结束`
})
function pureParse<V>(rule:BaseRule<V>,pool:Map<BaseRule<V>,ParserFun<V>>):ParserFun<V>{
	if(rule instanceof Match){
		return function(value,i){
			const r=rule.run(value,i)
			if(typeof(r)=='string'){
				return new ParserFail(value,i,rule,r)
			}
			return r
		}
	}else
	if(rule instanceof AndRule){
		const rules=rule.rules
		return function(value,i){
			for(let x=0;x<rules.length;x++){
				const rule=rules[x]
				const result=parse(rule,pool)(value,i)
				if(parseFail(result)){
					return result
				}
				i=result
			}
			return i
		}
	}
	if(rule instanceof OrRule){
		const rules=rule.rules
		return function(value,i){
			for(let x=0;x<rules.length;x++){
				const rule=rules[x]
				const result=parse(rule,pool)(value,i)
				if(parseSuccess(result)){
					return result
				}
			}
			return new ParserFail(value,i,rule,`未匹配任何一个规则`)
		}
	}else
	if(rule instanceof ManyRule){
		const min=rule.min
		const max=rule.max
		return function(value,i){
			const innerRule=parse(rule.rule,pool)
			let count=0
			while(true){
				const r=innerRule(value,i)
				if(parseFail(r)){
					if(count<min){
						return new ParserFail(value,i,rule,`匹配小于最小值${min}`)
					}
					return i
				}
				count++
				if(count>max){
					return i
				}
				i=r
			}
		}
	}
}
function parse<V>(_rule:UBaseRule<V>,pool:Map<BaseRule<V>,ParserFun<V>>):ParserFun<V>{
	const rule=isDelayBaseRule(_rule)?_rule():_rule
	const existFun=pool.get(rule)
	if(existFun){
		return existFun
	}else{
		const newFun=pureParse(rule,pool)
		pool.set(rule,newFun)
		return newFun
	}
}

function parseSuccess<V>(v:(number|ParserFail<V>)):v is number{
	return typeof(v)=='number'
}
function parseFail<V>(v:(number|ParserFail<V>)):v is ParserFail<V>{
	return typeof(v)!='number'
}

/////////////////////////////取值部分///////////////////////////////////////////
class Get<V,T>{
	constructor(
		public readonly rule:UBaseRule<V>,
		public readonly get:(v:BaseListReadArray<V>,begin:number,end:number)=>T
	){}
}
export function get<V,T>(
	rule:UBaseRule<V>,
	get:(v:BaseListReadArray<V>,begin:number,end:number)=>T
){
	return new Get(rule,get)
}



class GetAnd<V,T>{
	constructor(
		public readonly vs:any[]
	){}
}
export function getAnd<V,A1,B>(before:UBaseRule<V>,r1:UGet<V,A1>,get:(a1:A1)=>B):GetAnd<V,B>
export function getAnd<V,A1,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,get:(a1:A1)=>B):GetAnd<V,B>
export function getAnd<V,A1,A2,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,r2:UGet<V,A2>,get:(a1:A1,a2:A2)=>B):GetAnd<V,B>
export function getAnd<V,A1,A2,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,r2:UGet<V,A2>,b2:UBaseRule<V>,get:(a1:A1,a2:A2)=>B):GetAnd<V,B>
export function getAnd<V,A1,A2,A3,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,r2:UGet<V,A2>,b2:UBaseRule<V>,r3:UGet<V,A3>,get:(a1:A1,a2:A2,a3:A3)=>B):GetAnd<V,B>
export function getAnd<V,A1,A2,A3,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,r2:UGet<V,A2>,b2:UBaseRule<V>,r3:UGet<V,A3>,b3:UBaseRule<V>,get:(a1:A1,a2:A2,a3:A3)=>B):GetAnd<V,B>
export function getAnd<V,A1,A2,A3,A4,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,r2:UGet<V,A2>,b2:UBaseRule<V>,r3:UGet<V,A3>,b3:UBaseRule<V>,r4:UGet<V,A4>,get:(a1:A1,a2:A2,a3:A3,a4:A4)=>B):GetAnd<V,B>
export function getAnd<V,A1,A2,A3,A4,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,r2:UGet<V,A2>,b2:UBaseRule<V>,r3:UGet<V,A3>,b3:UBaseRule<V>,r4:UGet<V,A4>,b4:UBaseRule<V>,get:(a1:A1,a2:A2,a3:A3,a4:A4)=>B):GetAnd<V,B>
export function getAnd<V,A1,A2,A3,A4,A5,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,r2:UGet<V,A2>,b2:UBaseRule<V>,r3:UGet<V,A3>,b3:UBaseRule<V>,r4:UGet<V,A4>,b4:UBaseRule<V>,r5:UGet<V,A5>,get:(a1:A1,a2:A2,a3:A3,a4:A4,a5:A5)=>B):GetAnd<V,B>
export function getAnd<V,A1,A2,A3,A4,A5,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,r2:UGet<V,A2>,b2:UBaseRule<V>,r3:UGet<V,A3>,b3:UBaseRule<V>,r4:UGet<V,A4>,b4:UBaseRule<V>,r5:UGet<V,A5>,b5:UBaseRule<V>,get:(a1:A1,a2:A2,a3:A3,a4:A4,a5:A5)=>B):GetAnd<V,B>
export function getAnd<V,A1,A2,A3,A4,A5,A6,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,r2:UGet<V,A2>,b2:UBaseRule<V>,r3:UGet<V,A3>,b3:UBaseRule<V>,r4:UGet<V,A4>,b4:UBaseRule<V>,r5:UGet<V,A5>,b5:UBaseRule<V>,r6:UGet<V,A6>,get:(a1:A1,a2:A2,a3:A3,a4:A4,a5:A5,a6:A6)=>B):GetAnd<V,B>
export function getAnd<V,A1,A2,A3,A4,A5,A6,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,r2:UGet<V,A2>,b2:UBaseRule<V>,r3:UGet<V,A3>,b3:UBaseRule<V>,r4:UGet<V,A4>,b4:UBaseRule<V>,r5:UGet<V,A5>,b5:UBaseRule<V>,r6:UGet<V,A6>,b6:UBaseRule<V>,get:(a1:A1,a2:A2,a3:A3,a4:A4,a5:A5,a6:A6)=>B):GetAnd<V,B>
export function getAnd<V,A1,A2,A3,A4,A5,A6,A7,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,r2:UGet<V,A2>,b2:UBaseRule<V>,r3:UGet<V,A3>,b3:UBaseRule<V>,r4:UGet<V,A4>,b4:UBaseRule<V>,r5:UGet<V,A5>,b5:UBaseRule<V>,r6:UGet<V,A6>,b6:UBaseRule<V>,r7:UGet<V,A7>,get:(a1:A1,a2:A2,a3:A3,a4:A4,a5:A5,a6:A6,a7:A7)=>B):GetAnd<V,B>
export function getAnd<V,A1,A2,A3,A4,A5,A6,A7,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,r2:UGet<V,A2>,b2:UBaseRule<V>,r3:UGet<V,A3>,b3:UBaseRule<V>,r4:UGet<V,A4>,b4:UBaseRule<V>,r5:UGet<V,A5>,b5:UBaseRule<V>,r6:UGet<V,A6>,b6:UBaseRule<V>,r7:UGet<V,A7>,b7:UBaseRule<V>,get:(a1:A1,a2:A2,a3:A3,a4:A4,a5:A5,a6:A6,a7:A7)=>B):GetAnd<V,B>
export function getAnd<V,A1,A2,A3,A4,A5,A6,A7,A8,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,r2:UGet<V,A2>,b2:UBaseRule<V>,r3:UGet<V,A3>,b3:UBaseRule<V>,r4:UGet<V,A4>,b4:UBaseRule<V>,r5:UGet<V,A5>,b5:UBaseRule<V>,r6:UGet<V,A6>,b6:UBaseRule<V>,r7:UGet<V,A7>,b7:UBaseRule<V>,r8:UGet<V,A8>,get:(a1:A1,a2:A2,a3:A3,a4:A4,a5:A5,a6:A6,a7:A7,a8:A8)=>B):GetAnd<V,B>
export function getAnd<V,A1,A2,A3,A4,A5,A6,A7,A8,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,r2:UGet<V,A2>,b2:UBaseRule<V>,r3:UGet<V,A3>,b3:UBaseRule<V>,r4:UGet<V,A4>,b4:UBaseRule<V>,r5:UGet<V,A5>,b5:UBaseRule<V>,r6:UGet<V,A6>,b6:UBaseRule<V>,r7:UGet<V,A7>,b7:UBaseRule<V>,r8:UGet<V,A8>,b8:UBaseRule<V>,get:(a1:A1,a2:A2,a3:A3,a4:A4,a5:A5,a6:A6,a7:A7,a8:A8)=>B):GetAnd<V,B>
export function getAnd<V,A1,A2,A3,A4,A5,A6,A7,A8,A9,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,r2:UGet<V,A2>,b2:UBaseRule<V>,r3:UGet<V,A3>,b3:UBaseRule<V>,r4:UGet<V,A4>,b4:UBaseRule<V>,r5:UGet<V,A5>,b5:UBaseRule<V>,r6:UGet<V,A6>,b6:UBaseRule<V>,r7:UGet<V,A7>,b7:UBaseRule<V>,r8:UGet<V,A8>,b8:UBaseRule<V>,r9:UGet<V,A9>,get:(a1:A1,a2:A2,a3:A3,a4:A4,a5:A5,a6:A6,a7:A7,a8:A8,a9:A9)=>B):GetAnd<V,B>
export function getAnd<V,A1,A2,A3,A4,A5,A6,A7,A8,A9,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,r2:UGet<V,A2>,b2:UBaseRule<V>,r3:UGet<V,A3>,b3:UBaseRule<V>,r4:UGet<V,A4>,b4:UBaseRule<V>,r5:UGet<V,A5>,b5:UBaseRule<V>,r6:UGet<V,A6>,b6:UBaseRule<V>,r7:UGet<V,A7>,b7:UBaseRule<V>,r8:UGet<V,A8>,b8:UBaseRule<V>,r9:UGet<V,A9>,b9:UBaseRule<V>,get:(a1:A1,a2:A2,a3:A3,a4:A4,a5:A5,a6:A6,a7:A7,a8:A8,a9:A9)=>B):GetAnd<V,B>
export function getAnd<V,A1,A2,A3,A4,A5,A6,A7,A8,A9,A10,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,r2:UGet<V,A2>,b2:UBaseRule<V>,r3:UGet<V,A3>,b3:UBaseRule<V>,r4:UGet<V,A4>,b4:UBaseRule<V>,r5:UGet<V,A5>,b5:UBaseRule<V>,r6:UGet<V,A6>,b6:UBaseRule<V>,r7:UGet<V,A7>,b7:UBaseRule<V>,r8:UGet<V,A8>,b8:UBaseRule<V>,r9:UGet<V,A9>,b9:UBaseRule<V>,r10:UGet<V,A10>,get:(a1:A1,a2:A2,a3:A3,a4:A4,a5:A5,a6:A6,a7:A7,a8:A8,a9:A9,a10:A10)=>B):GetAnd<V,B>
export function getAnd<V,A1,A2,A3,A4,A5,A6,A7,A8,A9,A10,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,r2:UGet<V,A2>,b2:UBaseRule<V>,r3:UGet<V,A3>,b3:UBaseRule<V>,r4:UGet<V,A4>,b4:UBaseRule<V>,r5:UGet<V,A5>,b5:UBaseRule<V>,r6:UGet<V,A6>,b6:UBaseRule<V>,r7:UGet<V,A7>,b7:UBaseRule<V>,r8:UGet<V,A8>,b8:UBaseRule<V>,r9:UGet<V,A9>,b9:UBaseRule<V>,r10:UGet<V,A10>,b10:UBaseRule<V>,get:(a1:A1,a2:A2,a3:A3,a4:A4,a5:A5,a6:A6,a7:A7,a8:A8,a9:A9,a10:A10)=>B):GetAnd<V,B>
export function getAnd<V,A1,A2,A3,A4,A5,A6,A7,A8,A9,A10,A11,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,r2:UGet<V,A2>,b2:UBaseRule<V>,r3:UGet<V,A3>,b3:UBaseRule<V>,r4:UGet<V,A4>,b4:UBaseRule<V>,r5:UGet<V,A5>,b5:UBaseRule<V>,r6:UGet<V,A6>,b6:UBaseRule<V>,r7:UGet<V,A7>,b7:UBaseRule<V>,r8:UGet<V,A8>,b8:UBaseRule<V>,r9:UGet<V,A9>,b9:UBaseRule<V>,r10:UGet<V,A10>,b10:UBaseRule<V>,r11:UGet<V,A11>,get:(a1:A1,a2:A2,a3:A3,a4:A4,a5:A5,a6:A6,a7:A7,a8:A8,a9:A9,a10:A10,a11:A11)=>B):GetAnd<V,B>
export function getAnd<V,A1,A2,A3,A4,A5,A6,A7,A8,A9,A10,A11,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,r2:UGet<V,A2>,b2:UBaseRule<V>,r3:UGet<V,A3>,b3:UBaseRule<V>,r4:UGet<V,A4>,b4:UBaseRule<V>,r5:UGet<V,A5>,b5:UBaseRule<V>,r6:UGet<V,A6>,b6:UBaseRule<V>,r7:UGet<V,A7>,b7:UBaseRule<V>,r8:UGet<V,A8>,b8:UBaseRule<V>,r9:UGet<V,A9>,b9:UBaseRule<V>,r10:UGet<V,A10>,b10:UBaseRule<V>,r11:UGet<V,A11>,b11:UBaseRule<V>,get:(a1:A1,a2:A2,a3:A3,a4:A4,a5:A5,a6:A6,a7:A7,a8:A8,a9:A9,a10:A10,a11:A11)=>B):GetAnd<V,B>
export function getAnd<V,A1,A2,A3,A4,A5,A6,A7,A8,A9,A10,A11,A12,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,r2:UGet<V,A2>,b2:UBaseRule<V>,r3:UGet<V,A3>,b3:UBaseRule<V>,r4:UGet<V,A4>,b4:UBaseRule<V>,r5:UGet<V,A5>,b5:UBaseRule<V>,r6:UGet<V,A6>,b6:UBaseRule<V>,r7:UGet<V,A7>,b7:UBaseRule<V>,r8:UGet<V,A8>,b8:UBaseRule<V>,r9:UGet<V,A9>,b9:UBaseRule<V>,r10:UGet<V,A10>,b10:UBaseRule<V>,r11:UGet<V,A11>,b11:UBaseRule<V>,r12:UGet<V,A12>,get:(a1:A1,a2:A2,a3:A3,a4:A4,a5:A5,a6:A6,a7:A7,a8:A8,a9:A9,a10:A10,a11:A11,a12:A12)=>B):GetAnd<V,B>
export function getAnd<V,A1,A2,A3,A4,A5,A6,A7,A8,A9,A10,A11,A12,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,r2:UGet<V,A2>,b2:UBaseRule<V>,r3:UGet<V,A3>,b3:UBaseRule<V>,r4:UGet<V,A4>,b4:UBaseRule<V>,r5:UGet<V,A5>,b5:UBaseRule<V>,r6:UGet<V,A6>,b6:UBaseRule<V>,r7:UGet<V,A7>,b7:UBaseRule<V>,r8:UGet<V,A8>,b8:UBaseRule<V>,r9:UGet<V,A9>,b9:UBaseRule<V>,r10:UGet<V,A10>,b10:UBaseRule<V>,r11:UGet<V,A11>,b11:UBaseRule<V>,r12:UGet<V,A12>,b12:UBaseRule<V>,get:(a1:A1,a2:A2,a3:A3,a4:A4,a5:A5,a6:A6,a7:A7,a8:A8,a9:A9,a10:A10,a11:A11,a12:A12)=>B):GetAnd<V,B>
export function getAnd<V,A1,A2,A3,A4,A5,A6,A7,A8,A9,A10,A11,A12,A13,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,r2:UGet<V,A2>,b2:UBaseRule<V>,r3:UGet<V,A3>,b3:UBaseRule<V>,r4:UGet<V,A4>,b4:UBaseRule<V>,r5:UGet<V,A5>,b5:UBaseRule<V>,r6:UGet<V,A6>,b6:UBaseRule<V>,r7:UGet<V,A7>,b7:UBaseRule<V>,r8:UGet<V,A8>,b8:UBaseRule<V>,r9:UGet<V,A9>,b9:UBaseRule<V>,r10:UGet<V,A10>,b10:UBaseRule<V>,r11:UGet<V,A11>,b11:UBaseRule<V>,r12:UGet<V,A12>,b12:UBaseRule<V>,r13:UGet<V,A13>,get:(a1:A1,a2:A2,a3:A3,a4:A4,a5:A5,a6:A6,a7:A7,a8:A8,a9:A9,a10:A10,a11:A11,a12:A12,a13:A13)=>B):GetAnd<V,B>
export function getAnd<V,A1,A2,A3,A4,A5,A6,A7,A8,A9,A10,A11,A12,A13,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,r2:UGet<V,A2>,b2:UBaseRule<V>,r3:UGet<V,A3>,b3:UBaseRule<V>,r4:UGet<V,A4>,b4:UBaseRule<V>,r5:UGet<V,A5>,b5:UBaseRule<V>,r6:UGet<V,A6>,b6:UBaseRule<V>,r7:UGet<V,A7>,b7:UBaseRule<V>,r8:UGet<V,A8>,b8:UBaseRule<V>,r9:UGet<V,A9>,b9:UBaseRule<V>,r10:UGet<V,A10>,b10:UBaseRule<V>,r11:UGet<V,A11>,b11:UBaseRule<V>,r12:UGet<V,A12>,b12:UBaseRule<V>,r13:UGet<V,A13>,b13:UBaseRule<V>,get:(a1:A1,a2:A2,a3:A3,a4:A4,a5:A5,a6:A6,a7:A7,a8:A8,a9:A9,a10:A10,a11:A11,a12:A12,a13:A13)=>B):GetAnd<V,B>
export function getAnd<V,A1,A2,A3,A4,A5,A6,A7,A8,A9,A10,A11,A12,A13,A14,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,r2:UGet<V,A2>,b2:UBaseRule<V>,r3:UGet<V,A3>,b3:UBaseRule<V>,r4:UGet<V,A4>,b4:UBaseRule<V>,r5:UGet<V,A5>,b5:UBaseRule<V>,r6:UGet<V,A6>,b6:UBaseRule<V>,r7:UGet<V,A7>,b7:UBaseRule<V>,r8:UGet<V,A8>,b8:UBaseRule<V>,r9:UGet<V,A9>,b9:UBaseRule<V>,r10:UGet<V,A10>,b10:UBaseRule<V>,r11:UGet<V,A11>,b11:UBaseRule<V>,r12:UGet<V,A12>,b12:UBaseRule<V>,r13:UGet<V,A13>,b13:UBaseRule<V>,r14:UGet<V,A14>,get:(a1:A1,a2:A2,a3:A3,a4:A4,a5:A5,a6:A6,a7:A7,a8:A8,a9:A9,a10:A10,a11:A11,a12:A12,a13:A13,a14:A14)=>B):GetAnd<V,B>
export function getAnd<V,A1,A2,A3,A4,A5,A6,A7,A8,A9,A10,A11,A12,A13,A14,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,r2:UGet<V,A2>,b2:UBaseRule<V>,r3:UGet<V,A3>,b3:UBaseRule<V>,r4:UGet<V,A4>,b4:UBaseRule<V>,r5:UGet<V,A5>,b5:UBaseRule<V>,r6:UGet<V,A6>,b6:UBaseRule<V>,r7:UGet<V,A7>,b7:UBaseRule<V>,r8:UGet<V,A8>,b8:UBaseRule<V>,r9:UGet<V,A9>,b9:UBaseRule<V>,r10:UGet<V,A10>,b10:UBaseRule<V>,r11:UGet<V,A11>,b11:UBaseRule<V>,r12:UGet<V,A12>,b12:UBaseRule<V>,r13:UGet<V,A13>,b13:UBaseRule<V>,r14:UGet<V,A14>,b14:UBaseRule<V>,get:(a1:A1,a2:A2,a3:A3,a4:A4,a5:A5,a6:A6,a7:A7,a8:A8,a9:A9,a10:A10,a11:A11,a12:A12,a13:A13,a14:A14)=>B):GetAnd<V,B>
export function getAnd<V,A1,A2,A3,A4,A5,A6,A7,A8,A9,A10,A11,A12,A13,A14,A15,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,r2:UGet<V,A2>,b2:UBaseRule<V>,r3:UGet<V,A3>,b3:UBaseRule<V>,r4:UGet<V,A4>,b4:UBaseRule<V>,r5:UGet<V,A5>,b5:UBaseRule<V>,r6:UGet<V,A6>,b6:UBaseRule<V>,r7:UGet<V,A7>,b7:UBaseRule<V>,r8:UGet<V,A8>,b8:UBaseRule<V>,r9:UGet<V,A9>,b9:UBaseRule<V>,r10:UGet<V,A10>,b10:UBaseRule<V>,r11:UGet<V,A11>,b11:UBaseRule<V>,r12:UGet<V,A12>,b12:UBaseRule<V>,r13:UGet<V,A13>,b13:UBaseRule<V>,r14:UGet<V,A14>,b14:UBaseRule<V>,r15:UGet<V,A15>,get:(a1:A1,a2:A2,a3:A3,a4:A4,a5:A5,a6:A6,a7:A7,a8:A8,a9:A9,a10:A10,a11:A11,a12:A12,a13:A13,a14:A14,a15:A15)=>B):GetAnd<V,B>
export function getAnd<V,A1,A2,A3,A4,A5,A6,A7,A8,A9,A10,A11,A12,A13,A14,A15,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,r2:UGet<V,A2>,b2:UBaseRule<V>,r3:UGet<V,A3>,b3:UBaseRule<V>,r4:UGet<V,A4>,b4:UBaseRule<V>,r5:UGet<V,A5>,b5:UBaseRule<V>,r6:UGet<V,A6>,b6:UBaseRule<V>,r7:UGet<V,A7>,b7:UBaseRule<V>,r8:UGet<V,A8>,b8:UBaseRule<V>,r9:UGet<V,A9>,b9:UBaseRule<V>,r10:UGet<V,A10>,b10:UBaseRule<V>,r11:UGet<V,A11>,b11:UBaseRule<V>,r12:UGet<V,A12>,b12:UBaseRule<V>,r13:UGet<V,A13>,b13:UBaseRule<V>,r14:UGet<V,A14>,b14:UBaseRule<V>,r15:UGet<V,A15>,b15:UBaseRule<V>,get:(a1:A1,a2:A2,a3:A3,a4:A4,a5:A5,a6:A6,a7:A7,a8:A8,a9:A9,a10:A10,a11:A11,a12:A12,a13:A13,a14:A14,a15:A15)=>B):GetAnd<V,B>
export function getAnd<V,A1,A2,A3,A4,A5,A6,A7,A8,A9,A10,A11,A12,A13,A14,A15,A16,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,r2:UGet<V,A2>,b2:UBaseRule<V>,r3:UGet<V,A3>,b3:UBaseRule<V>,r4:UGet<V,A4>,b4:UBaseRule<V>,r5:UGet<V,A5>,b5:UBaseRule<V>,r6:UGet<V,A6>,b6:UBaseRule<V>,r7:UGet<V,A7>,b7:UBaseRule<V>,r8:UGet<V,A8>,b8:UBaseRule<V>,r9:UGet<V,A9>,b9:UBaseRule<V>,r10:UGet<V,A10>,b10:UBaseRule<V>,r11:UGet<V,A11>,b11:UBaseRule<V>,r12:UGet<V,A12>,b12:UBaseRule<V>,r13:UGet<V,A13>,b13:UBaseRule<V>,r14:UGet<V,A14>,b14:UBaseRule<V>,r15:UGet<V,A15>,b15:UBaseRule<V>,r16:UGet<V,A16>,get:(a1:A1,a2:A2,a3:A3,a4:A4,a5:A5,a6:A6,a7:A7,a8:A8,a9:A9,a10:A10,a11:A11,a12:A12,a13:A13,a14:A14,a15:A15,a16:A16)=>B):GetAnd<V,B>
export function getAnd<V,A1,A2,A3,A4,A5,A6,A7,A8,A9,A10,A11,A12,A13,A14,A15,A16,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,r2:UGet<V,A2>,b2:UBaseRule<V>,r3:UGet<V,A3>,b3:UBaseRule<V>,r4:UGet<V,A4>,b4:UBaseRule<V>,r5:UGet<V,A5>,b5:UBaseRule<V>,r6:UGet<V,A6>,b6:UBaseRule<V>,r7:UGet<V,A7>,b7:UBaseRule<V>,r8:UGet<V,A8>,b8:UBaseRule<V>,r9:UGet<V,A9>,b9:UBaseRule<V>,r10:UGet<V,A10>,b10:UBaseRule<V>,r11:UGet<V,A11>,b11:UBaseRule<V>,r12:UGet<V,A12>,b12:UBaseRule<V>,r13:UGet<V,A13>,b13:UBaseRule<V>,r14:UGet<V,A14>,b14:UBaseRule<V>,r15:UGet<V,A15>,b15:UBaseRule<V>,r16:UGet<V,A16>,b16:UBaseRule<V>,get:(a1:A1,a2:A2,a3:A3,a4:A4,a5:A5,a6:A6,a7:A7,a8:A8,a9:A9,a10:A10,a11:A11,a12:A12,a13:A13,a14:A14,a15:A15,a16:A16)=>B):GetAnd<V,B>
export function getAnd<V,A1,A2,A3,A4,A5,A6,A7,A8,A9,A10,A11,A12,A13,A14,A15,A16,A17,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,r2:UGet<V,A2>,b2:UBaseRule<V>,r3:UGet<V,A3>,b3:UBaseRule<V>,r4:UGet<V,A4>,b4:UBaseRule<V>,r5:UGet<V,A5>,b5:UBaseRule<V>,r6:UGet<V,A6>,b6:UBaseRule<V>,r7:UGet<V,A7>,b7:UBaseRule<V>,r8:UGet<V,A8>,b8:UBaseRule<V>,r9:UGet<V,A9>,b9:UBaseRule<V>,r10:UGet<V,A10>,b10:UBaseRule<V>,r11:UGet<V,A11>,b11:UBaseRule<V>,r12:UGet<V,A12>,b12:UBaseRule<V>,r13:UGet<V,A13>,b13:UBaseRule<V>,r14:UGet<V,A14>,b14:UBaseRule<V>,r15:UGet<V,A15>,b15:UBaseRule<V>,r16:UGet<V,A16>,b16:UBaseRule<V>,r17:UGet<V,A17>,get:(a1:A1,a2:A2,a3:A3,a4:A4,a5:A5,a6:A6,a7:A7,a8:A8,a9:A9,a10:A10,a11:A11,a12:A12,a13:A13,a14:A14,a15:A15,a16:A16,a17:A17)=>B):GetAnd<V,B>
export function getAnd<V,A1,A2,A3,A4,A5,A6,A7,A8,A9,A10,A11,A12,A13,A14,A15,A16,A17,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,r2:UGet<V,A2>,b2:UBaseRule<V>,r3:UGet<V,A3>,b3:UBaseRule<V>,r4:UGet<V,A4>,b4:UBaseRule<V>,r5:UGet<V,A5>,b5:UBaseRule<V>,r6:UGet<V,A6>,b6:UBaseRule<V>,r7:UGet<V,A7>,b7:UBaseRule<V>,r8:UGet<V,A8>,b8:UBaseRule<V>,r9:UGet<V,A9>,b9:UBaseRule<V>,r10:UGet<V,A10>,b10:UBaseRule<V>,r11:UGet<V,A11>,b11:UBaseRule<V>,r12:UGet<V,A12>,b12:UBaseRule<V>,r13:UGet<V,A13>,b13:UBaseRule<V>,r14:UGet<V,A14>,b14:UBaseRule<V>,r15:UGet<V,A15>,b15:UBaseRule<V>,r16:UGet<V,A16>,b16:UBaseRule<V>,r17:UGet<V,A17>,b17:UBaseRule<V>,get:(a1:A1,a2:A2,a3:A3,a4:A4,a5:A5,a6:A6,a7:A7,a8:A8,a9:A9,a10:A10,a11:A11,a12:A12,a13:A13,a14:A14,a15:A15,a16:A16,a17:A17)=>B):GetAnd<V,B>
export function getAnd<V,A1,A2,A3,A4,A5,A6,A7,A8,A9,A10,A11,A12,A13,A14,A15,A16,A17,A18,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,r2:UGet<V,A2>,b2:UBaseRule<V>,r3:UGet<V,A3>,b3:UBaseRule<V>,r4:UGet<V,A4>,b4:UBaseRule<V>,r5:UGet<V,A5>,b5:UBaseRule<V>,r6:UGet<V,A6>,b6:UBaseRule<V>,r7:UGet<V,A7>,b7:UBaseRule<V>,r8:UGet<V,A8>,b8:UBaseRule<V>,r9:UGet<V,A9>,b9:UBaseRule<V>,r10:UGet<V,A10>,b10:UBaseRule<V>,r11:UGet<V,A11>,b11:UBaseRule<V>,r12:UGet<V,A12>,b12:UBaseRule<V>,r13:UGet<V,A13>,b13:UBaseRule<V>,r14:UGet<V,A14>,b14:UBaseRule<V>,r15:UGet<V,A15>,b15:UBaseRule<V>,r16:UGet<V,A16>,b16:UBaseRule<V>,r17:UGet<V,A17>,b17:UBaseRule<V>,r18:UGet<V,A18>,get:(a1:A1,a2:A2,a3:A3,a4:A4,a5:A5,a6:A6,a7:A7,a8:A8,a9:A9,a10:A10,a11:A11,a12:A12,a13:A13,a14:A14,a15:A15,a16:A16,a17:A17,a18:A18)=>B):GetAnd<V,B>
export function getAnd<V,A1,A2,A3,A4,A5,A6,A7,A8,A9,A10,A11,A12,A13,A14,A15,A16,A17,A18,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,r2:UGet<V,A2>,b2:UBaseRule<V>,r3:UGet<V,A3>,b3:UBaseRule<V>,r4:UGet<V,A4>,b4:UBaseRule<V>,r5:UGet<V,A5>,b5:UBaseRule<V>,r6:UGet<V,A6>,b6:UBaseRule<V>,r7:UGet<V,A7>,b7:UBaseRule<V>,r8:UGet<V,A8>,b8:UBaseRule<V>,r9:UGet<V,A9>,b9:UBaseRule<V>,r10:UGet<V,A10>,b10:UBaseRule<V>,r11:UGet<V,A11>,b11:UBaseRule<V>,r12:UGet<V,A12>,b12:UBaseRule<V>,r13:UGet<V,A13>,b13:UBaseRule<V>,r14:UGet<V,A14>,b14:UBaseRule<V>,r15:UGet<V,A15>,b15:UBaseRule<V>,r16:UGet<V,A16>,b16:UBaseRule<V>,r17:UGet<V,A17>,b17:UBaseRule<V>,r18:UGet<V,A18>,b18:UBaseRule<V>,get:(a1:A1,a2:A2,a3:A3,a4:A4,a5:A5,a6:A6,a7:A7,a8:A8,a9:A9,a10:A10,a11:A11,a12:A12,a13:A13,a14:A14,a15:A15,a16:A16,a17:A17,a18:A18)=>B):GetAnd<V,B>
export function getAnd<V,A1,A2,A3,A4,A5,A6,A7,A8,A9,A10,A11,A12,A13,A14,A15,A16,A17,A18,A19,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,r2:UGet<V,A2>,b2:UBaseRule<V>,r3:UGet<V,A3>,b3:UBaseRule<V>,r4:UGet<V,A4>,b4:UBaseRule<V>,r5:UGet<V,A5>,b5:UBaseRule<V>,r6:UGet<V,A6>,b6:UBaseRule<V>,r7:UGet<V,A7>,b7:UBaseRule<V>,r8:UGet<V,A8>,b8:UBaseRule<V>,r9:UGet<V,A9>,b9:UBaseRule<V>,r10:UGet<V,A10>,b10:UBaseRule<V>,r11:UGet<V,A11>,b11:UBaseRule<V>,r12:UGet<V,A12>,b12:UBaseRule<V>,r13:UGet<V,A13>,b13:UBaseRule<V>,r14:UGet<V,A14>,b14:UBaseRule<V>,r15:UGet<V,A15>,b15:UBaseRule<V>,r16:UGet<V,A16>,b16:UBaseRule<V>,r17:UGet<V,A17>,b17:UBaseRule<V>,r18:UGet<V,A18>,b18:UBaseRule<V>,r19:UGet<V,A19>,get:(a1:A1,a2:A2,a3:A3,a4:A4,a5:A5,a6:A6,a7:A7,a8:A8,a9:A9,a10:A10,a11:A11,a12:A12,a13:A13,a14:A14,a15:A15,a16:A16,a17:A17,a18:A18,a19:A19)=>B):GetAnd<V,B>
export function getAnd<V,A1,A2,A3,A4,A5,A6,A7,A8,A9,A10,A11,A12,A13,A14,A15,A16,A17,A18,A19,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,r2:UGet<V,A2>,b2:UBaseRule<V>,r3:UGet<V,A3>,b3:UBaseRule<V>,r4:UGet<V,A4>,b4:UBaseRule<V>,r5:UGet<V,A5>,b5:UBaseRule<V>,r6:UGet<V,A6>,b6:UBaseRule<V>,r7:UGet<V,A7>,b7:UBaseRule<V>,r8:UGet<V,A8>,b8:UBaseRule<V>,r9:UGet<V,A9>,b9:UBaseRule<V>,r10:UGet<V,A10>,b10:UBaseRule<V>,r11:UGet<V,A11>,b11:UBaseRule<V>,r12:UGet<V,A12>,b12:UBaseRule<V>,r13:UGet<V,A13>,b13:UBaseRule<V>,r14:UGet<V,A14>,b14:UBaseRule<V>,r15:UGet<V,A15>,b15:UBaseRule<V>,r16:UGet<V,A16>,b16:UBaseRule<V>,r17:UGet<V,A17>,b17:UBaseRule<V>,r18:UGet<V,A18>,b18:UBaseRule<V>,r19:UGet<V,A19>,b19:UBaseRule<V>,get:(a1:A1,a2:A2,a3:A3,a4:A4,a5:A5,a6:A6,a7:A7,a8:A8,a9:A9,a10:A10,a11:A11,a12:A12,a13:A13,a14:A14,a15:A15,a16:A16,a17:A17,a18:A18,a19:A19)=>B):GetAnd<V,B>
export function getAnd<V,A1,A2,A3,A4,A5,A6,A7,A8,A9,A10,A11,A12,A13,A14,A15,A16,A17,A18,A19,A20,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,r2:UGet<V,A2>,b2:UBaseRule<V>,r3:UGet<V,A3>,b3:UBaseRule<V>,r4:UGet<V,A4>,b4:UBaseRule<V>,r5:UGet<V,A5>,b5:UBaseRule<V>,r6:UGet<V,A6>,b6:UBaseRule<V>,r7:UGet<V,A7>,b7:UBaseRule<V>,r8:UGet<V,A8>,b8:UBaseRule<V>,r9:UGet<V,A9>,b9:UBaseRule<V>,r10:UGet<V,A10>,b10:UBaseRule<V>,r11:UGet<V,A11>,b11:UBaseRule<V>,r12:UGet<V,A12>,b12:UBaseRule<V>,r13:UGet<V,A13>,b13:UBaseRule<V>,r14:UGet<V,A14>,b14:UBaseRule<V>,r15:UGet<V,A15>,b15:UBaseRule<V>,r16:UGet<V,A16>,b16:UBaseRule<V>,r17:UGet<V,A17>,b17:UBaseRule<V>,r18:UGet<V,A18>,b18:UBaseRule<V>,r19:UGet<V,A19>,b19:UBaseRule<V>,r20:UGet<V,A20>,get:(a1:A1,a2:A2,a3:A3,a4:A4,a5:A5,a6:A6,a7:A7,a8:A8,a9:A9,a10:A10,a11:A11,a12:A12,a13:A13,a14:A14,a15:A15,a16:A16,a17:A17,a18:A18,a19:A19,a20:A20)=>B):GetAnd<V,B>
export function getAnd<V,A1,A2,A3,A4,A5,A6,A7,A8,A9,A10,A11,A12,A13,A14,A15,A16,A17,A18,A19,A20,B>(before:UBaseRule<V>,r1:UGet<V,A1>,b1:UBaseRule<V>,r2:UGet<V,A2>,b2:UBaseRule<V>,r3:UGet<V,A3>,b3:UBaseRule<V>,r4:UGet<V,A4>,b4:UBaseRule<V>,r5:UGet<V,A5>,b5:UBaseRule<V>,r6:UGet<V,A6>,b6:UBaseRule<V>,r7:UGet<V,A7>,b7:UBaseRule<V>,r8:UGet<V,A8>,b8:UBaseRule<V>,r9:UGet<V,A9>,b9:UBaseRule<V>,r10:UGet<V,A10>,b10:UBaseRule<V>,r11:UGet<V,A11>,b11:UBaseRule<V>,r12:UGet<V,A12>,b12:UBaseRule<V>,r13:UGet<V,A13>,b13:UBaseRule<V>,r14:UGet<V,A14>,b14:UBaseRule<V>,r15:UGet<V,A15>,b15:UBaseRule<V>,r16:UGet<V,A16>,b16:UBaseRule<V>,r17:UGet<V,A17>,b17:UBaseRule<V>,r18:UGet<V,A18>,b18:UBaseRule<V>,r19:UGet<V,A19>,b19:UBaseRule<V>,r20:UGet<V,A20>,b20:UBaseRule<V>,get:(a1:A1,a2:A2,a3:A3,a4:A4,a5:A5,a6:A6,a7:A7,a8:A8,a9:A9,a10:A10,a11:A11,a12:A12,a13:A13,a14:A14,a15:A15,a16:A16,a17:A17,a18:A18,a19:A19,a20:A20)=>B):GetAnd<V,B>
export function getAnd(...vs:any[]){
	return new GetAnd(vs)
}
/**可以用0-1的匹配*/
class GetMany<V,T>{
	constructor(
		public readonly repeat:UGet<V,any>,
		public readonly get:(ts)=>T
	){}
}
export function getMany<V,A,B>(repeat:UGet<V,A>,get:(ts:A[])=>B){
	return new GetMany(repeat,get)
}

class GetOr<V,T>{
	constructor(
		public readonly rules:UGet<V,any>[]
	){}
}
export function getOr<V,A1>(a1:UGet<V,A1>):GetOr<V,A1>
export function getOr<V,A1,A2>(a1:UGet<V,A1>,a2:UGet<V,A2>):GetOr<V,A1|A2>
export function getOr<V,A1,A2,A3>(a1:UGet<V,A1>,a2:UGet<V,A2>,a3:UGet<V,A3>):GetOr<V,A1|A2|A3>
export function getOr<V,A1,A2,A3,A4>(a1:UGet<V,A1>,a2:UGet<V,A2>,a3:UGet<V,A3>,a4:UGet<V,A4>):GetOr<V,A1|A2|A3|A4>
export function getOr<V,A1,A2,A3,A4,A5>(a1:UGet<V,A1>,a2:UGet<V,A2>,a3:UGet<V,A3>,a4:UGet<V,A4>,a5:UGet<V,A5>):GetOr<V,A1|A2|A3|A4|A5>
export function getOr<V,A1,A2,A3,A4,A5,A6>(a1:UGet<V,A1>,a2:UGet<V,A2>,a3:UGet<V,A3>,a4:UGet<V,A4>,a5:UGet<V,A5>,a6:UGet<V,A6>):GetOr<V,A1|A2|A3|A4|A5|A6>
export function getOr<V,A1,A2,A3,A4,A5,A6,A7>(a1:UGet<V,A1>,a2:UGet<V,A2>,a3:UGet<V,A3>,a4:UGet<V,A4>,a5:UGet<V,A5>,a6:UGet<V,A6>,a7:UGet<V,A7>):GetOr<V,A1|A2|A3|A4|A5|A6|A7>
export function getOr<V,A1,A2,A3,A4,A5,A6,A7,A8>(a1:UGet<V,A1>,a2:UGet<V,A2>,a3:UGet<V,A3>,a4:UGet<V,A4>,a5:UGet<V,A5>,a6:UGet<V,A6>,a7:UGet<V,A7>,a8:UGet<V,A8>):GetOr<V,A1|A2|A3|A4|A5|A6|A7|A8>
export function getOr<V,A1,A2,A3,A4,A5,A6,A7,A8,A9>(a1:UGet<V,A1>,a2:UGet<V,A2>,a3:UGet<V,A3>,a4:UGet<V,A4>,a5:UGet<V,A5>,a6:UGet<V,A6>,a7:UGet<V,A7>,a8:UGet<V,A8>,a9:UGet<V,A9>):GetOr<V,A1|A2|A3|A4|A5|A6|A7|A8|A9>
export function getOr<V,A1,A2,A3,A4,A5,A6,A7,A8,A9,A10>(a1:UGet<V,A1>,a2:UGet<V,A2>,a3:UGet<V,A3>,a4:UGet<V,A4>,a5:UGet<V,A5>,a6:UGet<V,A6>,a7:UGet<V,A7>,a8:UGet<V,A8>,a9:UGet<V,A9>,a10:UGet<V,A10>):GetOr<V,A1|A2|A3|A4|A5|A6|A7|A8|A9|A10>
export function getOr<V,A1,A2,A3,A4,A5,A6,A7,A8,A9,A10,A11>(a1:UGet<V,A1>,a2:UGet<V,A2>,a3:UGet<V,A3>,a4:UGet<V,A4>,a5:UGet<V,A5>,a6:UGet<V,A6>,a7:UGet<V,A7>,a8:UGet<V,A8>,a9:UGet<V,A9>,a10:UGet<V,A10>,a11:UGet<V,A11>):GetOr<V,A1|A2|A3|A4|A5|A6|A7|A8|A9|A10|A11>
export function getOr<V,A1,A2,A3,A4,A5,A6,A7,A8,A9,A10,A11,A12>(a1:UGet<V,A1>,a2:UGet<V,A2>,a3:UGet<V,A3>,a4:UGet<V,A4>,a5:UGet<V,A5>,a6:UGet<V,A6>,a7:UGet<V,A7>,a8:UGet<V,A8>,a9:UGet<V,A9>,a10:UGet<V,A10>,a11:UGet<V,A11>,a12:UGet<V,A12>):GetOr<V,A1|A2|A3|A4|A5|A6|A7|A8|A9|A10|A11|A12>
export function getOr<V,A1,A2,A3,A4,A5,A6,A7,A8,A9,A10,A11,A12,A13>(a1:UGet<V,A1>,a2:UGet<V,A2>,a3:UGet<V,A3>,a4:UGet<V,A4>,a5:UGet<V,A5>,a6:UGet<V,A6>,a7:UGet<V,A7>,a8:UGet<V,A8>,a9:UGet<V,A9>,a10:UGet<V,A10>,a11:UGet<V,A11>,a12:UGet<V,A12>,a13:UGet<V,A13>):GetOr<V,A1|A2|A3|A4|A5|A6|A7|A8|A9|A10|A11|A12|A13>
export function getOr<V,A1,A2,A3,A4,A5,A6,A7,A8,A9,A10,A11,A12,A13,A14>(a1:UGet<V,A1>,a2:UGet<V,A2>,a3:UGet<V,A3>,a4:UGet<V,A4>,a5:UGet<V,A5>,a6:UGet<V,A6>,a7:UGet<V,A7>,a8:UGet<V,A8>,a9:UGet<V,A9>,a10:UGet<V,A10>,a11:UGet<V,A11>,a12:UGet<V,A12>,a13:UGet<V,A13>,a14:UGet<V,A14>):GetOr<V,A1|A2|A3|A4|A5|A6|A7|A8|A9|A10|A11|A12|A13|A14>
export function getOr<V,A1,A2,A3,A4,A5,A6,A7,A8,A9,A10,A11,A12,A13,A14,A15>(a1:UGet<V,A1>,a2:UGet<V,A2>,a3:UGet<V,A3>,a4:UGet<V,A4>,a5:UGet<V,A5>,a6:UGet<V,A6>,a7:UGet<V,A7>,a8:UGet<V,A8>,a9:UGet<V,A9>,a10:UGet<V,A10>,a11:UGet<V,A11>,a12:UGet<V,A12>,a13:UGet<V,A13>,a14:UGet<V,A14>,a15:UGet<V,A15>):GetOr<V,A1|A2|A3|A4|A5|A6|A7|A8|A9|A10|A11|A12|A13|A14|A15>
export function getOr<V,A1,A2,A3,A4,A5,A6,A7,A8,A9,A10,A11,A12,A13,A14,A15,A16>(a1:UGet<V,A1>,a2:UGet<V,A2>,a3:UGet<V,A3>,a4:UGet<V,A4>,a5:UGet<V,A5>,a6:UGet<V,A6>,a7:UGet<V,A7>,a8:UGet<V,A8>,a9:UGet<V,A9>,a10:UGet<V,A10>,a11:UGet<V,A11>,a12:UGet<V,A12>,a13:UGet<V,A13>,a14:UGet<V,A14>,a15:UGet<V,A15>,a16:UGet<V,A16>):GetOr<V,A1|A2|A3|A4|A5|A6|A7|A8|A9|A10|A11|A12|A13|A14|A15|A16>
export function getOr<V,A1,A2,A3,A4,A5,A6,A7,A8,A9,A10,A11,A12,A13,A14,A15,A16,A17>(a1:UGet<V,A1>,a2:UGet<V,A2>,a3:UGet<V,A3>,a4:UGet<V,A4>,a5:UGet<V,A5>,a6:UGet<V,A6>,a7:UGet<V,A7>,a8:UGet<V,A8>,a9:UGet<V,A9>,a10:UGet<V,A10>,a11:UGet<V,A11>,a12:UGet<V,A12>,a13:UGet<V,A13>,a14:UGet<V,A14>,a15:UGet<V,A15>,a16:UGet<V,A16>,a17:UGet<V,A17>):GetOr<V,A1|A2|A3|A4|A5|A6|A7|A8|A9|A10|A11|A12|A13|A14|A15|A16|A17>
export function getOr<V,A1,A2,A3,A4,A5,A6,A7,A8,A9,A10,A11,A12,A13,A14,A15,A16,A17,A18>(a1:UGet<V,A1>,a2:UGet<V,A2>,a3:UGet<V,A3>,a4:UGet<V,A4>,a5:UGet<V,A5>,a6:UGet<V,A6>,a7:UGet<V,A7>,a8:UGet<V,A8>,a9:UGet<V,A9>,a10:UGet<V,A10>,a11:UGet<V,A11>,a12:UGet<V,A12>,a13:UGet<V,A13>,a14:UGet<V,A14>,a15:UGet<V,A15>,a16:UGet<V,A16>,a17:UGet<V,A17>,a18:UGet<V,A18>):GetOr<V,A1|A2|A3|A4|A5|A6|A7|A8|A9|A10|A11|A12|A13|A14|A15|A16|A17|A18>
export function getOr<V,A1,A2,A3,A4,A5,A6,A7,A8,A9,A10,A11,A12,A13,A14,A15,A16,A17,A18,A19>(a1:UGet<V,A1>,a2:UGet<V,A2>,a3:UGet<V,A3>,a4:UGet<V,A4>,a5:UGet<V,A5>,a6:UGet<V,A6>,a7:UGet<V,A7>,a8:UGet<V,A8>,a9:UGet<V,A9>,a10:UGet<V,A10>,a11:UGet<V,A11>,a12:UGet<V,A12>,a13:UGet<V,A13>,a14:UGet<V,A14>,a15:UGet<V,A15>,a16:UGet<V,A16>,a17:UGet<V,A17>,a18:UGet<V,A18>,a19:UGet<V,A19>):GetOr<V,A1|A2|A3|A4|A5|A6|A7|A8|A9|A10|A11|A12|A13|A14|A15|A16|A17|A18|A19>
export function getOr<V,A1,A2,A3,A4,A5,A6,A7,A8,A9,A10,A11,A12,A13,A14,A15,A16,A17,A18,A19,A20>(a1:UGet<V,A1>,a2:UGet<V,A2>,a3:UGet<V,A3>,a4:UGet<V,A4>,a5:UGet<V,A5>,a6:UGet<V,A6>,a7:UGet<V,A7>,a8:UGet<V,A8>,a9:UGet<V,A9>,a10:UGet<V,A10>,a11:UGet<V,A11>,a12:UGet<V,A12>,a13:UGet<V,A13>,a14:UGet<V,A14>,a15:UGet<V,A15>,a16:UGet<V,A16>,a17:UGet<V,A17>,a18:UGet<V,A18>,a19:UGet<V,A19>,a20:UGet<V,A20>):GetOr<V,A1|A2|A3|A4|A5|A6|A7|A8|A9|A10|A11|A12|A13|A14|A15|A16|A17|A18|A19|A20>
export function getOr(...vs){
	return new GetOr(vs)
}


export type PGet<V,T>=Get<V,T>
| GetAnd<V,T>
| GetMany<V,T>
| GetOr<V,T>

export type DelayPGet<V,T>=()=>PGet<V,T>
type UGet<V,T> = PGet<V,T> | DelayPGet<V,T>
function isDelayPGet<V,T>(v:UGet<V,T>):v is DelayPGet<V,T>{
	return typeof(v)=='function'
}
export class ParseSuccess<T>{
	constructor(
		public index:number,
		public value:T,
		public end:number
	){}
}


export class LocError<V,T>{
	constructor(
		public index:number,
		public readonly rule:PGet<V,T>,
		public readonly message:ParserFail<V> | LocError<any,any> | string
	){}

	toString(){
		if(this.message instanceof LocError){
			return this.message.toString()
		}else if(this.message instanceof ParserFail){
			return this.message.message
		}else{
			return this.message
		}
	}
}
type ParserGet<V,T> = (value:BaseListReadArray<V>,i:number)=>(ParseSuccess<T>|LocError<V,T>)
function pureParseGet<V,T>(
	rule:PGet<V,T>,
	pool:Map<PGet<V,T>,ParserGet<V,T>>,
	funPool:Map<BaseRule<V>,ParserFun<V>>
):ParserGet<V,T>{
	if(rule instanceof Get){
		return function(value,i){
			const contentRule=parse(rule.rule,funPool)
			const r=contentRule(value,i)
			if(parseFail(r)){
				return new LocError(i,rule,r)
			}else{
				return new ParseSuccess(i,rule.get(value,i,r),r)
			}
		}
	}else
	if(rule instanceof GetMany){
		return function(value,i){
			const contentRule=parseGet(rule.repeat,pool,funPool)
			const ts=[]
			let fg=i
			while(true){
				const vr=contentRule(value,fg)
				if(vr instanceof LocError){
					break
				}
				ts.push(vr.value)
				fg=vr.end
			}
			return new ParseSuccess(i,rule.get(ts),fg)
		}
	}else if(rule instanceof GetAnd){
		const vs=rule.vs
		const max=vs.length-1
		const get=vs.getLast()
		return function(value,i){
			const begin=i
			const all=[]
			for(let x=0;x<max;x++){
				if(x%2==0){
					//偶数
					const tmpV=parse(vs[x],funPool)
					const tp=tmpV(value,i) as ParserFail<V>
					if(parseFail(tp)){
						return new LocError(i,rule,tp)
					}
					i=tp
				}else{
					//奇数
					const tmpV=parseGet(vs[x],pool,funPool)
					const tp=tmpV(value,i)
					if(tp instanceof LocError){
						return new LocError(i,rule,tp)
					}
					i=tp.end
					all.push(tp.value)
				}
			}
			return new ParseSuccess(begin,get.apply(null,all) as T,i)
		}
	}else if(rule instanceof GetOr){
		return function(value,i){
			for(let g of rule.rules){
				const o=parseGet(g,pool,funPool)(value,i)
				if(o instanceof ParseSuccess){
					return o
				}
			}
			return new LocError(i,rule,"未匹配任一表达式")
		}
	}
}
export function parseGet<V,T>(
	_rule:UGet<V,T>,
	pool:Map<PGet<V,T>,ParserGet<V,T>>=new Map(),
	funPool:Map<BaseRule<V>,ParserFun<V>>=new Map()
):ParserGet<V,T>{
	const rule=isDelayPGet(_rule)?_rule():_rule
	const existRule=pool.get(rule)
	if(existRule){
		return existRule
	}else{
		const newRule=pureParseGet(rule,pool,funPool)
		pool.set(rule,newRule)
		return newRule
	}
}

/////////////////////////////字符串进行封装//////////////////////////////////////////////

class BetweenRule{
	constructor(
		public readonly begin:number,
		public readonly end:number
	){}

	toString(){
		return `(between '${String.fromCharCode(this.begin)}' '${String.fromCharCode(this.end)}')`
	}
}
export function between(begin:string,end:string){
	if(begin && begin.length==1 && end && end.length==1){
		const bc=begin.charCodeAt(0)
		const ec=end.charCodeAt(0)
		if(bc < ec){
			return new BetweenRule(bc,ec)
		}
		throw `区间大小相反${begin} - ${end}`
	}
	throw `不合法的${begin} - ${end}`
}
type StringCharRule=string|BetweenRule
function stringToChar(v:StringCharRule){
	if(v instanceof BetweenRule){
		return v
	}
	if(v && v.length==1){
		return v.charCodeAt(0)
	}
	throw `不是合法的字符格式${v}`
}
export function rangeOf(..._rules:StringCharRule[]):Match<string>{
	const rules=_rules.map(stringToChar)
	return Match.of(function(vs,i){
		if(i<vs.size()){
			const v=vs.get(i)
			const c=v.charCodeAt(0)
			for(const r of rules){
				if(r instanceof BetweenRule){
					if(r.begin <= c && c <=r.end){
						return i+1
					}
				}else
				if(r==c){
					return i+1
				}
			}
			return `未匹配任一规则${_rules}`
		}
		return `到达文件结尾`
	})
}
export function rangeNotOf(..._rules:StringCharRule[]):Match<string>{
	const rules=_rules.map(stringToChar)
	return Match.of(function(vs,i){
		if(i<vs.size()){
			const v=vs.get(i)
			const c=v.charCodeAt(0)
			for(const r of rules){
				if(r instanceof BetweenRule){
					if(r.begin <= c && c <=r.end){
						return `在区间[${String.fromCharCode(r.begin)}-${String.fromCharCode(r.end)}]`
					}
				}else
				if(r==c){
					return `匹配了规则${String.fromCharCode(r)}`
				}
			}
			return i+1
		}
		return `到达文件结尾`
	})
}
export function stringMatch(xs:string):Match<string>{
	return Match.of(function(vs,i){
		if(i+xs.length<vs.size()+1){		
			for(let k=0;k<xs.length;k++){
				if(xs[k]==vs.get(i)){
					i++
				}else{
					return `未匹配规则${xs}`
				}
			}
			return i
		}
		return `超出文件结尾`
	})
}
///////////////////////////////////////////////////////////////////////
export function getValue<V>(v:BaseListReadArray<V>,begin:number,end:number){
	return v.slice(begin,end)
}
export interface Token<V>{
	begin:number
	value:BaseListReadArray<V>
	end:number
}
export function getValueLocation<V>(v:BaseListReadArray<V>,begin:number,end:number):Token<V>{
	return {
		begin,
		value:v.slice(begin,end),
		end
	}
}
export function getValueThen<V,T>(fun:(v:BaseListReadArray<V>)=>T){
	return function(v:BaseListReadArray<V>,begin:number,end:number){
		return fun(getValue(v,begin,end))
	}
}
export function transparent<V>(x:V){return x}

/////////////////////////////////////////////////////////////
/**空白字符 */
export const wsChars=" \t\n\r".split("")
/**空白字符串的匹配枚举 */
export const rangeWSChars=rangeOf(...wsChars)
const digitMore=many(rangeOf(between('0','9')))
/**
 * 解析js的number类型
 */
export const parseJSFloat=and(
	zeroOrOne(stringMatch("-")),
	//整数部分
	or(stringMatch('0'),
		and(
			rangeOf(between('1','9')),
			digitMore
		)
	),
	//小数部分
	zeroOrOne(and(stringMatch('.'),digitMore)),
	//科学计数部分
	zeroOrOne(
		and(
			rangeOf('e','E'),
			zeroOrOne(or(stringMatch('-'),stringMatch('+'))),
			digitMore
		)
	)
)
/**
 * 简单的字符串匹配获取（所有原始内容），
 * 可用于字符串、注释
 * @param split 
 */
export const buildSliceString=function(split:string,hasEof?:boolean){
	if(split.length!=2){
		throw `需要的分割符为2`
	}
	const left=split[0]
	const right=split[1]
	const pCommentChar=or(stringMatch('\\\\'),stringMatch(`\\${right}`),rangeNotOf(`${right}`))
	if(hasEof){
		return and(stringMatch(left),many(pCommentChar),stringMatch(right))
	}else{
		return and(
			stringMatch(left),many(pCommentChar),or(stringMatch(right),eof)
		)
	}
}
/**
 * 生成字符串的组合子，获取字符串内容
 * @param split 只能为两位，左边右边
 */
export const buildParseString=function(split:string){
	if(split.length!=2){
		throw `需要的分割符为2`
	}
	const left=split[0]
	const right=split[1]
	return getAnd(
		stringMatch(left),
		getMany(
			getOr(
				get(stringMatch('\\\\'),()=>"\\"),
				get(stringMatch(`\\${right}`),()=>right),
				get(rangeNotOf(`${right}`),getValue)
			),transparent
		),
		stringMatch(right),function(vs){
			return vs.join("")
		}
	)
}