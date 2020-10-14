import _G from "../lib/_GLOBALS_.js";
import StringParser from "./StringParser.js";
import * as _H from "../lib/helpers.js";

export default (_this, state) => {
    return {
        parse(vElem) {
            const { attributes, node, cache, type } = vElem;
            if (type === "text" && cache.hasOwnProperty("baseText")) {
                node.textContent = this.parseTextContent(cache.baseText, attributes);
            }
            if (attributes.length === 0) return node;
            attributes.forEach((att) => {
                if (att.name && att.name.includes("on-")) {
                    this.createEventListener(att, node);
                } else {
                    switch(att.name) {
                        case _G.CLASS_BIND:
                            node.className = this.parseClasses(att.value, node.className);
                            break;
                    }
                }
            })
        },
        parseClasses(attVal, curClassName) {
            const splitAtt = attVal.split("~");
            const attClassesList = splitAtt.map((e) => _H.splitTrim(e, ":").pop());
            const baseClasses = curClassName.split(" ").filter((bc) => !attClassesList.includes(bc));
            return baseClasses.join(" ") + splitAtt.reduce((acc, exp) => {
                const [cond, clazz] = exp.split(":");
                if (StringParser(state).parse(cond)) {
                    return acc + clazz;
                } 
                return acc;
            }, "")
        },
        parseTextContent(baseText, attributes) {
            return attributes.reduce((acc, res) => {
                return acc.replace(res.match, _H.resolvePath(state, res.key));
            }, baseText);
        },
        createEventListener(att, node) {
            const [eventType, callbacks] = [att.name.replace("-", "").toLowerCase(), _H.splitTrim(att.value, "~")];
            node[eventType] = (evt) => {
                callbacks.forEach((cb) => {
                    const isArgs = _G.LOOP_BRACE_REGEXP.test(cb);
                    const args = isArgs ? StringParser(state).getPrimFromSplit(_H.splitTrim(cb.match(_G.LOOP_BRACE_REGEXP)[1], ",")) : [evt];
                    const fnName = isArgs ? cb.split(_G.LOOP_BRACE_REGEXP).shift() : cb;
                    const fn = _H.resolvePath(_this, fnName);
                    if (fn) {
                        fn(...args);
                        return;
                    } 
                    throw new Error(`Callback ${ fnName } doesn't exist on component "${ _this.tagName.toLowerCase() }".`)
                })
            }
        }
    }
}