import * as _H from "../lib/helpers.js";
import _G from "../lib/_GLOBALS_.js";

export default (_this) => {
    return {
        detect() {
            [..._this.selectAll(`[${_G.LOOP_BIND}]`)].forEach((elem) => {
                const attr = elem.getAttribute(_G.LOOP_BIND).trim();
                if (
                    !_this.binds
                        .get(_G.LOOP_BIND)
                        .map((bind) => bind.attr)
                        .includes(attr)
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
                        attr,
                        variable,
                        index,
                        key,
                    };
                    console.log(elem.innerHTML)
                    _this.binds.get(_G.LOOP_BIND).push(loopObj);
                }
            });
        },
        render(setBinds = null) {
            const binds = setBinds ? setBinds : _this.binds.get(_G.LOOP_BIND);
            binds.forEach((bind) => {
                const corLoops = [..._this.selectAll(`[${_G.LOOP_BIND}$="${bind.attr}"]`)];
                console.log(corLoops)
                const objToLoop = _H.resolvePath(_this.state, bind.key);
                corLoops.forEach((elem) => {
                    elem.innerHTML = "";
                    Object.entries(objToLoop).forEach(([key, item]) => {
                        const node = _H.stringToHtml(`<div>${bind.innerStuff}</div>`);
                        [..._this.selectAll(`[${_G.LOOP_ITEM}$="${bind.variable}"]`, node)].forEach((child) => {
                            child.innerHTML = item;
                        });
                        [..._this.selectAll(`[${_G.LOOP_KEY}$="${bind.index}"]`, node)].forEach((child) => {
                            child.innerHTML = key;
                        });
                        elem.innerHTML += node.innerHTML;
                    });
                });
                if (bind.children.length > 0) {
                    _this.updateChildren(bind.children);
                }
            });
        },
    };
};

