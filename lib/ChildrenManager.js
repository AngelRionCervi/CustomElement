import * as _H from "../lib/helpers.js";
import _G from "../lib/_GLOBALS_.js";

export default (_this) => {
    return {
        getDirectGeneratorChildren(genBinds, elem) {
            const children = [];
            let child = _this.select(`[${_G.LOOP_BIND}], [${_G.IF_BIND}]`, elem);
            let childIndex = _H.getElementIndex(child);
            while (child) {
                const match = genBinds.find((bind) => bind.elem.isEqualNode(child));
                if (match) children.push(match);
                childIndex++;
                child = _this.select(_this.getGeneratorSiblingSelector(elem.tagName, childIndex), elem);
            }
            return children;
        },
        getGeneralChildren(elem) {
            const children = [];
            const childrenElems = [..._this.selectAll(`[${_G.DATA_BIND}]`, elem)];
            childrenElems.forEach((child) => {
                const attr = child.getAttribute(_G.DATA_BIND);
                const bind = _this.getAllGeneralBinds().find((e) => e.attr === attr);
                if (bind) children.push(bind)
            });
            return children;
        }
    }
}