const resolvePath = (obj, path, separator = ".") => {
    return path
            .trim()
            .split(separator)
            .reduce((prev, curr) => prev && prev[curr], obj) || false;
}

const splitTrim = (string, separator) => {
    return string.split(separator).map((e) => e.trim());
}

const state = {
    that: true,
    showMenu: false,
    showLatest: false,
    isFirst: false
}

const cond = "showMenu || isFirst && showLatest || that && huhu";

const ifParser = (str) => {
    const groups = splitTrim(str, "||").map((s) => splitTrim(s, "&&"));
    return groups.reduce((or, group) => {
        return or ? or : group.reduce((and, cond) => {
            return and ? resolvePath(state, cond) : false;
        }, true) 
    }, false)
}

console.log(ifParser(cond))

//console.log(state.showMenu || state.showLatest && state.isFirst)