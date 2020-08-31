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
};

const tests = [
    { str: "(showMenu || isFirst) && (showLatest || that)", assert: (state.showMenu || state.isFirst) && (state.showLatest || state.that) },
    { str: "(showMenu || isFirst) || (!showLatest || that)", assert: (state.showMenu || state.isFirst) || (!state.showLatest || state.that) },
    { str: "(showMenu || isFirst) || (!zero && that)", assert: (state.showMenu || state.isFirst) || (!state.zero && state.that) },
    { str: "(!showMenu && !isFirst) && (showLatest || that)", assert: (!state.showMenu && !state.isFirst) && (state.showLatest || state.that) },
    { str: "showMenu || isFirst && showLatest || that", assert: state.showMenu || state.isFirst && state.showLatest || state.that },
    { str: "showLatest && huhu && !isFirst", assert: state.showLatest && state.huhu && !state.isFirst },
    { str: "(showMenu || (showLatest || huhu)) || isFirst", assert: (state.showMenu || (state.showLatest || state.huhu)) || state.isFirst },
    { str: "isFirst || (showMenu || (that && (huhu || isFirst)))", assert: state.isFirst || (state.showMenu || (state.that && (state.huhu || state.isFirst))) },
    { str: "three !== threeb && two !== three", assert: state.three !== state.threeb && state.two !== state.three },
    { str: "two !== threeb && threeb === three", assert: state.two !== state.threeb && state.threeb === state.three },
    { str: "(two !== threeb && threeb !== three) || yes === yes2", assert: (state.two !== state.threeb && state.threeb !== state.three) || state.yes === state.yes2 },
    { str: "(two !== threeb && threeb !== three) || yes === yes2 && that && yes2", assert: (state.two !== state.threeb && state.threeb !== state.three) || state.yes === state.yes2 && state.that && state.yes2 }, // realisticaly outputs "yes", a truthly value
    { str: "n1 && yes && yes2 && huhu && maybe && (empty || !!!zero)", assert: state.n1 && state.yes && state.yes2 && state.huhu && state.maybe && (state.empty || !state.zero) },
    { str: "!!three === !!zero", assert: false },
    { str: "(maybe === maybe2 && !zero !== !empty || yes && n1 === two) || zero", assert: (state.maybe === state.maybe2 && !state.zero !== !state.empty || state.yes && state.n1 === state.two) || state.zero },
];

/// package ///
const innerMostRegex = /\(([^()]*)\)/g;
const notNumberRegex = /!+/g;
const AND = "&&";
const OR = "||";
const NOT = "!";
const EQUAL = "===";
const NOT_EQUAL = "!==";

const getVal = (obj, path) => {
    const notMatches = (path.match(notNumberRegex) || []).join();
    const res = resolvePath(obj, path.trim().replace(notMatches, ""));
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
                  let res = getVal(state, cond);
                  if (cond.includes(EQUAL)) {
                      const [r1, r2] = splitTrim(cond, EQUAL).map((path) => getVal(state, path));
                      res = r1 === r2;
                  } else if (cond.includes(NOT_EQUAL)) {
                      const [r1, r2] = splitTrim(cond, NOT_EQUAL).map((path) => getVal(state, path));
                      res = r1 !== r2;
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

tester(1, tests);
