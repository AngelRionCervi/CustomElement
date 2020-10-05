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

export const replaceAll = (s, m, r, p) => {
    return s === p || r.includes(m) ? s : replaceAll(s.replace(m, r), m, r, s);
}

export const getElementDepth = (el) => {
    let depth = 0;
    while (el.parentElement) {
        el = el.parentElement;
        depth++;
    }
    return depth;
};

export const getElementIndex = (elem) => {
    if (!elem?.parentNode) return -1;
    return [...elem.parentNode.children].indexOf(elem);
}

export const findClosest = (x, arr) => {
    const indexArr = arr.map((k) => Math.abs(k - x));
    const min = Math.min(...indexArr);
    return arr[indexArr.indexOf(min)];
};

export const keyExists = (obj, key) => {
    return obj.hasOwnProperty(key);
}

export const getKeysUsed = (str) => {
    if (!str) return [];
    const arOpMatchRegex = /([+\-*\/%=<>&|])/;
    const stringRegexp = /(['])((\\{2})*|(.*?[^\\](\\{2})*))\1/;
    const numberRegexp = /^-?\d+\.?\d*$/;
    const isVar = (str) => !numberRegexp.test(str) && !stringRegexp.test(str) && !arOpMatchRegex.test(str);
    const isLoop = (str) => str.includes("in");
    const keys = [];
    splitTrim(str, arOpMatchRegex).forEach((val) => {
        if (isLoop(val)) keys.push(splitTrim(val, "in").pop());
        else if (isVar(val)) keys.push(val);
    })
    return keys;
}

export const getPrimFromStr = (strArr, _state) => {
    const stringRegexp = /(['])((\\{2})*|(.*?[^\\](\\{2})*))\1/;
    const numberRegexp = /^-?\d+\.?\d*$/;
    const globalPrims = ["true", "false", "null", "undefined"]
    return strArr.reduce((acc, str) => {
        if (numberRegexp.test(str)) {
            return [...acc, parseFloat(str)];
        } else if (globalPrims.includes(str)) {
            let val = "";
            switch(str) {
                case "true":
                    val = true;
                    break;
                case "false":
                    val = false;
                    break;
                case "null":
                    val = null;
                    break;
                case "undefined":
                    val = undefined;
                    break;
            }
            return [...acc, val]
        } else if (stringRegexp.test(str)) {
            return [...acc, replaceAll(str, "'", "")];
        } else {
            const keys = getKeysUsed(str);
            for (let u = 0; u < keys.length; u++) {
                keys[u] = resolvePath(_state, keys[u]);
            }
            return [...acc, ...keys];
        }
    }, [])
}

// other possibility for findLoopIfChildren, the speed is the same...
function /* method */ findLoopIfChildren() {
    const genBinds = this.getAllGeneratorBinds();
    const getChildren = (elem) => {
        const children = [];
        let child = this.select(`[${_G.LOOP_BIND}], [${_G.IF_BIND}]`, elem);
        if (child) children.push(genBinds.find((bind) => bind.elem.isSameNode(child)));
        else return [];
        child = child.nextElementSibling;
        while (child) {
            if ([...child.attributes].some((attr) => this.getAllGeneratorAttr().includes(attr))) {
                const matches = genBinds.filter((bind) => bind.elem.isSameNode(child));
                if (matches?.length > 0) children.push(...matches);
            }
            child = child.nextElementSibling;
        }
        return children;
    };
    genBinds.forEach((bind) => {
        bind.children = getChildren(bind.elem);
    });
}

function getClosestChildren(childrenBinds, bind) {
    const childrenDepths = [];
    childrenBinds.forEach((bind) => {
        childrenDepths.push({ bind, depth: _H.getElementDepth(bind.elem) });
    });
    const closest = _H.findClosest(
        _H.getElementDepth(bind.elem),
        childrenDepths.map((b) => b.depth)
    );
    if (closest) {
        return childrenDepths.filter((child) => child.depth === closest).map((child) => child.bind);
    }
    return [];
}