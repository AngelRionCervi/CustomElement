const resolvePath = (obj, path, separator = ".") => {
    return (
        path
            .trim()
            .split(separator)
            .reduce((prev, curr) => prev && prev[curr], obj)
    );
};

const splitTrim = (string, separator) => {
    return string.split(separator).map((e) => e.trim());
};

const replaceAll = (str, find, replace) => {
    return str.replace(new RegExp(find, "g"), replace);
};
//console.log(-1 - 987 * 5 * 23 / 5 * 2.5)
//console.log("hh", "- 5.0 + 9.34 - 6.0 * - 2.1 * 3.1 - - 2.0".split(/(\d[^*\/+-]*([*\/+-]))/g));

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
    height: 8,
    fhDOTh: 58.8,
    n39smth: 39.99915629251701,
};

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
        assert: (state.two !== state.threeb && state.threeb !== state.three) || (state.yes === state.yes2 && state.that && state.yes2),
    }, // realisticaly outputs "yes", a truthly value
    {
        str: "n1 && yes && yes2 && huhu && maybe && (empty || !!!zero)",
        assert: state.n1 && state.yes && state.yes2 && state.huhu && state.maybe && (state.empty || !!!state.zero),
    },
    { str: "!!three === !!zero", assert: !!state.three === !!state.zero },
    {
        str: "(maybe === maybe2 && !zero !== !empty || yes && n1 === two) || zero",
        assert: (state.maybe === state.maybe2 && !state.zero !== !state.empty) || (state.yes && state.n1 === state.two) || state.zero,
    },
    { str: "1 + 1 === 2", assert: 1 + 1 === 2 },
    { str: "987 * 5 * 23 / 5 === 22701", assert: (987 * 5 * 23) / 5 === 22701 },
    { str: "2.5 * 2 === 5", assert: 2.5 * 2 === 5 },
    { str: "1 - 987 * 5 * 23 / 5 * 2.5 === -56751.5", assert: 1 - ((987 * 5 * 23) / 5) * 2.5 === -56751.5 },
    { str: "-1-1 === -2", assert: -1 - 1 === -2 },
    { str: "-1-1---1*3===-5", assert: -1 - 1 - -(-1) * 3 === -5 },
    { str: "- - (1 + 1) * 4 === 8", assert: -(-(1 + 1)) * 4 === 8 },
    { str: "5 * 9 - 5 / (98 * (-8)) *8.2 / 75 * 1.21 -5 === 40.00084370748299", assert: 5 * 9 - (((5 / (98 * -8)) * 8.2) / 75) * 1.21 - 5 === 40.00084370748299 },
    {
        str: "5 * 9 - - 5 / (98 * (-8)) * -8.2 / -75 * 1.21 + 6 - - - - - - - -5 === 55.99915629251701",
        assert: 5 * 9 - (((-5 / (98 * -8)) * -8.2) / -75) * 1.21 + 6 - -(-(-(-(-(-(-5)))))) === 55.99915629251701,
    },
    { str: "145 + 8 < 895*(8/4.21) && 5 * 4 - (-5) !== two", assert: 145 + 8 < 895 * (8 / 4.21) && 5 * 4 - -5 !== state.two },
    { str: "2 % 5 === 2", assert: 2 % 5 === 2 },
    { str: "undefined === smttttttt", assert: true },
    { str: "null === null", assert: true },
    { str: "false !== !undefined", assert: true },
    { str: "!(false !== !undefined)", assert: false },
];

/// package ///
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
const NULL = "null";
const gloablProps = [TRUE, FALSE, UNDEFINED, NULL];
const NOT = "!";
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
        if (arr[u]?.toString().length > 1) continue; // avoid matching with negative numbers...
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

const computeExp = (obj, exp) => {
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
        if (gloablProps.includes(replaceAll(v, NOT, ""))) {
            const type = gloablProps.find((e) => e === replaceAll(v, NOT, ""));
            switch (type) {
                case FALSE:
                    a[i] = false;
                    break;
                case TRUE:
                    a[i] = true;
                    break;
                case NULL:
                    a[i] = null;
                    break;
                case UNDEFINED:
                    a[i] = undefined;
                    break;
            }
        } else if (!numberRegexp.test(v) && !stringRegexp.test(v) && !arOpMatchRegex.test(v)) {
            a[i] = resolvePath(obj, replaceAll(v, NOT, ""));
        } else {
            if (!numberRegexp.test(v) && /\d/.test(v)) {
                a[i] = computeNumber(v);
            }
            if (numberRegexp.test(v)) {
                a[i] = parseFloat(v);
            } else if (stringRegexp.test(v)) {
                a[i] = replaceAll(v, "'", "");
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
};
// takes none scoped if statement as string and outputs a bool result
const computeBlock = (str) => {
    return splitTrim(str, OR)
        .map((s) => splitTrim(s, AND))
        .reduce((or, group) => {
            return or
                ? or
                : group.reduce((and, cond) => {
                      let res;
                      const symbolMatch = cond.match(comparisonRegexp)?.[0];
                      if (!symbolMatch) res = computeExp(state, cond);
                      const [r1, r2] = splitTrim(cond, symbolMatch).map((path) => computeExp(state, path));
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
};
// takes a scoped (or not) if statement as string, matches it's blocks () and processes them one after the other;
// outpouting final result;
const parse = (str) => {
    let innerStatements = [...str.matchAll(innerExpBlockRegex)];
    while (innerStatements.length > 0) {
        innerStatements.forEach((regObj) => {
            str = str.replace(regObj[0], computeBlock(regObj[1]));
        });
        innerStatements = [...str.matchAll(innerExpBlockRegex)];
    }
    return computeBlock(str);
};

/// tests ///
const tester = (times, tests) => {
    let time1 = Date.now();
    let goodCount = 0;
    for (let u = 0; u < times; u++) {
        tests.forEach((test, index) => {
            if (!!test.assert === !!parse(test.str)) {
                goodCount++;
            } else {
                console.log("---shit---");
                console.log(`test ${index} failed, ${!!parse(test.str)} - ${test.assert}`);
                console.log("----------");
            }
        });
    }
    console.log(`tests done ${goodCount}/${tests.length * times} in ${Date.now() - time1} ms`);
};

tester(1, tests);
