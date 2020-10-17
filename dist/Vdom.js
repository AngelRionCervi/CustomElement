import * as _H from "./helpers.js";
import _G from "./_GLOBALS_.js";
import StringParser, { getKeysUsed } from "./StringParser.js";
import NodeParser from "./NodeParser.js";
import store from "./Store.js";
export default (_this, symbol) => {
    let tree = null;
    const indexOfEl = (element) => {
        if (element && element.parentNode) {
            return Array.from(element.parentNode.children).indexOf(element);
        }
        return -1;
    };
    const attrFind = (attrs, key) => {
        return attrs.find((at) => at.name === key);
    };
    return {
        scanNode() {
            tree = this.buildVdom().filter((e) => e.tag !== "STYLE");
            return tree;
        },
        getNodeInfo(node) {
            if (node.nodeType === 3) {
                return { attributes: this.getTextBind(node), type: "text", variable: null, index: null, key: null };
            }
            const attributes = this.getAttributes(node);
            const type = this.classify(attributes);
            const [variable, index, key] = this.getKeyAndCondition(type, attributes);
            if (type === "loop" && ((variable && variable[0] !== "$") || (index && index[0] !== "$"))) {
                throw new Error("Declared loop variables must start with '$'.");
            }
            return { attributes, type, variable, index, key };
        },
        getTextBind(node) {
            if (!node.textContent)
                return null;
            const matches = [...node.textContent.matchAll(_G.TEXT_BIND_REGEXP)];
            const results = matches.reduce((acc, match) => {
                return [...acc, { match: match[0], key: match[1].trim(), keysUsed: [match[1].trim()] }];
            }, []);
            return results;
        },
        getAttributes(node) {
            const nodeAttrs = [];
            for (let u = 0; u < node.attributes.length; u++) {
                const { value, name } = node.attributes[u];
                nodeAttrs.push({
                    name,
                    value,
                    keysUsed: getKeysUsed(value.split(":").shift() || ""),
                });
            }
            return nodeAttrs;
        },
        classify(attrs) {
            const attrList = attrs.map((a) => a.name);
            if (attrList.includes("loop")) {
                return "loop";
            }
            else if (attrList.includes("if")) {
                return "if";
            }
            else {
                return "vanilla";
            }
        },
        parseLoopAttr(attrVal) {
            let [variable, key] = _H.splitTrim(attrVal, _G.LOOP_IN_REGEX);
            let index;
            const match = variable.match(_G.LOOP_BRACE_REGEXP);
            if (match) {
                const [varr, i] = _H.splitTrim(match[1], _G.PARAM_DELIMITER);
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
                updateKeys: (attributes || []).map((at) => at.keysUsed).flat(),
                tag: node.tagName,
                type,
                options: { variable, key, index },
                cache,
                node,
                baseHTML: node.innerHTML,
                children: [],
                parent,
                nodeIndex: indexOfEl(node),
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
                case "text": {
                    this.buildTextChildren(vElem);
                    break;
                }
                default: {
                    if (node.tagName !== "STYLE") {
                        vElem.children = [...vElem.children, ...this.buildVdom(node, vElem, vElem.cache)];
                    }
                    break;
                }
            }
            NodeParser(_this, store.__get(symbol)).parse(vElem);
            return vElem;
        },
        buildLoopChildren(vElem, key, index, variable) {
            const objToLoop = _H.resolvePath(store.__get(symbol), key);
            Object.entries(objToLoop).forEach(([key, value]) => {
                vElem.children = [
                    ...vElem.children,
                    ...this.buildVdom(vElem.node.cloneNode(true), vElem, { value, key, variable, index }),
                ];
            });
            vElem.node.innerHTML = "";
        },
        buildIfChildren(vElem, key) {
            [...key.matchAll(_G.LOOP_VAR_REGEX)].forEach((m) => {
                const corCache = _H.findCache(m[0], vElem, true);
                if (corCache) {
                    let cachedVal = m[0].includes(_G.OBJECT_SEPARATOR)
                        ? vElem.cache[corCache.type][m[0].split(_G.OBJECT_SEPARATOR).splice(1, 1).join()]
                        : vElem.cache[corCache.type];
                    if (typeof cachedVal === "string")
                        cachedVal = `'${cachedVal}'`;
                    key = key.replace(m[0], cachedVal);
                }
            });
            const condition = StringParser(store.__get(symbol)).parse(key);
            vElem.children = [...vElem.children, ...this.buildVdom(vElem.node, vElem, { display: condition })];
            vElem.options.key = key;
            vElem.condition = condition;
            vElem.node.innerHTML = "";
        },
        buildTextChildren(vElem) {
            if (vElem.cache && vElem.cache.hasOwnProperty("baseText"))
                return;
            vElem.cache = { ...vElem.cache, baseText: vElem.node.textContent };
        },
        buildVdom(node = _this.shadowRoot, parent = { node: _this.shadowRoot }, cache) {
            const res = [];
            let stk = [];
            if (node.firstChild)
                stk.push(node.firstChild);
            while (stk.length !== 0) {
                let currentNode = stk.pop();
                if (!currentNode)
                    continue;
                const vElem = this.createVelem(currentNode, parent, cache);
                res.push(vElem);
                if (currentNode.nextSibling) {
                    stk.push(currentNode.nextSibling);
                }
            }
            return res;
        },
        getAllChildrenFlat(vNodes) {
            const res = [];
            const stack = [...vNodes];
            while (stack.length !== 0) {
                const currentChild = stack.pop();
                if (!currentChild)
                    continue;
                res.push(currentChild);
                stack.push(...currentChild.children);
            }
            return res.reverse();
        },
        findParentLoopBody(vElem) {
            const attrItem = attrFind(vElem.attributes, _G.LOOP_ITEM);
            const attrIndex = attrFind(vElem.attributes, _G.LOOP_INDEX);
            const varRes = _H.findCache(attrItem?.value, vElem);
            const indexRes = _H.findCache(attrIndex?.value, vElem);
            if (varRes)
                return { vElem, type: "value" };
            else if (indexRes)
                return { vElem, type: "key" };
            return false;
        },
        getVChildren(type = null, key = null, starting = tree) {
            const res = [];
            const exploreChildren = (vNodes) => {
                for (let u = 0; u < vNodes.length; u++) {
                    if ((vNodes[u].type === type && !key) ||
                        (!type && key && vNodes[u].updateKeys.includes(key)) ||
                        (vNodes[u].type === type && key && vNodes[u].updateKeys.includes(key))) {
                        res.push(vNodes[u]);
                        continue;
                    }
                    exploreChildren(vNodes[u].children);
                }
            };
            exploreChildren(starting);
            return res;
        },
        renderLoops(corVelem) {
            if (!corVelem) {
                corVelem = this.getVChildren("loop");
            }
            for (let u = 0; u < corVelem.length; u++) {
                if (corVelem[u]?.cache?.display === false)
                    continue;
                const loopItems = this.getAllChildrenFlat(corVelem[u].children);
                loopItems.forEach((loopItem) => {
                    const parentLoop = this.findParentLoopBody(loopItem);
                    if (parentLoop) {
                        loopItem.node.innerHTML = parentLoop.vElem.cache[parentLoop.type];
                    }
                    loopItem.parent.node.appendChild(loopItem.node);
                });
                const concernedIfs = this.getVChildren("if", null, corVelem[u].children);
                this.renderIfs(concernedIfs);
            }
        },
        renderIfs(corVelem) {
            if (!corVelem) {
                corVelem = this.getVChildren("if");
            }
            corVelem.forEach((vElem) => {
                if (vElem.condition) {
                    vElem.children.forEach((child) => {
                        vElem.node.appendChild(child.node);
                    });
                }
                else {
                    vElem.node.innerHTML = "";
                }
                const concernedLoops = this.getVChildren("loop", null, vElem.children);
                this.renderLoops(concernedLoops);
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
            ifVnode.node.innerHTML = "";
            const { key } = this.getNodeInfo(ifVnode.node);
            this.buildIfChildren(ifVnode, key);
            return ifVnode;
        },
        update(key, val) {
            _H.setPath(store.__get(symbol), key, val);
            const loopsToRerender = this.getVChildren("loop", key);
            loopsToRerender.forEach((loop) => {
                loop = this.rebuildLoop(loop, key);
            });
            this.renderLoops(loopsToRerender);
            const ifsToRerender = this.getVChildren("if", key);
            ifsToRerender.forEach((iff) => {
                iff = this.rebuildIf(iff);
            });
            this.renderIfs(ifsToRerender);
            const vChildrenByKey = this.getVChildren(null, key);
            vChildrenByKey.forEach((vChild) => {
                NodeParser(_this, store.__get(symbol)).parse(vChild);
            });
        },
    };
};
