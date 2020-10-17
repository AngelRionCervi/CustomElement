import _G from "./_GLOBALS_.js";
import StringParser from "./StringParser.js";
import * as _H from "./helpers.js";
export default (_this, state) => {
    return {
        parse(vElem) {
            const { attributes, node, cache, type } = vElem;
            if (type === "text" && cache.hasOwnProperty("baseText")) {
                node.textContent = this.parseTextContent(cache.baseText, attributes, vElem);
                return;
            }
            if (attributes.length === 0)
                return node;
            attributes.forEach((att) => {
                if (att.name && att.name.includes("on-")) {
                    this.createEventListener(att, node);
                }
                else {
                    switch (att.name) {
                        case _G.CLASS_BIND:
                            node.className = this.parseClasses(att.value, node.className);
                            break;
                        default:
                            node.setAttribute(att.name, this.parseAttr(att.value, vElem));
                            break;
                    }
                }
            });
        },
        parseClasses(attVal, curClassName) {
            const splitAtt = attVal.split(_G.EXP_DELIMITER);
            const attClassesList = splitAtt.map((e) => _H.splitTrim(e, _G.DOUBLEDOT_DELIMITER).pop());
            const baseClasses = curClassName.split(" ").filter((bc) => !attClassesList.includes(bc));
            return (baseClasses.join(" ") +
                splitAtt.reduce((acc, exp) => {
                    const [cond, clazz] = exp.split(_G.DOUBLEDOT_DELIMITER);
                    if (StringParser(state).parse(cond)) {
                        return acc + clazz;
                    }
                    return acc;
                }, ""));
        },
        parseTextContent(baseText, attributes, vElem) {
            return attributes.reduce((acc, res) => {
                const cachedVal = _H.findCache(res.key, vElem);
                if (cachedVal)
                    return acc.replace(res.match, cachedVal);
                return acc.replace(res.match, _H.resolvePath(state, res.key));
            }, baseText);
        },
        parseAttr(attVal, vElem) {
            let newVal = attVal;
            const matches = [...attVal.matchAll(_G.TEXT_BIND_REGEXP)];
            matches.forEach((match) => {
                const cachedVal = _H.findCache(match[1], vElem);
                if (cachedVal)
                    newVal = newVal.replace(match[0], cachedVal);
                else {
                    newVal = newVal.replace(match[0], _H.resolvePath(state, match[1])); // use _H.replaceAll
                }
            });
            return newVal;
        },
        createEventListener(att, node) {
            const eventType = att.name.replace("-", "").toLowerCase();
            const callbacks = _H.splitTrim(att.value, _G.EXP_DELIMITER);
            node[eventType] = (evt) => {
                callbacks.forEach((cb) => {
                    const argsB = cb.match(_G.LOOP_BRACE_REGEXP);
                    let [args, fnName] = [[evt], cb];
                    if (argsB) {
                        args = StringParser(state).getPrimFromSplit(_H.splitTrim(argsB[1], _G.PARAM_DELIMITER));
                        fnName = cb.split(_G.LOOP_BRACE_REGEXP).shift();
                    }
                    const fn = _H.resolvePath(_this, fnName);
                    if (fn) {
                        fn(...args);
                        return;
                    }
                    throw new Error(`Callback ${fnName} doesn't exist on component "${_this.tagName.toLowerCase()}".`);
                });
            };
        },
    };
};
