const resolvePath = (obj, path, separator = ".") => {
    return path
        .trim()
        .split(separator)
        .reduce((prev, curr) => prev && prev[curr], obj);
};
const setPath = (obj, path, value, separator = ".") => {
    path.trim()
        .split(separator)
        .reduce((o, p, i) => {
        return (o[p] = path.trim().split(separator).length === ++i ? value : o[p] || {});
    }, obj);
};
const splitTrim = (string, separator) => {
    return string.split(separator).map((e) => e.trim());
};
const replaceAll = (s, m, r, p) => {
    return s === p || r.includes(m) ? s : replaceAll(s.replace(m, r), m, r, s);
};

const options = {
    LOOP_BIND: "loop",
    LOOP_ITEM: "loop-item",
    LOOP_KEY: "loop-key",
    LOOP_INDEX: "loop-index",
    DATA_BIND: "data-bind",
    TEXT_BIND: "text-bind",
    CLASS_BIND: "class-bind",
    IF_BIND: "if",
    REF: "ref",
    PROPS: "props",
    KEY_ATTR: "key",
    EVENTS_ATTR: [
        "on-click",
        "on-mouseover",
        "on-mouseenter",
        "on-mouseup",
        "on-mousedown",
        "on-submit",
        "on-mouseleave",
        "on-keypress",
        "on-keyup",
        "on-keydown",
        "on-load",
        "on-change",
        "on-input",
        "on-mouseout",
        "on-wheel",
        "on-drag",
        "on-dragend",
        "on-dragenter",
        "on-dragleave",
        "on-dragover",
        "on-dragstart",
        "on-canplay",
        "on-focus",
        "on-contextmenu",
        "on-scroll",
        "on-canplaythrough",
        "on-copy",
    ],
    TEXT_BIND_REGEXP: /\{{([^\}\}]+)+\}}/g,
    IF_SCOPE_REGEXP: /(?=\()(?=((?:(?=.*?\((?!.*?\2)(.*\)(?!.*\3).*))(?=.*?\)(?!.*?\3)(.*)).)+?.*?(?=\2)[^(]*(?=\3$)))/g,
    LOOP_BRACE_REGEXP: /\(([^)]+)\)/,
    LOOP_IN_REGEX: /in(?!.*in)/,
    PARAM_DELIMITER: ",",
    EXP_DELIMITER: "~",
    DOUBLEDOT_DELIMITER: ":",
    LOOP_VAR_REGEX: /\B\$\w+/g
};

const AND = "&&";
const OR = "||";
const EQUAL = "===";
const NOT_EQUAL = "!==";
const MORE = ">";
const LESS = "<";
const MORE_OR_EQUAL = ">=";
const LESS_OR_EQUAL = "<=";
const PLUS = "+";
const MINUS = "-";
const MULT = "*";
const DIV = "/";
const MODULO = "%";
const TRUE = "true";
const FALSE = "false";
const UNDEFINED = "undefined";
const IN = "in";
const NULL = "null";
const globalPrims = [TRUE, FALSE, UNDEFINED, NULL];
const NOT = "!";
const stringDelimiter = "'";
const innerExpBlockRegex = /\(([^()]*)\)/g;
const notRegex = /!+/g;
const comparisonRegexp = new RegExp(`(${EQUAL}|${NOT_EQUAL}|${MORE}|${LESS}|${MORE_OR_EQUAL}|${LESS_OR_EQUAL})`); // DOESN'T WORK FOR MORE_OR_EQUAL AND LESS_OR_EQUAL
const arOpMatchRegex = /([+\-*\/%])/;
const fullArRegex = /([+\-*\/%=<>&|])/;
const arOpPrioMatchRegex = /([*\/%])/;
const stringRegexp = /(['])((\\{2})*|(.*?[^\\](\\{2})*))\1/;
const numberRegexp = /^-?\d+\.?\d*$/;
const dashRegex = /\-/g;
const digitRegex = /([0-9]*[.])?[0-9]+/;
const indexOfRegex = (arr, regex, last = false) => {
    let res;
    for (let u = 0; u < arr.length; u++) {
        if (arr[u] && arr[u].toString().length > 1)
            continue; // avoid matching with negative numbers...
        if (regex.test(arr[u])) {
            res = u;
            if (!last)
                break;
        }
    }
    return res;
};
const computeNumber = (str) => {
    const matches = str.match(dashRegex) || [];
    const match = str.match(digitRegex);
    if (match === null)
        return 0;
    const number = match[0];
    return matches.length % 2 === 0 ? parseFloat(number) : parseFloat(`-${number}`);
};
const getKeysUsed = (str) => {
    if (!str)
        return [];
    const isVar = (str) => !numberRegexp.test(str) && !stringRegexp.test(str) && !fullArRegex.test(str);
    const isLoop = (str) => str.includes(IN);
    const keys = [];
    splitTrim(str, fullArRegex).forEach((val) => {
        if (isLoop(val))
            keys.push(splitTrim(val, IN).pop() || "");
        else if (isVar(val))
            keys.push(val);
    });
    return keys;
};
var StringParser = (_state) => {
    return {
        getPrimFromSplit(split) {
            return split.reduce((acc, str) => {
                const exp = this.computeExp(str);
                return [...acc, exp];
            }, []);
        },
        computeExp(exp) {
            const getNextOp = (split) => {
                let nextOp = indexOfRegex(split, arOpPrioMatchRegex); // *, /, %
                if (!nextOp) {
                    nextOp = indexOfRegex(split, arOpMatchRegex); // +, -
                }
                return nextOp;
            };
            const isVar = (str) => !numberRegexp.test(str) && !stringRegexp.test(str) && !arOpMatchRegex.test(str);
            const isBoolified = (str) => (str.match(notRegex) || []).join().length % 2 !== 0;
            let split = splitTrim(exp, arOpMatchRegex);
            for (let u = 0; u < split.length; u++) {
                // first detect and convert state vars -> use this.getPrimFromStrArr()
                const nakedExp = replaceAll(split[u], NOT, "");
                let res = split[u];
                if (isVar(nakedExp) && !globalPrims.includes(replaceAll(split[u], NOT, ""))) {
                    const varVal = resolvePath(_state, nakedExp);
                    res = ((isBoolified(split[u]) ? !varVal : varVal) || false).toString();
                }
                split[u] = res;
                // second translate strings to js values
                if (globalPrims.includes(replaceAll(split[u], NOT, ""))) {
                    const type = globalPrims.find((e) => e === replaceAll(split[u], NOT, ""));
                    switch (type) {
                        case FALSE:
                            split[u] = false;
                            break;
                        case TRUE:
                            split[u] = true;
                            break;
                        case NULL:
                            split[u] = null;
                            break;
                        case UNDEFINED:
                            split[u] = undefined;
                            break;
                    }
                }
                else {
                    if (!numberRegexp.test(split[u]) && /\d/.test(split[u])) {
                        split[u] = computeNumber(split[u]);
                    }
                    if (numberRegexp.test(split[u])) {
                        split[u] = parseFloat(split[u]);
                    }
                    else if (stringRegexp.test(split[u])) {
                        split[u] = replaceAll(split[u], stringDelimiter, "");
                    }
                }
            }
            // compute that expression
            let nextOp = getNextOp(split);
            while (nextOp) {
                let res;
                const [n1, op, n2] = [split[nextOp - 1], split[nextOp], split[nextOp + 1]];
                switch (op) {
                    case PLUS:
                        res = n1 + n2;
                        break;
                    case MINUS:
                        res = n1 - n2;
                        break;
                    case MULT:
                        res = n1 * n2;
                        break;
                    case DIV:
                        res = n1 / n2;
                        break;
                    case MODULO:
                        res = n1 % n2;
                        break;
                }
                split.splice(nextOp - 1, 3, res);
                nextOp = getNextOp(split);
            }
            const notMatches = (exp.match(notRegex) || []).join();
            const res = notMatches.length % 2 === 0 ? split[0] : !split[0];
            return res;
        },
        computeIfBlock(str) {
            return splitTrim(str, OR)
                .map((s) => splitTrim(s, AND))
                .reduce((or, group) => {
                return or
                    ? or
                    : group.reduce((and, cond) => {
                        let res;
                        const symbolMatch = cond.match(comparisonRegexp)?.[0];
                        let r1, r2;
                        if (!symbolMatch) {
                            res = this.computeExp(cond);
                            [r1, r2] = [false, undefined];
                        }
                        else {
                            [r1, r2] = splitTrim(cond, symbolMatch).map((c) => this.computeExp(c));
                        }
                        switch (symbolMatch) {
                            case EQUAL:
                                res = r1 === r2;
                                break;
                            case NOT_EQUAL:
                                res = r1 !== r2;
                                break;
                            case MORE:
                                res = r1 > r2;
                                break;
                            case LESS:
                                res = r1 < r2;
                                break;
                            case MORE_OR_EQUAL:
                                res = r1 >= r2;
                                break;
                            case LESS_OR_EQUAL:
                                res = r1 <= r2;
                                break;
                        }
                        return and ? res : false;
                    }, true);
            }, false);
        },
        parse(str) {
            // takes a scoped (or not) if statement as string, matches it's blocks () and processes them one after the other;
            // outpouting final result;
            let innerStatements = [...str.matchAll(innerExpBlockRegex)];
            while (innerStatements.length > 0) {
                innerStatements.forEach((regObj) => {
                    str = str.replace(regObj[0], this.computeIfBlock(regObj[1]));
                });
                innerStatements = [...str.matchAll(innerExpBlockRegex)];
            }
            return this.computeIfBlock(str);
        },
    };
};

var NodeParser = (_this, state) => {
    return {
        parse(vElem) {
            const { attributes, node, cache, type } = vElem;
            if (type === "text" && cache.hasOwnProperty("baseText")) {
                node.textContent = this.parseTextContent(cache.baseText, attributes);
            }
            if (attributes.length === 0)
                return node;
            attributes.forEach((att) => {
                if (att.name && att.name.includes("on-")) {
                    this.createEventListener(att, node);
                }
                else {
                    switch (att.name) {
                        case options.CLASS_BIND:
                            node.className = this.parseClasses(att.value, node.className);
                            break;
                    }
                }
            });
        },
        parseClasses(attVal, curClassName) {
            const splitAtt = attVal.split(options.EXP_DELIMITER);
            const attClassesList = splitAtt.map((e) => splitTrim(e, options.DOUBLEDOT_DELIMITER).pop());
            const baseClasses = curClassName.split(" ").filter((bc) => !attClassesList.includes(bc));
            return baseClasses.join(" ") + splitAtt.reduce((acc, exp) => {
                const [cond, clazz] = exp.split(options.DOUBLEDOT_DELIMITER);
                if (StringParser(state).parse(cond)) {
                    return acc + clazz;
                }
                return acc;
            }, "");
        },
        parseTextContent(baseText, attributes) {
            return attributes.reduce((acc, res) => {
                return acc.replace(res.match, resolvePath(state, res.key));
            }, baseText);
        },
        createEventListener(att, node) {
            const [eventType, callbacks] = [att.name.replace("-", "").toLowerCase(), splitTrim(att.value, options.EXP_DELIMITER)];
            node[eventType] = (evt) => {
                callbacks.forEach((cb) => {
                    const argsB = cb.match(options.LOOP_BRACE_REGEXP);
                    let [args, fnName] = [[evt], cb];
                    if (argsB) {
                        args = StringParser(state).getPrimFromSplit(splitTrim(argsB[1], options.PARAM_DELIMITER));
                        fnName = cb.split(options.LOOP_BRACE_REGEXP).shift();
                    }
                    const fn = resolvePath(_this, fnName);
                    if (fn) {
                        fn(...args);
                        return;
                    }
                    throw new Error(`Callback ${fnName} doesn't exist on component "${_this.tagName.toLowerCase()}".`);
                });
            };
        }
    };
};

const main = () => {
    const store = new Map();
    const methodKey = "methods";
    const globalKey = "globals";
    store.set(methodKey, {});
    store.set(globalKey, {});
    return {
        __add(symbol, foreignState) {
            store.set(symbol, foreignState);
            return this;
        },
        __remove(symbol) {
            store.delete(symbol);
            return this;
        },
        __get(symbol) {
            if (!store.has(symbol))
                return this;
            return store.get(symbol).state;
        },
        getEntry(symbol) {
            if (!store.has(symbol))
                return this;
            return store.get(symbol);
        },
        createGlobalState(obj) {
            for (const [key, val] of Object.entries(obj)) {
                if (typeof val === "function") {
                    this.getGlobal()[key] = val;
                    continue;
                }
                const entry = { val, corStates: [] };
                this.getGlobal()[key] = entry;
            }
            return this;
        },
        addSymbolToKey(key, symbol) {
            this.getGlobal()[key].corStates.push(symbol);
            return this;
        },
        setGlobal(key, val) {
            let entry = this.getGlobal()[key];
            if (!entry) {
                entry = { val, corStates: [] };
                this.getGlobal()[key] = entry.val;
            }
            entry.val = val;
            entry.corStates.forEach((symbol) => {
                const ctx = this.getEntry(symbol).ctx;
                ctx.setState(key, entry.val);
            });
            return this;
        },
        getGlobal(key = null) {
            if (!key)
                return store.get(globalKey);
            return store.get(globalKey)[key].val;
        },
        getGlobalProps() {
            return {
                ...this.getGlobal(),
                getGlobal: this.getGlobal,
                setGlobal: this.setGlobal,
            };
        },
    };
};
var store = main();

var Vdom = (_this, symbol) => {
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
            const matches = [...node.textContent.matchAll(options.TEXT_BIND_REGEXP)];
            const results = matches.reduce((acc, match) => {
                return [...acc, { match: match[0], key: match[1].trim(), keysUsed: [match[1].trim()] }];
            }, []);
            return results;
        },
        getAttributes(node) {
            const possibleAttrs = [options.LOOP_BIND, options.LOOP_ITEM, options.LOOP_INDEX, options.IF_BIND, options.CLASS_BIND, ...options.EVENTS_ATTR];
            const nodeAttrs = [];
            possibleAttrs.forEach((attrName) => {
                if (node.hasAttribute(attrName)) {
                    const att = node.getAttribute(attrName);
                    if (typeof att === "string") {
                        nodeAttrs.push({ name: attrName, value: att, keysUsed: getKeysUsed(att.split(":").shift() || "") });
                    }
                }
            });
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
            let [variable, key] = splitTrim(attrVal, options.LOOP_IN_REGEX);
            let index;
            const match = variable.match(options.LOOP_BRACE_REGEXP);
            if (match) {
                const [varr, i] = splitTrim(match[1], options.PARAM_DELIMITER);
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
            const objToLoop = resolvePath(store.__get(symbol), key);
            Object.entries(objToLoop).forEach(([key, value]) => {
                vElem.children = [
                    ...vElem.children,
                    ...this.buildVdom(vElem.node.cloneNode(true), vElem, { value, key, variable, index }),
                ];
            });
            vElem.node.innerHTML = "";
        },
        buildIfChildren(vElem, key) {
            [...key.matchAll(options.LOOP_VAR_REGEX)].forEach((m) => {
                const targetLoop = this.findLoopForIf(vElem, m[0]);
                if (targetLoop) {
                    key = key.replace(m[0], targetLoop.cache.key);
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
        findParentLoopBody(loopItem) {
            let vNode = loopItem;
            const attrItem = attrFind(loopItem.attributes, options.LOOP_ITEM);
            const attrIndex = attrFind(loopItem.attributes, options.LOOP_INDEX);
            while (vNode) {
                if (attrItem && attrItem.value === vNode?.cache?.variable) {
                    return { vNode, type: "value" };
                }
                else if (attrIndex && attrIndex.value === vNode?.cache?.index) {
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
                        loopItem.node.innerHTML = parentLoop.vNode.cache[parentLoop.type];
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
            setPath(store.__get(symbol), key, val);
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

function createComp(name, defineComp) {
    customElements.define(name, class extends HTMLElement {
        constructor() {
            super();
            this.storeSymbol = Symbol();
            this.Vdom = Vdom(this, this.storeSymbol);
            this.attached = false;
            this.setStateQueue = [];
            this.setState = () => void 0;
            const createState = (initState = {}) => {
                store.__add(this.storeSymbol, { ctx: this, state: initState });
                this.setState = (key, val) => {
                    this.setStateQueue.unshift({ key, val });
                    this.execSetStateQueue();
                };
                return { state: store.__get(this.storeSymbol), setState: this.setState };
            };
            const registerFn = (fns) => {
                Object.entries(fns).forEach(([name, fn]) => {
                    // @ts-ignore :)
                    this[name] = fn;
                });
            };
            this.cycle = Object.seal({
                beforeInit: () => void 0,
                onInit: () => void 0,
                onRender: () => void 0,
            });
            const cycle = (cbs) => {
                for (const key of Object.keys(cbs)) {
                    if (!["beforeInit", "onInit", "onRender"].includes(key)) {
                        throw new Error("life cycle functions can only be called beforeInit, onInit and onRender");
                    }
                }
                Object.assign(this.cycle, cbs);
            };
            const useGlobal = (key) => {
                store.addSymbolToKey(key, this.storeSymbol);
                return store.getGlobal()[key].val;
            };
            const html = defineComp({ createState, registerFn, cycle, useGlobal });
            const shadowRoot = this.attachShadow({ mode: "open" });
            shadowRoot.innerHTML = html;
            this.props = {};
            this.linkProps();
        }
        connectedCallback() {
            this.attached = true;
            this.cycle.beforeInit();
            this.Vdom.scanNode();
            this.execSetStateQueue();
            this.cycle.onInit();
            this.Vdom.renderLoops();
            this.Vdom.renderIfs();
            this.cycle.onRender();
        }
        linkProps() {
            if (this.attributes.hasOwnProperty("props")) {
                // @ts-ignore
                const props = splitTrim(this.attributes.props.value, ",");
                props.forEach((prop) => {
                    const [key, path] = prop.includes(":") ? splitTrim(prop, ":") : [prop, prop];
                    // @ts-ignore
                    const parentVal = resolvePath(this.getRootNode().host, path);
                    this.props[key] = parentVal;
                });
            }
        }
        execSetStateQueue() {
            if (!this.attached)
                return;
            while (this.setStateQueue.length !== 0) {
                const curSetState = this.setStateQueue.pop();
                this.Vdom.update(curSetState.key, curSetState.val);
            }
        }
    });
}

export { createComp, store };
