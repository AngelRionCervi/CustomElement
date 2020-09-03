import * as _H from "./helpers.js";

const AND = "&&";
const OR = "||";
const EQUAL = "===";
const NOT_EQUAL = "!==";
const MORE = ">";
const LESS = "<";
const MORE_OR_EQUAL = ">=";
const LESS_OR_EQUAL = "<=";
const PLUS = "+";
const MINUS = "-";
const MULT = "*";
const DIV = "/";
const MODULO = "%";
const innerExpBlockRegex = /\(([^()]*)\)/g;
const notRegex = /!+/g;
const comparisonRegexp = new RegExp(`(${EQUAL}|${NOT_EQUAL}|${MORE}|${LESS}|${MORE_OR_EQUAL}|${LESS_OR_EQUAL})`);
const arSplitRegex = /(\d[^*\/%+-]*[*\/%+-])/g;
const arOpMatchRegex = /([+\-*\/%])/;
const arOpPrioMatchRegex = /([*\/%])/;
const stringRegexp = /(['])((\\{2})*|(.*?[^\\](\\{2})*))\1/;
const numberRegexp = /^-?\d+\.?\d*$/;
const dashRegex = /\-/g;
const digitRegex = /([0-9]*[.])?[0-9]+/;

const splitTrimExp = (string, separator) => {
    return string
        .split(separator)
        .map((m, i, a) => (i % 2 ? m[m.length - 1] : m + (a[i + 1] || "").slice(0, -1)))
        .map((e) => e.trim());
};

const indexOfRegex = (arr, regex, last = false) => {
    let res;
    for (let u = 0; u < arr.length; u++) {
        if (arr[u].toString().length > 1) continue; // avoid matching with negative numbers...
        if (regex.test(arr[u])) {
            res = u;
            if (!last) break;
        }
    }
    return res;
};

const computeNumber = (str) => {
    const matches = str.match(dashRegex) || [];
    const number = str.match(digitRegex)[0];
    return matches.length % 2 === 0 ? parseFloat(number) : parseFloat(`-${number}`);
};

export default (state) => {
    return {
        computeExp(exp) {
            const getNextOp = (split) => {
                let nextOp = indexOfRegex(split, arOpPrioMatchRegex); // *, /, %
                if (!nextOp) {
                    nextOp = indexOfRegex(split, arOpMatchRegex); // +, -
                }
                return nextOp;
            };
            let split = splitTrimExp(exp, arSplitRegex);
            // convert the string into ar expression
            split.forEach((v, i, a) => {
                if (v === "true") {
                    a[i] = true;
                } else if (!numberRegexp.test(v) && !stringRegexp.test(v) && !arOpMatchRegex.test(v)) {
                    a[i] = _H.resolvePath(state, _H.replaceAll(v, "!", ""));
                } else {
                    if (!numberRegexp.test(v) && /\d/.test(v)) {
                        a[i] = computeNumber(v);
                    }
                    if (numberRegexp.test(v)) {
                        a[i] = parseFloat(v);
                    } else if (stringRegexp.test(v)) {
                        a[i] = _H.replaceAll(v, "'", "");
                    }
                }
            });
            // compute that expression
            let nextOp = getNextOp(split);
            while (nextOp) {
                let res;
                const [n1, op, n2] = [split[nextOp - 1], split[nextOp], split[nextOp + 1]];
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
            const notMatches = (exp.match(notRegex) || []).join();
            const res = split[0];
            return notMatches.length % 2 === 0 ? res : !res;
        },
        // takes none scoped if statement as string and outputs a bool result
        computeBlock(str) {
            return _H.splitTrim(str, OR).map((s) => _H.splitTrim(s, AND)).reduce((or, group) => {
                return or
                    ? or
                    : group.reduce((and, cond) => {
                          let res;
                          const symbolMatch = cond.match(comparisonRegexp)?.[0];
                          if (!symbolMatch) res = this.computeExp(cond);
                          const [r1, r2] = _H.splitTrim(cond, symbolMatch).map((c) => this.computeExp(c));
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
        // takes a scoped (or not) if statement as string, matches it's blocks () and processes them one after the other;
        // outpouting final result;
        parse(str) {
            let innerStatements = [...str.matchAll(innerExpBlockRegex)];
            while (innerStatements.length > 0) {
                innerStatements.forEach((regObj) => {
                    str = str.replace(regObj[0], this.computeBlock(regObj[1]));
                });
                innerStatements = [...str.matchAll(innerExpBlockRegex)];
            }
            return this.computeBlock(str);
        }
    }
}


