export const resolvePath = (obj: any, path: string, separator: string = "."): any => {
    return path
        .trim()
        .split(separator)
        .reduce((prev, curr) => prev && prev[curr], obj);
};

export const setPath = (obj: any, path: string, value: any, separator: string = "."): void => {
    path.trim()
        .split(separator)
        .reduce((o, p, i) => {
            return (o[p] = path.trim().split(separator).length === ++i ? value : o[p] || {});
        }, obj);
};

export const splitTrim = (string: string, separator: string | RegExp) => {
    return string.split(separator).map((e) => e.trim());
};

export const replaceAll = (s: string, m: string, r: any, p?: any): string => {
    return s === p || r.includes(m) ? s : replaceAll(s.replace(m, r), m, r, s);
};

export const findCache = (variable: string, vElem: vElem, returnType: boolean = false): any => {
    if (!variable) return null;
    const [baseVar, fullPath] = [splitTrim(variable, ".").shift(), variable.split(".").splice(1, 1).join()];
    const isObjectPath = fullPath !== "";
    while (vElem) {
        if (baseVar === vElem?.cache?.variable) {
            if (returnType) {
                const obj = {
                    type: "value",
                    result: isObjectPath ? resolvePath(vElem.cache.value, fullPath) : vElem.cache.value,
                };
                return obj;
            }
            return isObjectPath ? resolvePath(vElem.cache.value, fullPath) : vElem.cache.value;
        } else if (baseVar === vElem?.cache?.index && !isObjectPath) {
            if (returnType) {
                return { result: vElem.cache.key, type: "key" };
            }
            return vElem.cache.key;
        }
        vElem = vElem.parent;
    }
    return null;
};
