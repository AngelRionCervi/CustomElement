import * as _H from "../lib/helpers.js";
import _G from "../lib/_GLOBALS_.js";

export default (_this) => {
    let tree = null;
    return {
        scanNode() {
            tree = this.buildVdom().filter((e) => e.tag !== "STYLE");
            return tree;
        },
        getNodeInfo(node) {
            const attributes = this.getAttributes(node);
            const type = this.classify(attributes);
            const [variable, index, key] = this.getKeyAndCondition(type, attributes);
            return { attributes, type, variable, index, key };
        },
        getAttributes(node) {
            const possibleAttrs = [_G.LOOP_BIND, _G.LOOP_ITEM, _G.LOOP_INDEX];
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
                return "vanilla";
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
            return [variable, index, key];
        },
        getKeyAndCondition(type, attrs) {
            const attrVal = attrs.find((a) => a.name === type);
            if (attrVal) {
                let [variable, index, key] = [true, attrVal.value];
                switch (type) {
                    case "loop": {
                        [variable, index, key] = this.parseLoopAttr(attrVal.value);
                        break;
                    }
                }
                return [variable, index, key];
            }
            return [true, 0, undefined];
        },
        createVelem(node, parent = null) {
            const { attributes, type, variable, index, key } = this.getNodeInfo(node);

            const vElem = { attributes, tag: node.tagName, type, options: { variable, key }, node, baseHTML: node.innerHTML, children: [], parent };

            switch (type) {
                case "loop": {
                    this.buildLoopChildren(vElem, key, index, variable, node);
                    break;
                }
                default: {
                    if (node.tagName !== "STYLE") {
                        const vChild = this.buildVdom(node.cloneNode(true), vElem);
                        vChild.forEach((vc) => {
                            vElem.children.push(vc);
                        });
                    }
                    break;
                }
            }
            return vElem;
        },
        buildLoopChildren(vElem, key, index, variable, baseNode = null) {
            const node = baseNode ? baseNode : vElem.node;
            const objToLoop = _H.resolvePath(_this.state, key);
            Object.entries(objToLoop).forEach(([key, value]) => {
                const vChild = this.buildVdom(node.cloneNode(true), vElem);
                vChild.forEach((vc) => {
                    vc.cache = { value, key, variable, index };
                    vElem.children.push(vc);
                });
            });
            vElem.node.innerHTML = "";
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
        findChildrenLoopItem(children) {
            const res = [];
            const stack = [...children];

            while (stack.length !== 0) {
                const currentChild = stack.pop();
                res.push(currentChild);
                stack.push(...currentChild.children);
            }
            return res.reverse();
        },
        findParentLoopBody(loopItem) {
            let vNode = loopItem;
            const attrItem = attrFind(loopItem.attributes, _G.LOOP_ITEM);
            const attrIndex = attrFind(loopItem.attributes, _G.LOOP_INDEX);
            while (vNode) {
                if (attrItem && attrItem.value === vNode?.cache?.variable) {
                    return { vNode, type: "value" };
                } else if (attrIndex && attrIndex.value === vNode?.cache?.index) {
                    return { vNode, type: "key" };
                }
                vNode = vNode.parent;
            }
            return false;
        },
        getFirstChildrenLoopBody(key = null) {
            const res = [];
            const vNodes = [...tree];
            while (vNodes.length !== 0) {
                const curVnode = vNodes.pop();
                if (curVnode.type === "loop" && key && curVnode?.options?.key === key) {
                    res.push(curVnode);
                } else if (curVnode.type === "loop" && !key) {
                    res.push(curVnode);
                } else {
                    vNodes.push(...curVnode.children);
                }
            }
            return res;
        },
        renderLoops() {
            const corVelem = this.getFirstChildrenLoopBody();
            console.log("RERENDER LOOPS", corVelem);
            corVelem.forEach((vElem, index) => {
                if (vElem.parent) {
                    if (index === 0) vElem.parent.node.innerHTML = ""; // ooga booga do it before ooga
                    vElem.parent.node.appendChild(vElem.node);
                }
                const loopItems = this.findChildrenLoopItem(vElem.children);
                loopItems.forEach((loopItem) => {
                    const parentLoop = this.findParentLoopBody(loopItem);
                    if (parentLoop) {
                        loopItem.node.innerHTML = parentLoop.vNode.cache[parentLoop.type];
                    }
                    loopItem.parent.node.appendChild(loopItem.node);
                });
            });
        },
        rebuildLoop(loopVnode, key) {
            loopVnode.children = [];
            loopVnode.node.innerHTML = loopVnode.baseHTML;
            const { variable, index } = this.getNodeInfo(loopVnode.node);
            this.buildLoopChildren(loopVnode, key, index, variable)
            return loopVnode;
        },
        update(key, val) {
            _H.setPath(_this.state, key, val);
            const loopsToRerender = this.getFirstChildrenLoopBody(key); // doesnt work for nested loops
            loopsToRerender.forEach((loop) => {
                loop = this.rebuildLoop(loop, key);
            });
            this.renderLoops();
        },
    };
};

function isInDOM(element) {
    if (!element) return false;
    var rect = element.getBoundingClientRect();
    return rect.top || rect.left || rect.height || rect.width ? true : false;
}

Element.prototype.insertChildAtIndex = function (child, index) {
    if (!index) index = 0;
    if (index >= this.children.length) {
        this.appendChild(child);
    } else {
        this.insertBefore(child, this.children[index]);
    }
};

function indexOfEl(element) {
    return Array.from(element.parentNode.children).indexOf(element);
}

function attrFind(attrs, key) {
    return attrs.find((at) => at.name === key);
}

function attrIncludes(attrs, key) {
    return attrs.some((at) => at.name === key);
}
