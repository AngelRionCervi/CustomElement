import * as _H from "../lib/helpers.js";
import _G from "../lib/_GLOBALS_.js";
import IfParser from "../lib/IfParser.js";

export default (_this) => {
    return {
        detect() {
            [..._this.selectAll(`[${_G.DATA_BIND}]`)].forEach((elem) => {
                const attr = elem.getAttribute(_G.DATA_BIND);
                let [condition, key] = [true, attr];
                if (attr.includes(":")) [condition, key] = _H.splitTrim(attr, ":");
                _this.binds.get(_G.DATA_BIND).push({ elem, key, attr, condition, type: "data" });
            });
        },
        render(setBinds = null) {
            const binds = setBinds ? setBinds : _this.binds.get(_G.DATA_BIND);
            binds.forEach((bind) => {
                [..._this.selectAll(`[${_G.DATA_BIND}$="${bind.attr}"]`)].forEach((elem) => {
                    const val = _H.resolvePath(_this.state, bind.key);
                    if (bind.condition === true) {
                        elem.innerHTML = val;
                    } else {
                        if (IfParser(_this.state).parse(bind.condition)) elem.innerHTML = val;
                        else elem.innerHTML = "";
                    }
                });
            });
        },
    };
};
