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
                    const [variable, key] = _H.splitTrim(attr, "of");
                    const loopObj = {
                        type: "loop",
                        elem,
                        innerStuff: elem.innerHTML,
                        parent: elem.parentNode,
                        attr: attr.trim(),
                        variable,
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
                const arrayToLoop = _H.resolvePath(_this.state, bind.key);
                corLoops.forEach((elem) => {
                    elem.innerHTML = "";
                    arrayToLoop.forEach((item) => {
                        const node = _H.stringToHtml(`<div>${bind.innerStuff}</div>`);
                        [..._this.selectAll(`[${_G.LOOP_ITEM}]`, node)].forEach((child) => {
                            const itemVar = child.getAttribute(_G.LOOP_ITEM);
                            if (itemVar === bind.variable) {
                                child.innerHTML = item;
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