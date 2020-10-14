export const resolvePath = (obj: any, path: string, separator: string = "."): any => {
    return path
            .trim()
            .split(separator)
            .reduce((prev, curr) => prev && prev[curr], obj);
}

export const setPath = (obj: any, path: string, value: any, separator: string = "."): void => {
    path.trim()
            .split(separator)
            .reduce((o, p, i) => {
                return (o[p] = path.trim().split(separator).length === ++i ? value : o[p] || {});
            }, obj);
}

export const splitTrim = (string: string, separator: string | RegExp) => {
    return string.split(separator).map((e) => e.trim());
}

export const replaceAll = (s: string, m: string, r: any, p?: any): string => {
    return s === p || r.includes(m) ? s : replaceAll(s.replace(m, r), m, r, s);
}

