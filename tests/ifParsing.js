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
    n1: 1+1,
    empty: "",
    zero: 0,
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
    { str: "three !== threeb && two !== three", assert: false },
    { str: "two !== threeb && threeb === three", assert: true },
    { str: "(two !== threeb && threeb !== three) || yes === yes2", assert: true },
    { str: "(two !== threeb && threeb !== three) || yes === yes2 && that && yes2", assert: true },
    { str: "n1 && yes && yes2 && huhu && maybe && (empty || !zero)", assert: true },
];

// takes none scoped if statement as string and outputs a bool result
const ifParser = (str) => {
    const groups = splitTrim(str, "||").map((s) => splitTrim(s, "&&"));
    return groups.reduce((or, group) => {
        return or
            ? or
            : group.reduce((and, cond) => {
                  let val;
                  if (cond.includes("===")) {
                      const [s1, s2] = splitTrim(cond, "===");
                      const [i1, i2] = [s1, s2].map((e) => e[0] === "!");
                      const r1 = i1 ? !resolvePath(state, s1) : resolvePath(state, s1);
                      const r2 = i2 ? !resolvePath(state, s2) : resolvePath(state, s2);
                      if (r1 === r2) {
                          val = true;
                      } else {
                          val = false;
                      }
                  } else if (cond.includes("!==")) {
                      const [s1, s2] = splitTrim(cond, "!==");
                      const [i1, i2] = [s1, s2].map((e) => e[0] === "!");
                      const r1 = i1 ? !resolvePath(state, s1) : resolvePath(state, s1);
                      const r2 = i2 ? !resolvePath(state, s2) : resolvePath(state, s2);
                      if (r1 !== r2) {
                          val = true;
                      } else {
                          val = false;
                      }
                  } else {
                      val = resolvePath(state, cond.replace("!", ""));
                      if (cond[0] === "!") val = !val;
                  }

                  //const val = cond[0] === "!" ? !resolvePath(state, cond) : resolvePath(state, cond);
                  const res = cond === "true" ? true : !!val;
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
        console.log(scopedParser(test.str))
        console.log("not good :(");
    }
});

//console.log(state.showMenu || state.showLatest && state.isFirst)
