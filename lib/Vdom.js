import * as _H from "../lib/helpers.js";
import _G from "../lib/_GLOBALS_.js";

export default (_this) => {
    let tree = undefined;
    return {
        getAttributes(node) {
            const possibleAttrs = [_G.LOOP_BIND, _G.LOOP_ITEM];
            const nodeAttrs = [];
            possibleAttrs.forEach((q) => {
                if (node.hasAttribute(q)) {
                    nodeAttrs.push({ name: q, value: node.getAttribute(q) });
                }
            });
            return nodeAttrs;
        },
        classify(attrs) {
            const attrList = attrs.map((a) => a.name);
            if (attrList.includes("loop")) {
                return "loop";
            } else if (attrList.includes("if")) {
                return "if";
            } else if (attrList.includes("data")) {
                return "data";
            } else {
                return "text";
            }
        },
        parseLoopAttr(attrVal) {
            let [variable, key] = _H.splitTrim(attrVal, _G.LOOP_IN_REGEX);
            let index = undefined;
            if (_G.LOOP_BRACE_REGEXP.test(variable)) {
                const match = variable.match(_G.LOOP_BRACE_REGEXP)[1];
                const [varr, i] = _H.splitTrim(match, _G.LOOP_VAR_DELIMITER);
                variable = varr;
                index = i;
            }
            return [variable, key];
        },
        getKeyAndCondition(type, attrs) {
            const attrVal = attrs.find((a) => a.name === type);
            if (attrVal) {
                let [variable, key] = [true, attrVal.value];
                switch (type) {
                    case "loop": {
                        [variable, key] = this.parseLoopAttr(attrVal.value);
                    }
                }
                return [variable, key];
            }
            return [true, undefined];
        },
        createVelem(node, parent = null) {
            const attributes = this.getAttributes(node);
            const type = this.classify(attributes);
            const [variable, key] = this.getKeyAndCondition(type, attributes);
            const vElem = { attributes, tag: node.tagName, type, options: { variable, key }, node, innerStuff: node.innerHTML, children: this.buildVdom(node), parent };
            return vElem;
        },
        buildVdom(node = _this.shadowRoot, parent = null) {
            const res = [];
            let stk = [];
            if (node.firstElementChild) stk.push(node.firstElementChild);

            while (stk.length !== 0) {
                let currentNode = stk.pop();

                const vElem = this.createVelem(currentNode, parent);
                res.push(vElem);

                if (currentNode.nextElementSibling) {
                    stk.push(currentNode.nextElementSibling);
                }
            }
            return res;
        },
        scanNode() {
            tree = this.buildVdom().filter((e) => e.tag !== "STYLE");
            return tree;
        },
        findChildrenByAttr(children, attr, variable) {
            const res = [];
            const stack = children;
            while (children.length !== 0) {
                const currentChild = children.pop();
                if (currentChild.attributes.some((e) => e.name === attr && e.value === variable)) {
                    res.push(currentChild);
                }
                stack.push(...currentChild.children);
            }
            return res;
        },
        renderLoops(vNodes = tree) {
            const corVelem = vNodes.filter((e) => e.type === "loop");
            corVelem.forEach((vElem) => {
                const node = _H.stringToHtml(`<div>${vElem.innerStuff}</div>`);
                const objToLoop = _H.resolvePath(_this.state, vElem.options.key);
                vElem.node.innerHTML = "";
                objToLoop.forEach((item) => {
                    const iterationVelem = this.buildVdom(node, vElem);
                    iterationVelem.forEach((child) => {
                        if (child.attributes.some((e) => e.name === _G.LOOP_ITEM && e.value === vElem.options.variable)) {
                            child.node.innerHTML = item;
                        } 
                    });
                    vElem.node.innerHTML += node.innerHTML;
                });
                vElem.children = [...this.buildVdom(vElem.node, vElem)];
                if (vElem.children.length > 0) {
                    this.renderLoops(vElem.children);
                }
            });
            //console.log(tree)
        },
    };
};
