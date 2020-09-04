import * as _H from "../lib/helpers.js";
import _G from "../lib/_GLOBALS_.js";

export default (_this) => {
    return {
        detect() {
            [..._this.selectAll(`[${_G.LOOP_BIND}]`)].forEach((elem) => {
                const attr = elem.getAttribute(_G.LOOP_BIND);
                if (
                    !_this.binds
                        .get(_G.LOOP_BIND)
                        .map((bind) => bind.attr)
                        .includes(attr.trim())
                ) {
                    let [variable, key] = _H.splitTrim(attr, _G.LOOP_IN_REGEX);
                    let index = undefined;
                    if (_G.LOOP_BRACE_REGEXP.test(variable)) {
                        const match = variable.match(_G.LOOP_BRACE_REGEXP)[1];
                        const [varr, i] = _H.splitTrim(match, _G.LOOP_VAR_DELIMITER);
                        variable = varr;
                        index = i;
                    }
                    const loopObj = {
                        type: "loop",
                        elem,
                        innerStuff: elem.innerHTML,
                        parent: elem.parentNode,
                        attr: attr.trim(),
                        variable,
                        index,
                        key,
                    };
                    _this.binds.get(_G.LOOP_BIND).push(loopObj);
                }
            });
        },
        render(setBinds = null) {
            const binds = setBinds ? setBinds : _this.binds.get(_G.LOOP_BIND);
            binds.forEach((bind) => {
                const corLoops = [..._this.selectAll(`[${_G.LOOP_BIND}$="${bind.attr}"]`)];
                const objToLoop = _H.resolvePath(_this.state, bind.key);
                corLoops.forEach((elem) => {
                    elem.innerHTML = "";
                    Object.entries(objToLoop).forEach(([key, item]) => {
                        const node = _H.stringToHtml(`<div>${bind.innerStuff}</div>`);
                        [..._this.selectAll(`[${_G.LOOP_ITEM}]`, node)].forEach((child) => {
                            const itemVar = child.getAttribute(_G.LOOP_ITEM); // loop-item var must be unique...
                            if (itemVar === bind.variable) {
                                child.innerHTML = item;
                            }
                        });
                        [..._this.selectAll(`[${_G.LOOP_KEY}]`, node)].forEach((child) => {
                            const keyVar = child.getAttribute(_G.LOOP_KEY); // loop-item var must be unique...
                            if (keyVar === bind.index) {
                                child.innerHTML = key;
                            }
                        });
                        elem.innerHTML += node.innerHTML;
                    });
                });
                if (bind.children.length > 0) {
                    _this.updateChildren(bind.children);
                }
            });
        }
    }
}