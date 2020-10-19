import * as _H from "./helpers.js";
import _G from "./_GLOBALS_.js";
import StringParser, { sanitizeVar } from "./StringParser.js";
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
                return {
                    attributes: [{ keysUsed: _H.getVarNameUsed(node.textContent) }],
                    type: "text",
                    variableName: null,
                    indexName: null,
                    numIndexName: null,
                    key: null,
                };
            }
            const attributes = this.getAttributes(node);
            const type = this.classify(attributes);
            const [variableName, indexName, numIndexName, key] = this.getKeyAndCondition(type, attributes);
            if (type === "loop" && ((variableName && variableName[0] !== "$") || (indexName && indexName[0] !== "$"))) {
                throw new Error("Declared loop variables must start with '$'.");
            }
            return { attributes, type, variableName, indexName, numIndexName, key };
        },
        getAttributes(node) {
            const nodeAttrs = [];
            for (let u = 0; u < node.attributes.length; u++) {
                let { value, name } = node.attributes[u];
                if (value.includes(_G.DOUBLEDOT_DELIMITER)) {
                    value = value.split(_G.DOUBLEDOT_DELIMITER).shift() ?? "";
                }
                ;
                nodeAttrs.push({
                    name,
                    value,
                    keysUsed: _H.getVarNameUsed(value),
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
            let [variableName, key] = _H.splitTrim(attrVal, _G.LOOP_IN_REGEX);
            key = sanitizeVar(key);
            let indexName;
            let numIndexName;
            const match = variableName.match(_G.LOOP_BRACE_REGEXP);
            if (match) {
                const [varName, iName, numName] = _H.splitTrim(match[1], _G.PARAM_DELIMITER);
                variableName = varName;
                indexName = iName;
                numIndexName = numName;
            }
            return [variableName, indexName, numIndexName, key];
        },
        getKeyAndCondition(type, attrs) {
            const attrVal = attrs.find((a) => a.name === type);
            if (attrVal) {
                let [variableName, indexName, numIndexName, key] = [true, attrVal.value, 0, 0];
                switch (type) {
                    case "loop": {
                        [variableName, indexName, numIndexName, key] = this.parseLoopAttr(attrVal.value);
                        break;
                    }
                    case "if": {
                        key = attrVal.value;
                        indexName = null;
                        break;
                    }
                }
                return [variableName, indexName, numIndexName, key];
            }
            return [true, 0, undefined, undefined];
        },
        createVelem(node, parent, cache) {
            const { attributes, type, variableName, indexName, numIndexName, key } = this.getNodeInfo(node);
            if (type === "loop")
                console.log(attributes);
            const vElem = {
                attributes,
                updateKeys: (attributes || []).map((at) => at.keysUsed).flat(),
                tag: node.tagName,
                type,
                options: { variableName, key, indexName, numIndexName },
                cache,
                node,
                baseHTML: node.innerHTML,
                children: [],
                parent,
                nodeIndex: indexOfEl(node),
            };
            switch (type) {
                case "loop": {
                    this.buildLoopChildren(vElem, key, indexName, variableName, numIndexName);
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
        buildLoopChildren(vElem, key, indexName, variableName, numIndexName) {
            if (key.includes(_G.RANGE_LOOP_DOTS)) {
                const [start, finish] = _H.splitTrim(key, _G.RANGE_LOOP_DOTS).map((n) => parseInt(n));
                for (let u = start; u < finish; u++) {
                    vElem.children = [
                        ...vElem.children,
                        ...this.buildVdom(vElem.node.cloneNode(true), vElem, {
                            value: u.toString(),
                            key,
                            index: (u - start).toString(),
                            variableName,
                            indexName,
                            numIndexName,
                        }),
                    ];
                }
                vElem.node.innerHTML = "";
                return;
            }
            console.log(key);
            const objToLoop = _H.resolvePath(store.__get(symbol), key);
            Object.entries(objToLoop).forEach(([key, value], index) => {
                vElem.children = [
                    ...vElem.children,
                    ...this.buildVdom(vElem.node.cloneNode(true), vElem, {
                        value,
                        key,
                        index: index.toString(),
                        variableName,
                        indexName,
                        numIndexName,
                    }),
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
            const condition = StringParser(store.__get(symbol), vElem).parse(key);
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
                concernedLoops.forEach((cloop) => {
                    cloop.cache = { ...cloop.cache, display: vElem.condition };
                });
                this.renderLoops(concernedLoops);
            });
        },
        rebuildLoop(loopVnode, key) {
            loopVnode.children = [];
            loopVnode.node.innerHTML = loopVnode.baseHTML;
            const { variableName, indexName, numIndexName } = this.getNodeInfo(loopVnode.node);
            this.buildLoopChildren(loopVnode, key, indexName, variableName, numIndexName);
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
            const vChildrenByKey = this.getVChildren(null, key);
            vChildrenByKey.forEach((vChild) => {
                NodeParser(_this, store.__get(symbol)).parse(vChild);
            });
            const loopsToRerender = this.getVChildren("loop", key);
            loopsToRerender.forEach((loopBlock) => {
                loopBlock = this.rebuildLoop(loopBlock, key);
            });
            this.renderLoops(loopsToRerender);
            const ifsToRerender = this.getVChildren("if", key);
            ifsToRerender.forEach((ifBlock) => {
                ifBlock = this.rebuildIf(ifBlock);
            });
            this.renderIfs(ifsToRerender);
        },
    };
};
