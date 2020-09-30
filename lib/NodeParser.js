import _G from "../lib/_GLOBALS_.js";
import IfParser from "./IfParser.js";
import * as _H from "../lib/helpers.js";

export default (_state) => {
    return {
        parse(node, attributes) {
            if (node.nodeType === 3 || attributes.length === 0) return node;
            attributes.forEach((att) => {
                switch(att.name) {
                    case _G.CLASS_BIND:
                        node.className = this.parseClasses(att.value);
                        break;
                }
            })
        },
        parseClasses(attVal) {
            return attVal.split(",").reduce((acc, exp) => {
                const [cond, clazz] = exp.split(":");
                if (IfParser(_state).parse(cond)) {
                    return acc + clazz;
                } 
                return acc;
            }, "")
        }
    }
}