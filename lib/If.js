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
                    const results = [..._this.selectAll(`[${_G.IF_BIND}$="${key}"]`)].reduce((acc, el) => {
                        return [...acc, { elem: el, innerStuff: el.innerHTML, type: "if", key }];
                    }, []);
                    const ifObj = {
                        type: "if",
                        elem,
                        innerStuff: elem.innerHTML,
                        parent: elem.parentNode,
                        key,
                        results
                    };
                    _this.binds.get(_G.IF_BIND).push(ifObj);
                }
            });
        },
        render(setBinds = null) {
            const binds = setBinds ? setBinds : _this.binds.get(_G.IF_BIND);
            binds.forEach((bind) => {
                const corIfs = bind.results;
                const condition = IfParser(_this.state).parse(bind.key);
                
                corIfs.forEach((inst) => {
                    const node = _H.stringToHtml(`<div>${inst.innerStuff}</div>`);
                    inst.elem.innerHTML = "";
                    if (condition) {
                        inst.elem.innerHTML = node.innerHTML;
                    }
                    if (inst.children.length > 0) {
                        _this.updateChildren(inst.children);
                    }
                });
                
            });
        },
    };
};
