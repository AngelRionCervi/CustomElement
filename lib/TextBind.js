import * as _H from "../lib/helpers.js";
import _G from "../lib/_GLOBALS_.js";

export default (_this) => {
    return {
        detect() {
            [..._this.selectAll("*")].forEach((elem) => {
                if (elem.firstChild && elem.firstChild.nodeType === 3) {
                    const matches = [...elem.firstChild.textContent.matchAll(_G.TEXT_BIND_REGEXP)];
                    const results = matches.reduce((acc, match) => {
                        return [...acc, { match: match[0], key: match[1].trim(), index: elem.textContent.indexOf(match[0]) }];
                    }, []);
                    if (results.length > 0) {
                        _this.binds.get(_G.TEXT_BIND).push({
                            elem,
                            text: elem.textContent,
                            results,
                            keys: results.map((e) => e.key),
                        });
                    }
                }
            });
        },
        render(setBinds = null) {
            const binds = setBinds ? setBinds : _this.binds.get(_G.TEXT_BIND);
            binds.forEach((bind) => {
                bind.elem.textContent = bind.results.reduce((acc, res) => {
                    return acc.replace(res.match, _H.resolvePath(_this.state, res.key));
                }, bind.text);
            });
        },
    };
};
