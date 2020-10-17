import * as _H from "./helpers.js";
import _G from "./_GLOBALS_.js";

const AND: string = "&&";
const OR: string = "||";
const EQUAL: string = "===";
const NOT_EQUAL: string = "!==";
const MORE: string = ">";
const LESS: string = "<";
const MORE_OR_EQUAL: string = ">=";
const LESS_OR_EQUAL: string = "<=";
const PLUS: string = "+";
const MINUS: string = "-";
const MULT: string = "*";
const DIV: string = "/";
const MODULO: string = "%";
const TRUE: string = "true";
const FALSE: string = "false";
const UNDEFINED: string = "undefined";
const IN: string = "in";
const NULL: string = "null";
const globalPrims: string[] = [TRUE, FALSE, UNDEFINED, NULL];
const NOT: string = "!";
const stringDelimiter: string = "'";
const innerExpBlockRegex: RegExp = /\(([^()]*)\)/g;
const notRegex: RegExp = /!+/g;
const comparisonRegexp: RegExp = new RegExp(
    `(${EQUAL}|${NOT_EQUAL}|${MORE}|${LESS}|${MORE_OR_EQUAL}|${LESS_OR_EQUAL})`
); // DOESN'T WORK FOR MORE_OR_EQUAL AND LESS_OR_EQUAL
const arSplitRegex: RegExp = /(\d[^*\/%+-]*[*\/%+-])/g;
const arOpMatchRegex: RegExp = /([+\-*\/%])/;
const fullArRegex: RegExp = /([+\-*\/%=<>&|])/;
const arOpPrioMatchRegex: RegExp = /([*\/%])/;
const stringRegexp: RegExp = /(['])((\\{2})*|(.*?[^\\](\\{2})*))\1/;
const numberRegexp: RegExp = /^-?\d+\.?\d*$/;
const dashRegex: RegExp = /\-/g;
const digitRegex: RegExp = /([0-9]*[.])?[0-9]+/;

const indexOfRegex = (arr: any[], regex: RegExp, last: boolean = false): number | undefined => {
    let res;
    for (let u = 0; u < arr.length; u++) {
        if (arr[u] && arr[u].toString().length > 1) continue; // avoid matching with negative numbers...
        if (regex.test(arr[u])) {
            res = u;
            if (!last) break;
        }
    }
    return res;
};

const computeNumber = (str: string): number => {
    const matches = str.match(dashRegex) || [];
    const match = str.match(digitRegex);
    if (match === null) return 0;
    const number = match[0];
    return matches.length % 2 === 0 ? parseFloat(number) : parseFloat(`-${number}`);
};

export const getKeysUsed = (str: string): string[] => {
    if (!str) return [];
    const isVar = (str: string): boolean => !numberRegexp.test(str) && !stringRegexp.test(str) && !fullArRegex.test(str);
    const isLoop = (str: string): boolean => str.includes(IN);
    const keys: string[] = [];
    _H.splitTrim(str, fullArRegex).forEach((val: string) => {
        if (isLoop(val)) keys.push(_H.splitTrim(val, IN).pop() || "");
        else if (isVar(val)) keys.push(val);
    });
    return keys;
};

export const parseTextContent = (state: any, vElem: vElem, str: string) : string => {
    let newStr: string = str;
    const matches: RegExpMatchArray[] = [...str.matchAll(_G.TEXT_BIND_REGEXP)];
    matches.forEach((match: RegExpMatchArray) => {
        const val = _H.getValueFromStrVar(state, vElem, match[1]);
        newStr = _H.replaceAll(newStr, match[0], val);
    })
    return newStr;
}

export default (_state: any) => {
    return {
        getPrimFromSplit(split: string[]): string[] {
            return split.reduce((acc: any[], str: string) => {
                const exp = this.computeExp(str);
                return [...acc, exp];
            }, []);
        },
        computeExp(exp: string): any {
            const getNextOp = (split: string[]): number | undefined => {
                let nextOp = indexOfRegex(split, arOpPrioMatchRegex); // *, /, %
                if (!nextOp) {
                    nextOp = indexOfRegex(split, arOpMatchRegex); // +, -
                }
                return nextOp;
            };
            const isVar = (str: string): boolean =>
                !numberRegexp.test(str) && !stringRegexp.test(str) && !arOpMatchRegex.test(str);
            const isBoolified = (str: string): boolean => (str.match(notRegex) || []).join().length % 2 !== 0;

            let split: any[] = _H.splitTrim(exp, arOpMatchRegex);

            for (let u = 0; u < split.length; u++) {
                // first detect and convert state vars -> use this.getPrimFromStrArr()
                const nakedExp: string = _H.replaceAll(split[u], NOT, "");
                let res = split[u];
                if (isVar(nakedExp) && !globalPrims.includes(_H.replaceAll(split[u], NOT, ""))) {
                    const varVal = _H.resolvePath(_state, nakedExp);
                    res = ((isBoolified(split[u]) ? !varVal : varVal) || false).toString();
                }
                split[u] = res;
                // second translate strings to js values
                if (globalPrims.includes(_H.replaceAll(split[u], NOT, ""))) {
                    const type = globalPrims.find((e: string) => e === _H.replaceAll(split[u], NOT, ""));
                    switch (type) {
                        case FALSE:
                            split[u] = false;
                            break;
                        case TRUE:
                            split[u] = true;
                            break;
                        case NULL:
                            split[u] = null;
                            break;
                        case UNDEFINED:
                            split[u] = undefined;
                            break;
                    }
                } else {
                    if (!numberRegexp.test(split[u]) && /\d/.test(split[u])) {
                        split[u] = computeNumber(split[u]);
                    }
                    if (numberRegexp.test(split[u])) {
                        split[u] = parseFloat(split[u]);
                    } else if (stringRegexp.test(split[u])) {
                        split[u] = _H.replaceAll(split[u], stringDelimiter, "");
                    }
                }
            }
            // compute that expression
            let nextOp: number | undefined = getNextOp(split);
            while (nextOp) {
                let res: any;
                const [n1, op, n2] = [split[nextOp - 1], split[nextOp], split[nextOp + 1]] as [number, string, number];
                switch (op) {
                    case PLUS:
                        res = n1 + n2;
                        break;
                    case MINUS:
                        res = n1 - n2;
                        break;
                    case MULT:
                        res = n1 * n2;
                        break;
                    case DIV:
                        res = n1 / n2;
                        break;
                    case MODULO:
                        res = n1 % n2;
                        break;
                }
                split.splice(nextOp - 1, 3, res);
                nextOp = getNextOp(split);
            }
            const notMatches: string = (exp.match(notRegex) || []).join();
            const res: any = notMatches.length % 2 === 0 ? split[0] : !split[0];
            return res;
        },
        computeIfBlock(str: string): any {
            return _H
                .splitTrim(str, OR)
                .map((s: string) => _H.splitTrim(s, AND))
                .reduce((or: boolean, group: string[]) => {
                    return or
                        ? or
                        : group.reduce((and: boolean, cond: string) => {
                              let res;
                              const symbolMatch: any = cond.match(comparisonRegexp)?.[0];
                              let r1: any, r2: any;
                              if (!symbolMatch) {
                                  res = this.computeExp(cond);
                                  [r1, r2] = [false, undefined];
                              } else {
                                  [r1, r2] = _H.splitTrim(cond, symbolMatch).map((c) => this.computeExp(c));
                              }
                              switch (symbolMatch) {
                                  case EQUAL:
                                      res = r1 === r2;
                                      break;
                                  case NOT_EQUAL:
                                      res = r1 !== r2;
                                      break;
                                  case MORE:
                                      res = r1 > r2;
                                      break;
                                  case LESS:
                                      res = r1 < r2;
                                      break;
                                  case MORE_OR_EQUAL:
                                      res = r1 >= r2;
                                      break;
                                  case LESS_OR_EQUAL:
                                      res = r1 <= r2;
                                      break;
                              }
                              return and ? res : false;
                          }, true);
                }, false);
        },
        parse(str: string): any {
            // takes a scoped (or not) if statement as string, matches it's blocks () and processes them one after the other;
            // outpouting final result;
            let innerStatements = [...str.matchAll(innerExpBlockRegex)];
            while (innerStatements.length > 0) {
                innerStatements.forEach((regObj) => {
                    str = str.replace(regObj[0], this.computeIfBlock(regObj[1]));
                });
                innerStatements = [...str.matchAll(innerExpBlockRegex)];
            }
            return this.computeIfBlock(str);
        },
    };
};
