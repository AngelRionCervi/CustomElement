function resolvePath(obj, keyString) {
    keyString = keyString.trim();
    const keys = [{ label: "", type: "field", is_array: false }];
    let current_key = 0;
    for (let i = 0; i < keyString.length; i++) {
        const c = keyString.charAt(i);
        switch (c) {
            case ".":
                current_key++;
                keys[current_key] = { label: "", type: "field", is_array: false };
                break;
            case "[":
                keys[current_key].is_array = true;
                current_key++;
                keys[current_key] = { label: "", type: "index", is_array: false };
                break;
            case "]":
                break;
            default:
                keys[current_key].label += c;
        }
    }
    let part = obj;
    for (let i = 0; i < keys.length; i++) {
        let label = keys[i].label;
        if (i == keys.length - 1) {
            return part[label];
        }
        else {
            if (part[label] === undefined) {
                return undefined;
            }
            part = part[label];
        }
    }
}
function setPath(obj, keyString, val) {
    keyString = keyString.trim();
    const keys = [{ label: "", type: "field", is_array: false }];
    let current_key = 0;
    for (let i = 0; i < keyString.length; i++) {
        const c = keyString.charAt(i);
        switch (c) {
            case ".":
                current_key++;
                keys[current_key] = { label: "", type: "field", is_array: false };
                break;
            case "[":
                keys[current_key].is_array = true;
                current_key++;
                keys[current_key] = { label: "", type: "index", is_array: false };
                break;
            case "]":
                break;
            default:
                keys[current_key].label += c;
        }
    }
    let part = obj;
    for (let i = 0; i < keys.length; i++) {
        let label = keys[i].label;
        if (i == keys.length - 1) {
            part[label] = val;
        }
        else {
            if (part[label] === undefined) {
                if (keys[i].is_array) {
                    part[label] = [];
                }
                else {
                    part[label] = {};
                }
            }
            part = part[label];
        }
    }
}

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
const TRUE = "true";
const FALSE = "false";
const UNDEFINED = "undefined";
const IN = "in";
const NULL = "null";
const globalPrims = [TRUE, FALSE, UNDEFINED, NULL];
const NOT = "!";
const stringDelimiter = "'";
const innerExpBlockRegex = /\(([^()]*)\)/g;
const notRegex = /!+/g;
const comparisonRegexp = new RegExp(
    `(${EQUAL}|${NOT_EQUAL}|${MORE}|${LESS}|${MORE_OR_EQUAL}|${LESS_OR_EQUAL})`
); // DOESN'T WORK FOR MORE_OR_EQUAL AND LESS_OR_EQUAL
const arSplitRegex = /(\d[^*\/%+-]*[*\/%+-])/g;
const arOpMatchRegex = /([+\-*\/%])/;
const fullArRegex = /([+\-*\/%=<>&|])/;
const arOpPrioMatchRegex = /([*\/%])/;
const stringRegexp = /(['])((\\{2})*|(.*?[^\\](\\{2})*))\1/;
const numberRegexp = /^-?\d+\.?\d*$/;
const dashRegex = /\-/g;
const digitRegex = /([0-9]*[.])?[0-9]+/;
const fnInvRegex = /\b\(.+?\)(?=|$)/g;

const splitTrim = (string, separator) => {
    return string.split(separator).map((e) => e.trim());
};

const indexOfRegex = (arr, regex, last = false) => {
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

const computeNumber = (str) => {
    const matches = str.match(dashRegex) || [];
    const match = str.match(digitRegex);
    if (match === null) return 0;
    const number = match[0];
    return matches.length % 2 === 0 ? parseFloat(number) : parseFloat(`-${number}`);
};

function StringParser(_state) {
    return {
        getPrimFromSplit(split) {
            return split.reduce((acc, str) => {
                const exp = this.computeExp(str);
                return [...acc, exp];
            }, []);
        },
        computeExp(exp) {
            const getNextOp = (split) => {
                let nextOp = indexOfRegex(split, arOpPrioMatchRegex); // *, /, %
                if (!nextOp) {
                    nextOp = indexOfRegex(split, arOpMatchRegex); // +, -
                }
                return nextOp;
            };
            const isVar = (str) =>
                !numberRegexp.test(str) && !stringRegexp.test(str) && !arOpMatchRegex.test(str);
            const isBoolified = (str) => (str.match(notRegex) || []).join().length % 2 !== 0;

            let split = splitTrim(exp, arOpMatchRegex);

            for (let u = 0; u < split.length; u++) {
                // first detect and convert state vars -> use this.getPrimFromStrArr()
                const nakedExp = replaceAll2(split[u], NOT, "");
                let res = split[u];
                if (isVar(nakedExp) && !globalPrims.includes(replaceAll2(split[u], NOT, ""))) {
                    
                    const varVal = resolvePath(_state, nakedExp);
                    //const varVal = resolvePath(_state, nakedExp);
                    res = ((isBoolified(split[u]) ? !varVal : varVal) || false).toString();
                }
                split[u] = res;
                // second translate strings to js values
                if (globalPrims.includes(replaceAll2(split[u], NOT, ""))) {
                    const type = globalPrims.find((e) => e === replaceAll2(split[u], NOT, ""));
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
                        split[u] = replaceAll2(split[u], stringDelimiter, "");
                    }
                }
            }
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
            const res = notMatches.length % 2 === 0 ? split[0] : !split[0];
            return res;
        },
        computeIfBlock(str) {
            return _H
                .splitTrim(str, OR)
                .map((s) => splitTrim(s, AND))
                .reduce((or, group) => {
                    return or
                        ? or
                        : group.reduce((and, cond) => {
                              let res;
                              const symbolMatch = cond.match(comparisonRegexp)?.[0];
                              let r1, r2;
                              if (!symbolMatch) {
                                  res = this.computeExp(cond);
                                  [r1, r2] = [false, undefined];
                              } else {
                                  [r1, r2] = splitTrim(cond, symbolMatch).map((c) => this.computeExp(c));
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
        parse(str) {
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

const replaceAll2 = (str, match, replacement) => {
    return [match].flat().reduce((acc, m) => {
        return acc.split(m).join(replacement);
    }, str);
};

const state = {
    n: 1,
    ties: [
        {type: "long", color: "blue"},
        {type: "short", color: "red"},
        "454545"
    ]
}

const varMatchRegex = /\{{([^\}\}]+)+\}}/g;
const arrayIndexRegex = /\[([^\}\]]+)+\]/g;
const str = `zer {{ ties[2] }}`;



const parseVar = (state, strToParse) => {

    const varMatches = [...strToParse.matchAll(varMatchRegex)];
    console.log(varMatches)
    const parser = StringParser(state);

    const resolveVar = (strVar) => {
        strVar = strVar.trim();
        const indexMatches = [...strVar.matchAll(arrayIndexRegex)];
        indexMatches.forEach((match) => {
            
            strVar = replaceAll2(strVar, match[1], parser.computeExp(match[1]));
        });
        return parser.computeExp(strVar);
    }

    varMatches.forEach((match) => {
        strToParse = replaceAll2(strToParse, match[0], resolveVar(match[1]))
    })
    return strToParse;
}


console.log(parseVar(state, str))