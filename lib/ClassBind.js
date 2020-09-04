import * as _H from "./helpers.js";
import _G from "./_GLOBALS_.js";
import IfParser from "./IfParser.js";

export default (_this) => {
    return {
        detect() {
            [..._this.selectAll(`[${_G.CLASS_BIND}]`)].forEach((elem) => {
                const attr = elem.getAttribute(_G.CLASS_BIND);
                const results = _H.splitTrim(attr, ",").reduce((a, attr) => {
                    let [condition, key] = [true, attr];
                    if (attr.includes(":")) [condition, key] = _H.splitTrim(attr, ":");
                    return [...a, { key, condition }];
                }, []);
                _this.binds
                    .get(_G.CLASS_BIND)
                    .push({
                        elem,
                        attr,
                        baseClasses: elem.className,
                        results,
                        keys: results.map((e) => e.key),
                        conditions: results.filter((e) => typeof e.condition === "string").map((e) => e.condition),
                        type: "class",
                    });
            });
        },
        render(setBinds) {
            const binds = setBinds ? setBinds : _this.binds.get(_G.CLASS_BIND);
            binds.forEach((bind) => {
                [..._this.selectAll(`[${_G.CLASS_BIND}$="${bind.attr}"]`)].forEach((elem) => {
                    const activatedClasses = bind.results.reduce((acc, res) => {
                        if (res.condition === true) {
                            return (acc += ` ${_H.resolvePath(_this.state, res.key)}`);
                        } else if (IfParser(_this.state).parse(res.condition)) {
                            return (acc += ` ${res.key}`);
                        }
                        return (acc += "");
                    }, "");
                    elem.className = bind.baseClasses + activatedClasses;
                });
            });
        },
    };
};
