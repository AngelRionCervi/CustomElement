export const resolvePath = (obj, path, separator = ".") => {
    return path
            .trim()
            .split(separator)
            .reduce((prev, curr) => prev && prev[curr], obj);
}

export const setPath = (object, path, value, separator = ".") => {
    path.trim()
            .split(separator)
            .reduce((o, p, i) => {
                return (o[p] = path.trim().split(separator).length === ++i ? value : o[p] || {});
            }, object);
        return this;
}

export const stringToHtml = (string) => {
    return new DOMParser().parseFromString(string, "text/html").body.firstChild;
}

export const splitTrim = (string, separator) => {
    return string.split(separator).map((e) => e.trim());
}

export const getElementDepth = (el) => {
    let depth = 0;
    while (el.parentElement) {
        el = el.parentElement;
        depth++;
    }
    return depth;
};

export const findClosest = (x, arr) => {
    const indexArr = arr.map((k) => Math.abs(k - x));
    const min = Math.min(...indexArr);
    return arr[indexArr.indexOf(min)];
};