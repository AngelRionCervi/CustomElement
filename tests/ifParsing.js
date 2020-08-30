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
};

const cond = "showMenu || isFirst && showLatest || that";
const cond1b = "(showMenu || isFirst) && (showLatest || that)";
const cond2 = "false || isFirst && showLatest || that && false";

const tests = [
    { str: "(showMenu || isFirst) && (showLatest || that)", assert: false },
    { str: "(showMenu || isFirst) || (showLatest || that)", assert: true },
    { str: "showMenu || isFirst && showLatest || that", assert: true },
    { str: "showLatest && huhu && !isFirst", assert: true },
    { str: "(showMenu || (showLatest || huhu)) || isFirst", assert: true },
    { str: "isFirst || (showMenu || (that && (huhu || isFirst))", assert: true },
];

// takes none scoped if statement as string and outputs a bool result
const ifParser = (str) => {
    const groups = splitTrim(str, "||").map((s) => splitTrim(s, "&&"));
    return groups.reduce((or, group) => {
        return or
            ? or
            : group.reduce((and, cond) => {
                  const val = cond[0] === "!" ? !resolvePath(state, cond) : resolvePath(state, cond);
                  const res = cond === "true" ? true : val;
                  return and ? res : false;
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

tests.forEach((test) => {
    if (test.assert === scopedParser(test.str)) {
        console.log("good");
    } else {
        console.log("not good :(");
    }
});

//console.log(state.showMenu || state.showLatest && state.isFirst)
