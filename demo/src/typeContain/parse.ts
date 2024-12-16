import { buildInfix, InfixConfig, InfixToken, matchBetween, matchCommonExt, matchSymbolOrSpecial, ruleGetNumber, ruleGetString, skipWhiteOrComment, specialMatch } from "wy-helper/infixLang"
import { andMatch, isChinese, isLowerEnglish, isUpperEnglish, or, orMatch, parseGet, Que } from "wy-helper/tokenParser"
export interface Token {
  begin: number;
  end: number;
  messages: Message[];
}
export type Message = {
  type: "error" | "type"
  value: string
}
export interface StringToken extends Token {
  type: "string";
  originalValue: string;
  value: string;
}
export interface SymbolToken extends Token {
  type: "symbol";
  value: string;
}
export interface NumberToken extends Token {
  type: "number";
  value: number;
  originalValue: string;
}

export type NNode = StringToken | SymbolToken | NumberToken;
export const symbolRule = andMatch(
  orMatch(
    isLowerEnglish.matchCharBetween(),
    isUpperEnglish.matchCharBetween(),
    isChinese.matchCharBetween(),
  ),
  matchCommonExt
)
export function ruleGetSymbol() {
  return parseGet<Que, SymbolToken>(symbolRule, function (begin, end) {
    const value = begin.content.slice(begin.i, end.i)
    return {
      type: "symbol",
      begin: begin.i,
      end: end.i,
      value,
      messages: []
    } as SymbolToken
  }, 'symbol')
}
function rGetNumber() {
  const n = ruleGetNumber() as NumberToken
  n.messages = []
  return n
}

function rGetStr() {
  const n = ruleGetString() as StringToken
  n.messages = []
  return n
}
export const infixLibArray: InfixConfig[] = [
  ['in', 'where'],
  [','],
  ['='],//绑定引用,这里只是泛型的实例化
  [matchBetween, specialMatch, matchSymbolOrSpecial]
]
export type InfixNode<T> = {
  type: "infix";
  infix: InfixToken;
  left: InfixEndNode<T>;
  right: InfixEndNode<T>;
  messages: Message[]
}

export type InfixEndNode<T> = T | InfixNode<T>;
export type EndNode = NNode | InfixNode<NNode>
export const { parseSentence, getInfixOrder } = buildInfix<EndNode>(infixLibArray,
  skipWhiteOrComment,
  () => {
    return or([
      rGetStr,
      ruleGetSymbol,
      rGetNumber,
    ])
  },
  (infix, left, right) => {
    return {
      type: "infix",
      infix,
      left,
      right,
      messages: []
    } as const
  }
)


/*
in子句
xxx=aaa,
bbb=ddd,
xss=ccc
in bbb


声明一个类型,属于A类型,但又是一个变量
x<A
声明一个类型,是A的上界类型
x>A


构造object
x:99,
y:ass,
dvd:ddd 


xcvd->dss
vdss->ss
*/