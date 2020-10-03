import _G from "../lib/_GLOBALS_.js";
import IfParser from "./IfParser.js";
import * as _H from "../lib/helpers.js";

export default (_state) => {
    return {
        parse(vElem) {
            const { attributes, node, cache, type } = vElem;
            if (type === "text" && cache.hasOwnProperty("baseText")) {
                node.textContent = this.parseTextContent(cache.baseText, attributes);
            }
            if (attributes.length === 0) return node;
            attributes.forEach((att) => {
                switch(att.name) {
                    case _G.CLASS_BIND:
                        node.className = this.parseClasses(att.value, node.className);
                        break;
                }
            })
        },
        parseClasses(attVal, curClassName) {
            const splitAtt = attVal.split(",");
            const attClassesList = splitAtt.map((e) => _H.splitTrim(e, ":").pop());
            const baseClasses = curClassName.split(" ").filter((bc) => !attClassesList.includes(bc));
            return baseClasses.join(" ") + splitAtt.reduce((acc, exp) => {
                const [cond, clazz] = exp.split(":");
                if (IfParser(_state).parse(cond)) {
                    return acc + clazz;
                } 
                return acc;
            }, "")
        },
        parseTextContent(baseText, attributes) {
            return attributes.reduce((acc, res) => {
                return acc.replace(res.match, _H.resolvePath(_state, res.key));
            }, baseText);
        }
    }
}