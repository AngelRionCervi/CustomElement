const innerMostRegex = /\(([^()]*)\)/g;

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
    { str: "(showMenu || isFirst) && (showLatest || that)", assert: false },
    { str: "(showMenu || isFirst) || (showLatest || that)", assert: true },
    { str: "showMenu || isFirst && showLatest || that", assert: true },
    { str: "showLatest && huhu && !isFirst", assert: true },
    { str: "(showMenu || (showLatest || huhu)) || isFirst", assert: true },
    { str: "isFirst || (showMenu || (that && (huhu || isFirst))", assert: true },
    { str: "three !== threeb && two !== three", assert: false },
    { str: "two !== threeb && threeb === three", assert: true },
    { str: "(two !== threeb && threeb !== three) || yes === yes2", assert: true },
    { str: "(two !== threeb && threeb !== three) || yes === yes2 && that && yes2", assert: true },
    { str: "n1 && yes && yes2 && huhu && maybe && (empty || !zero)", assert: true },
    { str: "yes2 !== n1 === !zero", assert: false }, // doesn't work
    { str: "!!three === !!zero", assert: true }, // double !! doesn't work
];

// takes none scoped if statement as string and outputs a bool result

const getVal = (obj, path) => {
    const res = resolvePath(obj, path.trim().replace("!", ""));
    return path.trim()[0] === "!" ? !res : res;
};

const ifParser = (str) => {
    const groups = splitTrim(str, "||").map((s) => splitTrim(s, "&&"));
    return groups.reduce((or, group) => {
        return or
            ? or
            : group.reduce((and, cond) => {
                  if (cond === "true") return and === true;
                  let res = getVal(state, cond);
                  if (cond.includes("===")) {
                      const [r1, r2] = splitTrim(cond, "===").map((path) => getVal(state, path));
                      res = r1 === r2;
                  } else if (cond.includes("!==")) {
                      const [r1, r2] = splitTrim(cond, "!==").map((path) => getVal(state, path));
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


const tester = (times, tests) => {
    let time1 = Date.now();
    let goodCount = 0;
    for (let u = 0; u < times; u++) {
        tests.forEach((test) => {
            if (test.assert === scopedParser(test.str)) {
                goodCount++;
            } else {
                console.log("---shit---");
                console.log(scopedParser(test.str));
                console.log("----------")
            }
        });
    }
    console.log(`tests done ${goodCount}/${tests.length*times} in ${Date.now() - time1} ms`);
}

tester(1, tests);

