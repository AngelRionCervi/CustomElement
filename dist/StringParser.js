var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
define(["require", "exports", "./helpers.js"], function (require, exports, _H) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getKeysUsed = void 0;
    _H = __importStar(_H);
    var AND = "&&";
    var OR = "||";
    var EQUAL = "===";
    var NOT_EQUAL = "!==";
    var MORE = ">";
    var LESS = "<";
    var MORE_OR_EQUAL = ">=";
    var LESS_OR_EQUAL = "<=";
    var PLUS = "+";
    var MINUS = "-";
    var MULT = "*";
    var DIV = "/";
    var MODULO = "%";
    var TRUE = "true";
    var FALSE = "false";
    var UNDEFINED = "undefined";
    var IN = "in";
    var NULL = "null";
    var globalPrims = [TRUE, FALSE, UNDEFINED, NULL];
    var NOT = "!";
    var stringDelimiter = "'";
    var innerExpBlockRegex = /\(([^()]*)\)/g;
    var notRegex = /!+/g;
    var comparisonRegexp = new RegExp("(" + EQUAL + "|" + NOT_EQUAL + "|" + MORE + "|" + LESS + "|" + MORE_OR_EQUAL + "|" + LESS_OR_EQUAL + ")"); // DOESN'T WORK FOR MORE_OR_EQUAL AND LESS_OR_EQUAL
    var arSplitRegex = /(\d[^*\/%+-]*[*\/%+-])/g;
    var arOpMatchRegex = /([+\-*\/%])/;
    var fullArRegex = /([+\-*\/%=<>&|])/;
    var arOpPrioMatchRegex = /([*\/%])/;
    var stringRegexp = /(['])((\\{2})*|(.*?[^\\](\\{2})*))\1/;
    var numberRegexp = /^-?\d+\.?\d*$/;
    var dashRegex = /\-/g;
    var digitRegex = /([0-9]*[.])?[0-9]+/;
    var indexOfRegex = function (arr, regex, last) {
        if (last === void 0) { last = false; }
        var res;
        for (var u = 0; u < arr.length; u++) {
            if (arr[u] && arr[u].toString().length > 1)
                continue; // avoid matching with negative numbers...
            if (regex.test(arr[u])) {
                res = u;
                if (!last)
                    break;
            }
        }
        return res;
    };
    var computeNumber = function (str) {
        var matches = str.match(dashRegex) || [];
        var match = str.match(digitRegex);
        if (match === null)
            return 0;
        var number = match[0];
        return matches.length % 2 === 0 ? parseFloat(number) : parseFloat("-" + number);
    };
    exports.getKeysUsed = function (str) {
        if (!str)
            return [];
        var isVar = function (str) { return !numberRegexp.test(str) && !stringRegexp.test(str) && !fullArRegex.test(str); };
        var isLoop = function (str) { return str.includes(IN); };
        var keys = [];
        _H.splitTrim(str, fullArRegex).forEach(function (val) {
            if (isLoop(val))
                keys.push(_H.splitTrim(val, IN).pop() || "");
            else if (isVar(val))
                keys.push(val);
        });
        return keys;
    };
    exports.default = (function (_state) {
        return {
            getPrimFromSplit: function (split) {
                var _this = this;
                return split.reduce(function (acc, str) {
                    var exp = _this.computeExp(str);
                    return __spread(acc, [exp]);
                }, []);
            },
            computeExp: function (exp) {
                var getNextOp = function (split) {
                    var nextOp = indexOfRegex(split, arOpPrioMatchRegex); // *, /, %
                    if (!nextOp) {
                        nextOp = indexOfRegex(split, arOpMatchRegex); // +, -
                    }
                    return nextOp;
                };
                var isVar = function (str) {
                    return !numberRegexp.test(str) && !stringRegexp.test(str) && !arOpMatchRegex.test(str);
                };
                var isBoolified = function (str) { return (str.match(notRegex) || []).join().length % 2 !== 0; };
                var split = _H.splitTrim(exp, arOpMatchRegex);
                var _loop_1 = function (u) {
                    // first detect and convert state vars -> use this.getPrimFromStrArr()
                    var nakedExp = _H.replaceAll(split[u], NOT, "");
                    var res_1 = split[u];
                    if (isVar(nakedExp) && !globalPrims.includes(_H.replaceAll(split[u], NOT, ""))) {
                        var varVal = _H.resolvePath(_state, nakedExp);
                        res_1 = ((isBoolified(split[u]) ? !varVal : varVal) || false).toString();
                    }
                    split[u] = res_1;
                    // second translate strings to js values
                    if (globalPrims.includes(_H.replaceAll(split[u], NOT, ""))) {
                        var type = globalPrims.find(function (e) { return e === _H.replaceAll(split[u], NOT, ""); });
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
                    }
                    else {
                        if (!numberRegexp.test(split[u]) && /\d/.test(split[u])) {
                            split[u] = computeNumber(split[u]);
                        }
                        if (numberRegexp.test(split[u])) {
                            split[u] = parseFloat(split[u]);
                        }
                        else if (stringRegexp.test(split[u])) {
                            split[u] = _H.replaceAll(split[u], stringDelimiter, "");
                        }
                    }
                };
                for (var u = 0; u < split.length; u++) {
                    _loop_1(u);
                }
                // compute that expression
                var nextOp = getNextOp(split);
                while (nextOp) {
                    var res_2 = void 0;
                    var _a = __read([split[nextOp - 1], split[nextOp], split[nextOp + 1]], 3), n1 = _a[0], op = _a[1], n2 = _a[2];
                    switch (op) {
                        case PLUS:
                            res_2 = n1 + n2;
                            break;
                        case MINUS:
                            res_2 = n1 - n2;
                            break;
                        case MULT:
                            res_2 = n1 * n2;
                            break;
                        case DIV:
                            res_2 = n1 / n2;
                            break;
                        case MODULO:
                            res_2 = n1 % n2;
                            break;
                    }
                    split.splice(nextOp - 1, 3, res_2);
                    nextOp = getNextOp(split);
                }
                var notMatches = (exp.match(notRegex) || []).join();
                var res = notMatches.length % 2 === 0 ? split[0] : !split[0];
                return res;
            },
            computeIfBlock: function (str) {
                var _this = this;
                return _H
                    .splitTrim(str, OR)
                    .map(function (s) { return _H.splitTrim(s, AND); })
                    .reduce(function (or, group) {
                    return or
                        ? or
                        : group.reduce(function (and, cond) {
                            var _a, _b;
                            var _c;
                            var res;
                            var symbolMatch = (_c = cond.match(comparisonRegexp)) === null || _c === void 0 ? void 0 : _c[0];
                            var r1, r2;
                            if (!symbolMatch) {
                                res = _this.computeExp(cond);
                                _a = __read([false, undefined], 2), r1 = _a[0], r2 = _a[1];
                            }
                            else {
                                _b = __read(_H.splitTrim(cond, symbolMatch).map(function (c) { return _this.computeExp(c); }), 2), r1 = _b[0], r2 = _b[1];
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
            parse: function (str) {
                var _this = this;
                // takes a scoped (or not) if statement as string, matches it's blocks () and processes them one after the other;
                // outpouting final result;
                var innerStatements = __spread(str.matchAll(innerExpBlockRegex));
                while (innerStatements.length > 0) {
                    innerStatements.forEach(function (regObj) {
                        str = str.replace(regObj[0], _this.computeIfBlock(regObj[1]));
                    });
                    innerStatements = __spread(str.matchAll(innerExpBlockRegex));
                }
                return this.computeIfBlock(str);
            },
        };
    });
});
