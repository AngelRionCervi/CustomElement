export const resolvePath = (obj, path, separator = ".") => {
    return path
        .trim()
        .split(separator)
        .reduce((prev, curr) => prev && prev[curr], obj);
};
export const setPath = (obj, path, value, separator = ".") => {
    path.trim()
        .split(separator)
        .reduce((o, p, i) => {
        return (o[p] = path.trim().split(separator).length === ++i ? value : o[p] || {});
    }, obj);
};
export const splitTrim = (string, separator) => {
    return string.split(separator).map((e) => e.trim());
};
export const replaceAll = (s, m, r, p) => {
    return s === p || r.includes(m) ? s : replaceAll(s.replace(m, r), m, r, s);
};
export const findCache = (variable, vElem) => {
    const [baseVar, fullPath] = [splitTrim(variable, ".").shift(), variable.split(".").splice(1, 1).join()];
    const isObjectPath = fullPath !== "";
    while (vElem) {
        if (baseVar === vElem?.cache?.variable) {
            return isObjectPath ? resolvePath(vElem.cache.value, fullPath) : vElem.cache.value;
        }
        vElem = vElem.parent;
    }
    return null;
};
