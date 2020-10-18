import _G from "./_GLOBALS_.js";

// export const resolvePath = (obj: any, path: string, separator: string = _G.OBJECT_SEPARATOR): any => {
//     return path
//         .trim()
//         .split(separator)
//         .reduce((prev, curr) => prev && prev[curr], obj);
// };

// export const setPath = (obj: any, path: string, value: any, separator: string = _G.OBJECT_SEPARATOR): void => {
//     path.trim()
//         .split(separator)
//         .reduce((o, p, i) => {
//             return (o[p] = path.trim().split(separator).length === ++i ? value : o[p] || {});
//         }, obj);
// };

export function resolvePath(obj: any, keyString: string) {
    // allow for arrays, returns undefined for non-existant-fields.
    keyString = keyString.trim();
    //console.log(obj, keyString)
    var keys = [{ label: "", type: "field", is_array: false }],
        current_key = 0;
    for (var i = 0; i < keyString.length; i++) {
        var c = keyString.charAt(i);
        switch (c) {
            case ".":
                current_key++;
                keys[current_key] = { label: "", type: "field", is_array: false };
                break;
            case "[":
                keys[current_key].is_array = true;
                current_key++;
                keys[current_key] = { label: "", type: "index", is_array: false };
                break;
            case "]":
                break;
            default:
                keys[current_key].label += c;
        }
    }
    var part = obj;
    for (i = 0; i < keys.length; i++) {
        var label = keys[i].label;
        if (i == keys.length - 1) {
            return part[label];
        } else {
            if (part[label] === undefined) {
                return undefined;
            }
            part = part[label];
        }
    }
}

export function setPath(obj: any, keyString: string, val: any) {
    // allows for arrays, deep creates non-existant fields.
    keyString = keyString.trim();
    var keys = [{ label: "", type: "field", is_array: false }],
        current_key = 0;
    for (var i = 0; i < keyString.length; i++) {
        var c = keyString.charAt(i);
        switch (c) {
            case ".":
                current_key++;
                keys[current_key] = { label: "", type: "field", is_array: false };
                break;
            case "[":
                keys[current_key].is_array = true;
                current_key++;
                keys[current_key] = { label: "", type: "index", is_array: false };
                break;
            case "]":
                break;
            default:
                keys[current_key].label += c;
        }
    }
    var part = obj;
    for (i = 0; i < keys.length; i++) {
        var label = keys[i].label;
        if (i == keys.length - 1) {
            part[label] = val;
        } else {
            if (part[label] === undefined) {
                // we need to create it for deep set!
                if (keys[i].is_array) {
                    part[label] = [];
                } else {
                    part[label] = {};
                }
            }
            part = part[label];
        }
    }
}

export const splitTrim = (string: string, separator: string | RegExp) => {
    return string.split(separator).map((e) => e.trim());
};

// export const replaceAll = (s: string, m: string, r: any, p?: any): string => {
//     return s === p || r.includes(m) ? s : replaceAll(s.replace(m, r), m, r, s);
// };

export const replaceAll2 = (str: string, match: string | string[], replacement: string): string => {
    return [match].flat().reduce((acc, m) => {
        return acc.split(m).join(replacement);
    }, str);
};

export const findCache = (variable: string, vElem: vElem, returnType: boolean = false): any => {
    if (!variable) return null;
    const [baseVar, fullPath] = [
        splitTrim(variable, _G.OBJECT_SEPARATOR).shift(),
        variable.split(_G.OBJECT_SEPARATOR).splice(1, 1).join(),
    ];
    const isObjectPath = fullPath !== "";
    while (vElem) {
        if (baseVar === vElem?.cache?.variableName) {
            if (returnType) {
                const obj = {
                    type: "value",
                    result: isObjectPath ? resolvePath(vElem.cache.value, fullPath) : vElem.cache.value,
                };
                return obj;
            }
            return isObjectPath ? resolvePath(vElem.cache.value, fullPath) : vElem.cache.value;
        } else if (baseVar === vElem?.cache?.indexName && !isObjectPath) {
            if (returnType) {
                return { result: vElem.cache.key, type: "key" };
            }
            return vElem.cache.key;
        } else if (baseVar === vElem?.cache?.numIndexName && !isObjectPath) {
            if (returnType) {
                return { result: vElem.cache.key, type: "index" };
            }
            return vElem.cache.index;
        }
        vElem = vElem.parent;
    }
    return null;
};

export const getValueFromStrVar = (state: any, vElem: vElem, str: string): any => {
    const cachedVal = findCache(str, vElem);
    if (cachedVal) return cachedVal;
    return resolvePath(state, str);
};
