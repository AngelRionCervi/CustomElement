import * as _H from "../lib/helpers.js";
import _G from "../lib/_GLOBALS_.js";
import IfParser from "./IfParser.js";

export default (_this) => {
    let tree = null;
    return {
        scanNode() {
            tree = this.buildVdom().filter((e) => e.tag !== "STYLE");
            return tree;
        },
        createUniqId() {
            return "_" + Math.random().toString(36).substr(2, 9);
        },
        getNodeInfo(node) {
            if (node.nodeType === 3) {
                return { attributes: [], type: "text", variable: null, index: null, key: null };
            }
            const attributes = this.getAttributes(node);
            const type = this.classify(attributes);
            const [variable, index, key] = this.getKeyAndCondition(type, attributes);
            if (type === "loop" && ((variable && variable[0] !== "$") || (index && index[0] !== "$"))) {
                throw new Error("Declared loop variables must start with '$'.");
            }
            return { attributes, type, variable, index, key };
        },
        getAttributes(node) {
            const possibleAttrs = [_G.LOOP_BIND, _G.LOOP_ITEM, _G.LOOP_INDEX, _G.IF_BIND];
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
                let [variable, index, key] = [true, attrVal.value, 0];
                switch (type) {
                    case "loop": {
                        [variable, index, key] = this.parseLoopAttr(attrVal.value);
                        break;
                    }
                    case "if": {
                        key = attrVal.value;
                        index = null;
                        break;
                    }
                }
                return [variable, index, key];
            }
            return [true, 0, undefined];
        },
        createVelem(node, parent, cache) {
            const { attributes, type, variable, index, key } = this.getNodeInfo(node);

            const vElem = {
                attributes,
                tag: node.tagName,
                type,
                options: { variable, key, index },
                cache,
                node,
                baseHTML: node.innerHTML,
                outerBaseHTML: node.outerHTML,
                children: [],
                parent,
                nodeIndex: indexOfEl(node),
                nodeCopy: node.cloneNode(true),
                id: this.createUniqId(),
            };

            switch (type) {
                case "loop": {
                    this.buildLoopChildren(vElem, key, index, variable);
                    break;
                }
                case "if": {
                    this.buildIfChildren(vElem, key);
                    break;
                }
                default: {
                    if (node.tagName !== "STYLE") {
                        const vChildren = this.buildVdom(node, vElem);
                        vChildren.forEach((vc) => {
                            vElem.children.push(vc);
                        });
                    }
                    break;
                }
            }
            return vElem;
        },
        buildLoopChildren(vElem, key, index, variable) {
            const objToLoop = _H.resolvePath(_this.state, key);
            Object.entries(objToLoop).forEach(([key, value]) => {
                const vChildren = this.buildVdom(vElem.node.cloneNode(true), vElem, { value, key, variable, index });
                vChildren.forEach((vc) => {
                    vElem.children.push(vc);
                });
            });
            vElem.node.innerHTML = "";
        },
        buildIfChildren(vElem, key) {
            [...key.matchAll(_G.LOOP_VAR_REGEX)].forEach((m) => {
                const targetLoop = this.findLoopForIf(vElem, m[0]);
                key = key.replace(m[0], targetLoop.cache.key);
            });
            const condition = IfParser(_this.state).parse(key);
            const vChildren = this.buildVdom(vElem.node, vElem, { condition });
            vChildren.forEach((vc) => {
                vElem.children.push(vc);
            });
            console.log(vElem)
            vElem.options.key = key;
            vElem.condition = condition;
            vElem.node.innerHTML = "";
            
        },
        buildVdom(node = _this.shadowRoot, parent = { node: _this.shadowRoot }, cache) {
            const res = [];

            let stk = [];
            if (node.firstChild) stk.push(node.firstChild);

            while (stk.length !== 0) {
                let currentNode = stk.pop();

                const vElem = this.createVelem(currentNode, parent, cache);
                res.push(vElem);

                if (currentNode.nextSibling) {
                    stk.push(currentNode.nextSibling);
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
        findLoopForIf(vElem, match) {
            while (vElem) {
                if (match === vElem?.cache?.variable || match === vElem?.cache?.index) {
                    return vElem;
                }
                vElem = vElem.parent;
            }
            return false;
        },
        getFirstVchild(type, key = null, blackListedNodes = [], starting = tree) {
            // devrais trouver le/les premier objets loop à une certaine profondeurs, puis les return;
            const res = [];
            const blackListedIds = blackListedNodes.map((e) => e.id);
            const exploreChildren = (vNodes) => {
                for (let u = 0; u < vNodes.length; u++) {
                    if (blackListedIds.includes(vNodes[u].id)) break;
                    if ((vNodes[u].type === type && key && vNodes[u]?.options?.key === key) || (vNodes[u].type === type && !key)) {
                        res.push(vNodes[u]);
                    } else {
                        exploreChildren(vNodes[u].children);
                    }
                }
            };
            exploreChildren(starting);
            return res;
        },
        renderLoops(corVelem = this.getFirstVchild("loop")) {
            corVelem.forEach((vElem) => {
                if (!isInDOM(vElem.node)) {
                    insertChildAtIndex(vElem.parent.node, vElem.node, vElem.nodeIndex);
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
        renderIfs(corVelem = this.getFirstVchild("if")) {
            corVelem.forEach((vElem) => {
                if (vElem.condition) {
                    vElem.node.innerHTML = vElem.baseHTML;
                } else {
                    vElem.node.innerHTML = "";
                }
            });
        },
        rebuildLoop(loopVnode, key) {
            loopVnode.children = [];
            loopVnode.node.innerHTML = loopVnode.baseHTML;
            const { variable, index } = this.getNodeInfo(loopVnode.node);
            this.buildLoopChildren(loopVnode, key, index, variable);
            return loopVnode;
        },
        rebuildIf(ifVnode) {
            ifVnode.children = [];
            ifVnode.node.innerHTML = "";
            const { key } = this.getNodeInfo(ifVnode.node);
            this.buildIfChildren(ifVnode, key);
            return ifVnode;
        },
        update(key, val) {
            // devrais chercher le dom pour des loop en prio, les loop se chargent de rerender les ifs inclus (fn pour trouver les premiers ifs de chaques loop)
            // si pas de loop on cherche pour les ifs et ont les rerender
            _H.setPath(_this.state, key, val);
            const loopsToRerender = this.getFirstVchild("loop", key);
            const ifsToRerender = this.getFirstVchild("if", null, loopsToRerender); // gets the ifs OUTSIDE loops to rerender
            const concernedIfs = this.getFirstVchild("if", null, [], loopsToRerender); // gets the ifs INSIDE loops to rerender
            const concernedLoops = this.getFirstVchild("loop", null, [], ifsToRerender);
            console.log(concernedLoops, ifsToRerender);
            // the ifs in a loop has to be rerendered anyway, this way we dont rerender ifs inside of loops 2 times.
            loopsToRerender.forEach((loop) => {
                loop = this.rebuildLoop(loop, key);
            });
            this.renderLoops(loopsToRerender);
            this.renderIfs(concernedIfs);

            ifsToRerender.forEach((iff) => {
                iff = this.rebuildIf(iff, key);
            });
            this.renderIfs(ifsToRerender);
            this.renderLoops(concernedLoops);
        },
    };
};

function isInDOM(element) {
    if (!element) return false;
    var rect = element.getBoundingClientRect();
    return rect.top || rect.left || rect.height || rect.width ? true : false;
}

function insertChildAtIndex(elem, child, index) {
    if (!index) index = 0;
    if (index >= elem.children.length) {
        elem.appendChild(child);
    } else {
        elem.insertBefore(child, elem.children[index]);
    }
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
