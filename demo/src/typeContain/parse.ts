import { buildInfix, EndNode, InfixConfig, matchBetween, matchCommonExt, matchSymbolOrSpecial, ruleGetNumber, ruleGetString, skipWhiteOrComment, specialMatch } from "wy-helper/infixLang"
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
  ['in'],
  [','],
  ['='],
  [matchBetween, specialMatch, matchSymbolOrSpecial]
]
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
    }
  }
)
