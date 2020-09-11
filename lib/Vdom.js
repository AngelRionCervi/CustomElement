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

            const vElem = { attributes, tag: node.tagName, type, options: { variable, key }, node, innerStuff: node.outerHTML, children: [], parent };
            if (key) {
                const objToLoop = _H.resolvePath(_this.state, key);
                Object.entries(objToLoop).forEach(([key, item]) => {
                    const vChild = this.buildVdom(node.cloneNode(true), vElem);
                    vChild.forEach((vc) => {
                        vc.cache = { value: item, key, variable };
                        vElem.children.push(vc);
                    });
                });
            }
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

            const stack = [...children];

            while (stack.length !== 0) {
                const currentChild = stack.pop();
                
                if (currentChild.cache.variable === variable) {
                    res.push(currentChild);
                }

                stack.push(...currentChild.children);
            }
            return res;
        },
        findParentsByAttr(parent, loopItem) {
            let vNode = parent;
            let index = 0;
            while (vNode) {
                if (vNode.options.variable === loopItem.attributes[0].value || loopItem.attributes[0].value === vNode?.cache?.variable) {
                    console.log("hey", index);
                    return vNode;
                }
                vNode = vNode.parent;
                index++;
            }
            return false;
        },
        renderLoops(vNodes = tree) {
            const corVelem = vNodes.filter((e) => e.type === "loop");
            corVelem.forEach((vElem) => {
                const node = _H.stringToHtml(`<div>${vElem.innerStuff}</div>`);
                const objToLoop = _H.resolvePath(_this.state, vElem.options.key);
                vElem.node.innerHTML = "";

                vElem.children.forEach((child) => { // what is this loop for ?
                    
                    const loopItems = this.findChildrenByAttr(vElem.children, _G.LOOP_ITEM, child.cache.variable);
                    console.log(child.cache.variable, loopItems);
                    loopItems.forEach((loopItem, index) => {
                        const vNode = this.findParentsByAttr(loopItem, loopItem);
                        console.log("vNode", vNode);
                        if (vNode && vNode.cache && vNode.cache.value) {
                
                            loopItem.node.innerHTML = vNode.cache.value;

                            document.body.appendChild(loopItem.node);
                        }
                    });
                    
                });
                if (vElem.children.length > 0) {
                    this.renderLoops(vElem.children);
                }
                objToLoop.forEach((item) => {
                    /*

                    iterationVelems.forEach((child) => {
                        if (child.attributes.some((e) => e.name === _G.LOOP_ITEM && e.value === vElem.options.variable)) {
                            child.node.innerHTML = item;
                        } 
                    });
                    vElem.node.innerHTML += node.innerHTML;*/
                });
                //vElem.children = [...this.buildVdom(vElem.node, vElem)];
            });
            //console.log(tree)
        },
    };
};
function isInDOM(element) {
    if (!element) return false;
    var rect = element.getBoundingClientRect();
    return rect.top || rect.left || rect.height || rect.width ? true : false;
}
