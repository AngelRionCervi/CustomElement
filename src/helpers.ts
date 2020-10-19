import _G from "./_GLOBALS_.js";
import StringParser, { isVar } from "./StringParser.js";

export function resolvePath(obj: any, keyString: string) {
    keyString = keyString.trim();
    const keys = [{ label: "", type: "field", is_array: false }];
    let current_key = 0;
    for (let i = 0; i < keyString.length; i++) {
        const c = keyString.charAt(i);
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
    let part = obj;
    for (let i = 0; i < keys.length; i++) {
        let label = keys[i].label;
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
    keyString = keyString.trim();
    const keys = [{ label: "", type: "field", is_array: false }];
    let current_key = 0;
    for (let i = 0; i < keyString.length; i++) {
        const c = keyString.charAt(i);
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
    let part = obj;
    for (let i = 0; i < keys.length; i++) {
        let label = keys[i].label;
        if (i == keys.length - 1) {
            part[label] = val;
        } else {
            if (part[label] === undefined) {
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

export const parseVar = (state: any, vElem: vElem, strToParse: string) => {
    const varMatches = [...strToParse.matchAll(_G.TEXT_BIND_REGEXP)];
    const parser = StringParser(state, vElem);

    const resolveVar = (strVar: string): any => {
        strVar = strVar.trim();
        const indexMatches = [...strVar.matchAll(_G.ARRAY_INDEX_REGEXP)];

        indexMatches.forEach((match) => {
            strVar = replaceAll2(strVar, match[1], parser.computeExp(match[1]));
        });
        return parser.computeExp(strVar);
    };

    varMatches.forEach((match) => {
        strToParse = replaceAll2(strToParse, match[0], resolveVar(match[1]));
    });

    return strToParse;
};

export const getVarNameUsed = (str: string | null) => {
    if (!str) return "";
    return [...str.matchAll(_G.TEXT_BIND_REGEXP)].reduce((acc, match) => {
        let r = match[1];
        let indexVars: string[] = [];
        let indexMatch = [...str.matchAll(_G.ARRAY_INDEX_REGEXP)];
        if (indexMatch) {
            indexMatch.forEach((m) => {
                if(isVar(m[1])) indexVars.push(m[1].trim());
                r = replaceAll2(r, m[0], "");
            });
        }
        r = r.split(".").shift()?.trim() ?? r.trim();
        return [...acc, r, ...indexVars];
    }, []);
};
