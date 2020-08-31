import * as _H from "./helpers.js";


const AND = "&&";
const OR = "||";
const EQUAL = "===";
const NOT_EQUAL = "!==";
const MORE = ">";
const LESS = "<";
const MORE_OR_EQUAL = ">=";
const LESS_OR_EQUAL = "<=";
const comparisonRegexp = new RegExp(`(${EQUAL}|${NOT_EQUAL}|${MORE}|${LESS}|${MORE_OR_EQUAL}|${LESS_OR_EQUAL})`);
const innerMostRegex = /\(([^()]*)\)/g;
const notNumberRegex = /!+/g;

export default (state) => {
    return {
        getVal(obj, path) {
            const notMatches = (path.match(notNumberRegex) || []).join();
            const res = _H.resolvePath(obj, path.trim().replace(notMatches, ""));
            return notMatches.length % 2 === 0 ? res : !res;
        },
        compute(str) {
            const groups = _H.splitTrim(str, OR).map((s) => _H.splitTrim(s, AND));
            return groups.reduce((or, group) => {
                return or
                    ? or
                    : group.reduce((and, cond) => {
                          if (cond === "true") return and === true;
                          let res = this.getVal(state, cond);
                          
                          const symbolMatch = cond.match(comparisonRegexp)?.[0];
                          const [r1, r2] = _H.splitTrim(cond, symbolMatch).map((path) => this.getVal(state, path));
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
                          return and === !!res;
                      }, true);
            }, false);
        },
        parse(str) {
            let innerStatements = [...str.matchAll(innerMostRegex)];
            while (innerStatements.length > 0) {
                innerStatements.forEach((regObj) => {
                    str = str.replace(regObj[0], this.compute(regObj[1]));
                });
                innerStatements = [...str.matchAll(innerMostRegex)];
            }
            return this.compute(str);
        },
    };
};
