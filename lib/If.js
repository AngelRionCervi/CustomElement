import * as _H from "../lib/helpers.js";
import _G from "../lib/_GLOBALS_.js";
import IfParser from "../lib/IfParser.js";

export default (_this) => {
    return {
        detect() {
            [..._this.selectAll(`[${_G.IF_BIND}]`)].forEach((elem) => {
                const key = elem.getAttribute(_G.IF_BIND).trim();
                if (
                    !_this.binds
                        .get(_G.IF_BIND)
                        .map((bind) => bind.key)
                        .includes(key)
                ) {
                    const ifObj = {
                        type: "if",
                        elem,
                        innerStuff: elem.innerHTML,
                        parent: elem.parentNode,
                        key,
                    };
                    _this.binds.get(_G.IF_BIND).push(ifObj);
                }
            });
        },
        render(setBinds = null) {
            const binds = setBinds ? setBinds : _this.binds.get(_G.IF_BIND);
            binds.forEach((bind) => {
                const corIfs = [..._this.selectAll(`[${_G.IF_BIND}$="${bind.key}"]`)];
                const condition = IfParser(_this.state).parse(bind.key);
                const node = _H.stringToHtml(`<div>${bind.innerStuff}</div>`);
                corIfs.forEach((elem) => {
                    elem.innerHTML = "";
                    if (condition) {
                        elem.innerHTML = node.innerHTML;
                    }
                });
                if (bind.children.length > 0) {
                    _this.updateChildren(bind.children);
                }
            });
        },
    };
};
