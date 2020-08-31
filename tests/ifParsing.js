const resolvePath = (obj, path, separator = ".") => {
    return (
        path
            .trim()
            .split(separator)
            .reduce((prev, curr) => prev && prev[curr], obj) || false
    );
};

const splitTrim = (string, separator) => {
    return string.split(separator).map((e) => e.trim());
};

const indexOfRegex = (arr, regex, last = false) => {
    let res;
    for (let u = 0; u < arr.length; u++) {
        if (regex.test(arr[u])) {
            res = u;
            if (!last) break;
        }
    }
    return res;
};

const state = {
    that: true,
    huhu: true,
    showMenu: false,
    showLatest: true,
    isFirst: false,
    three: 3,
    threeb: 3,
    two: 2,
    yes: "yes",
    no: "no",
    maybe: "maybe",
    maybe2: "maybe",
    yes2: "yes",
    n1: 1 + 1,
    empty: "",
    zero: 0,
    dot5: 1.5,
};

("two + 1 + 'string'");
/*
    types would be :
    var
    number
    string

    operators:
    +
    -
    *
    /
    %
    **
*/
const tests = [
    {
        str: "(showMenu || isFirst) && (showLatest || that)",
        assert: (state.showMenu || state.isFirst) && (state.showLatest || state.that),
    },
    {
        str: "n1 >= two && no > yes",
        assert: state.n1 >= state.two && state.no > state.yes,
    },
    {
        str: "(showMenu || isFirst) || (!showLatest || that)",
        assert: state.showMenu || state.isFirst || !state.showLatest || state.that,
    },
    {
        str: "(showMenu || isFirst) || (!zero && that)",
        assert: state.showMenu || state.isFirst || (!state.zero && state.that),
    },
    {
        str: "(!showMenu && !isFirst) && (showLatest || that)",
        assert: !state.showMenu && !state.isFirst && (state.showLatest || state.that),
    },
    {
        str: "showMenu || isFirst && showLatest || that",
        assert: state.showMenu || (state.isFirst && state.showLatest) || state.that,
    },
    { str: "showLatest && huhu && !isFirst", assert: state.showLatest && state.huhu && !state.isFirst },
    {
        str: "(showMenu || (showLatest || huhu)) || isFirst",
        assert: state.showMenu || state.showLatest || state.huhu || state.isFirst,
    },
    {
        str: "isFirst || (showMenu || (that && (huhu || isFirst)))",
        assert: state.isFirst || state.showMenu || (state.that && (state.huhu || state.isFirst)),
    },
    { str: "three !== threeb && two !== three", assert: state.three !== state.threeb && state.two !== state.three },
    { str: "two !== threeb && threeb === three", assert: state.two !== state.threeb && state.threeb === state.three },
    {
        str: "(two !== threeb && threeb !== three) || yes === yes2",
        assert: (state.two !== state.threeb && state.threeb !== state.three) || state.yes === state.yes2,
    },
    {
        str: "(two !== threeb && threeb !== three) || yes === yes2 && that && yes2",
        assert:
            (state.two !== state.threeb && state.threeb !== state.three) ||
            (state.yes === state.yes2 && state.that && state.yes2),
    }, // realisticaly outputs "yes", a truthly value
    {
        str: "n1 && yes && yes2 && huhu && maybe && (empty || !!!zero)",
        assert: state.n1 && state.yes && state.yes2 && state.huhu && state.maybe && (state.empty || !state.zero),
    },
    { str: "!!three === !!zero", assert: !!state.three === !!state.zero },
    {
        str: "(maybe === maybe2 && !zero !== !empty || yes && n1 === two) || zero",
        assert:
            (state.maybe === state.maybe2 && !state.zero !== !state.empty) ||
            (state.yes && state.n1 === state.two) ||
            state.zero,
    },
];

const tests2 = [{ str: "1 + 1 * 1 * 2 - 1 === 2", assert: true }];

/// package ///
const innerMostRegex = /\(([^()]*)\)/g;
const notNumberRegex = /!+/g;
const AND = "&&";
const OR = "||";
const NOT = "!";
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
const EXP = "**";
const MODULO = "%";
const comparisonRegexp = new RegExp(`(${EQUAL}|${NOT_EQUAL}|${MORE}|${LESS}|${MORE_OR_EQUAL}|${LESS_OR_EQUAL})`);
const arithmeticRegexp = /([+|\-|*|\/|**|%])/;
const arithmeticPriorityRegexp = /([*|\/|**|%])/;
const stringRegexp = /(['])((\\{2})*|(.*?[^\\](\\{2})*))\1/;
const numberRegexp = /^-?\d+\.?\d*$/;

const getVal = (obj, exp) => {
    let split = splitTrim(exp, arithmeticRegexp);
    console.log(split)
    const values = split.filter((e) => !arithmeticRegexp.test(e));
    let operators = split.filter((e) => arithmeticRegexp.test(e));
    split.forEach((v, i, a) => {
        if (numberRegexp.test(v)) {
            a[i] = parseFloat(v);
        }
        if (!numberRegexp.test(v) && !stringRegexp.test(v) && !arithmeticRegexp.test(v)) {
            console.log("AAAAA", v)
            a[i] = resolvePath(state, v);
        }
    });
    let nextOp = indexOfRegex(split, arithmeticPriorityRegexp, true);
    if (!nextOp) {
        nextOp = indexOfRegex(split, arithmeticRegexp, true);
    }
    console.log(split);
    while (nextOp) {
        let res;
        const [n1, op, n2] = [split[nextOp - 1], split[nextOp], split[nextOp + 1]];
        console.log(n1, n2);
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
            case EXP:
                res = n1 ** n2;
                break;
            case MODULO:
                res = n1 % n2;
                break;
        }
        split.splice(nextOp - 1, 3, res);
        //split.push(res)
        nextOp = indexOfRegex(split, arithmeticPriorityRegexp, true);
        if (!nextOp) {
            nextOp = indexOfRegex(split, arithmeticRegexp, true);
        }
        // console.log(split)
    }

    console.log("lastsplit", split);
    const notMatches = (exp.match(notNumberRegex) || []).join();
    //const res = resolvePath(obj, exp.trim().replace(notMatches, ""));
    const res = split[0];
    return notMatches.length % 2 === 0 ? res : !res;
};

// takes none scoped if statement as string and outputs a bool result
const ifParser = (str) => {
    const groups = splitTrim(str, OR).map((s) => splitTrim(s, AND));
    return groups.reduce((or, group) => {
        return or
            ? or
            : group.reduce((and, cond) => {
                  if (cond === "true") return and === true;
                  let res;
                  const symbolMatch = cond.match(comparisonRegexp)?.[0];
                  if (!symbolMatch) res = getVal(state, cond);
                  const [r1, r2] = splitTrim(cond, symbolMatch).map((path) => getVal(state, path));
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
};

// takes a scoped (or not) if statement as string, matches it's innerMost () and process them one after the other with ifParser
// outpouting final result;
const scopedParser = (str) => {
    let innerStatements = [...str.matchAll(innerMostRegex)];
    while (innerStatements.length > 0) {
        innerStatements.forEach((regObj) => {
            str = str.replace(regObj[0], ifParser(regObj[1]));
        });
        innerStatements = [...str.matchAll(innerMostRegex)];
    }
    return ifParser(str);
};

/// tests ///
const tester = (times, tests) => {
    let time1 = Date.now();
    let goodCount = 0;
    for (let u = 0; u < times; u++) {
        tests.forEach((test, index) => {
            if (!!test.assert === !!scopedParser(test.str)) {
                goodCount++;
            } else {
                console.log("---shit---");
                console.log(`test ${index} failed, ${!!scopedParser(test.str)}`);
                console.log("----------");
            }
        });
    }
    console.log(`tests done ${goodCount}/${tests.length * times} in ${Date.now() - time1} ms`);
};

tester(1, tests2);
