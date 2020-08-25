const LOOP_BIND = "loop";
const LOOP_ITEM = "loop-item";
const LOOP_INDEX = "loop-index";
const DATA_BIND = "data-bind";
const TEXT_BIND = "text-bind";
const CLASS_BIND = "class-bind";
const IF_BIND = "if-bind";
const REF = "ref";
const PROPS = "props";
const KEY_ATTR = "key";
const EVENTS_ATTR = [
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
];
const TEXT_BIND_REGEXP = /\{{([^\}\}]+)+\}}/g;

function hasSomeParentTheLoop(element) {
    if (!element.hasAttribute) return false;
    if (element.hasAttribute(`[${LOOP_BIND}]`)) return true;
    return element.parentNode && hasSomeParentTheLoop(element.parentNode);
}

export default class CustomElement extends HTMLElement {
    constructor() {
        super();
        this.binds = new Map();
        this.events = new Map();
        this.props = {};
        this.refs = {};
    }

    connectedCallback() {
        this.binds.set(DATA_BIND, []);
        this.binds.set(TEXT_BIND, []);
        this.binds.set(CLASS_BIND, []);
        this.binds.set(IF_BIND, []);
        this.binds.set(LOOP_BIND, []);
        if (typeof this.beforeInit === "function") this.beforeInit();
        this.detectIfs();
        this.detectLoops();
        this.detectEvents();
        this.assignRefs();
        this.assignEvents();
        if (this.attributes.hasOwnProperty(PROPS)) {
            this.linkProps();
        }
        if (typeof this.onInit === "function") this.onInit();
        this.renderIfs();
        //this.renderLoops();
        this.detectBinds();
        this.updateBinds();
        if (typeof this.onRender === "function") this.onRender();
    }

    linkProps() {
        const props = this.attributes.props.value.split(" ");
        props.forEach((prop) => {
            const [key, path] = prop.includes("=") ? prop.split("=").map((e) => e.trim()) : [prop, prop];
            const parentVal = this.resolvePath(this.getRootNode().host, path);
            this.props[key] = parentVal;
        });
    }

    renderIfs(key = null, elem = null) {
        this.filterBinds(key, elem)
            .get(IF_BIND)
            .forEach((ifBind) => {
                const test = this.resolvePath(this.state, ifBind.key);
                ifBind.elem.innerHTML = "";
                if (test) ifBind.elem.innerHTML = ifBind.innerSTuff;
                // this.updateElementBinds(ifBind.elem);
            });
    }

    renderLoops(key = null, elem = null) {
        //console.log(this.filterBinds(key, elem, true).get(LOOP_BIND))
        this.filterBinds(key, elem)
            .get(LOOP_BIND)
            .forEach((loop) => {
                const arrayToLoop = this.resolvePath(this.state, loop.key);
                const htmlToLoop = loop.innerStuff;
                loop.elem.innerHTML = "";
                loop.size = arrayToLoop.length;
                loop.items = arrayToLoop;
                loop.items.forEach((item) => {
                    const node = this.stringToHtml(`<div>${htmlToLoop}</div>`);
                    [...this.selectAll(`[${LOOP_ITEM}]`, node)].forEach((child) => {
                        const itemVar = child.getAttribute(LOOP_ITEM);
                        if (itemVar === loop.variable) {
                            child.innerHTML = item;
                        }
                    });
                    loop.elem.innerHTML += node.innerHTML;
                });
                this.updateElementBinds(loop.elem, key);
            });
    }

    updateElementBinds(elem, key) {
 

        console.log(this.detectLoops(elem))
        const loopBinds = this.binds.get(LOOP_BIND);


        this.detectIfs(elem).forEach((bind) => {
            this.renderIfs(bind.key, bind.elem);
        });
        this.detectLoops(elem).forEach((bind) => {
            this.renderLoops(bind.key, bind.elem);
        });
        console.log("loop bind length : " + this.binds.get(LOOP_BIND).length)
        this.detectBinds(elem);
        this.updateBinds(null, elem, true);
    }

    detectBinds(node = null) {
        const dataBinds = [...this.selectAll(`[${DATA_BIND}]`, node)].reduce((acc, elem) => {
            const attrVal = elem.getAttribute(DATA_BIND);
            let [condition, key] = [true, attrVal];
            if (attrVal.includes(":")) [condition, key] = this.splitTrim(attrVal, ":");
            return [...acc, { elem, key, condition }];
        }, []);
        const textBinds = [...this.selectAll("*", node)].reduce((acc, elem) => {
            const newBinds = [];
            if (elem.firstChild && elem.firstChild.nodeType === 3) {
                const matches = [...elem.firstChild.textContent.matchAll(TEXT_BIND_REGEXP)];
                const results = matches.reduce((acc, match) => {
                    return [...acc, { match: match[0], key: match[1], index: elem.textContent.indexOf(match[0]) }];
                }, []);
                if (results.length > 0) {
                    newBinds.push({
                        elem,
                        text: elem.textContent,
                        results,
                    });
                }
            }
            return [...acc, ...newBinds];
        }, []);
        const classBinds = [...this.selectAll(`[${CLASS_BIND}]`, node)].reduce((acc, elem) => {
            const attrVal = elem.getAttribute(CLASS_BIND);
            const results = this.splitTrim(attrVal, ",").reduce((a, attr) => {
                let [condition, key] = [true, attr];
                if (attr.includes(":")) [condition, key] = this.splitTrim(attr, ":");
                return [...a, { key, condition }];
            }, []);
            return [...acc, { elem, baseClasses: elem.className, results }];
        }, []);
        this.binds.get(DATA_BIND).push(...dataBinds);
        this.binds.get(TEXT_BIND).push(...textBinds);
        this.binds.get(CLASS_BIND).push(...classBinds);
    }

    detectLoops(node = null) {
        const loopBinds = [...this.selectAll(`[${LOOP_BIND}]`, node)].reduce((acc, elem) => {
            const [variable, key] = this.splitTrim(elem.getAttribute(LOOP_BIND), "of");
            return [
                ...acc,
                {
                    elem,
                    innerStuff: elem.innerHTML,
                    parent: elem.parentNode,
                    position: this.getNodePosition(elem),
                    size: this.resolvePath(this.state, key).length,
                    items: this.resolvePath(this.state, key),
                    variable,
                    key,
                },
            ];
        }, []);
        this.binds.get(LOOP_BIND).push(...loopBinds);
        if (node) return loopBinds;
    }

    detectIfs(node = null) {
        const ifBinds = [...this.selectAll(`[${IF_BIND}]`, node)].reduce((acc, elem) => {
            const key = elem.getAttribute(IF_BIND);
            return [...acc, { elem, key, innerSTuff: elem.innerHTML }];
        }, []);
        this.binds.get(IF_BIND).push(...ifBinds);
        if (node) return ifBinds;
    }

    detectEvents() {
        EVENTS_ATTR.map((e) => `[${e}]`).forEach((eventType) => {
            const stripType = eventType.slice(1, -1);
            const name = stripType.slice(3);
            const eventBinds = [...this.selectAll(eventType)].reduce((acc, elem) => {
                const cb = elem.getAttribute(stripType);
                return [...acc, { elem, cb, name }];
            }, []);
            this.events.set(stripType, eventBinds);
        });
    }

    filterBinds(key = null, node = null, contains = false) {
        if (!key) return this.binds;
        const tempMap = new Map();
        for (const [type, binds] of this.binds) {
            let corBinds = binds;
            if (key) {
                corBinds = corBinds.filter((bind) => bind.key === key.trim() || bind.condition === key.trim());
            }
            if (node) {
                if (contains) {
                    corBinds = corBinds.filter((bind) => node.contains(bind.elem) && !bind.elem.isSameNode(node));
                } else {
                    corBinds = corBinds.filter((bind) => bind.elem.isSameNode(node));
                }
            }
            tempMap.set(type, corBinds);
        }
        return tempMap;
    }

    updateBinds(key = null, node = null, contains = null) {
        const map = this.filterBinds(key, node, contains);
        if (map.has(IF_BIND) && !node) {
            this.renderIfs(key);
        }
        if (map.has(LOOP_BIND) && !node) {
            this.renderLoops(key);
        }
        for (const [type, binds] of map) {
            switch (type) {
                case DATA_BIND: {
                    binds.forEach((bind) => {
                        this.updateNodeData(bind);
                    });
                    break;
                }
                case CLASS_BIND: {
                    binds.forEach((bind) => {
                        this.updateNodeClasses(bind);
                    });
                    break;
                }
                case TEXT_BIND: {
                    binds.forEach((bind) => {
                        this.updateTextBind(bind);
                    });
                    break;
                }
            }
        }
    }

    setState(...args) {
        if (!Array.isArray(args[0])) {
            this.setPath(this.state, args[0], args[1]);
            this.updateBinds(args[0]);
            return this;
        }
        args.forEach(([path, val]) => {
            this.setPath(this.state, path, val);
            this.updateBinds(path);
        });
        return this;
    }

    assignRefs() {
        this.refs = [...this.selectAll(`[${REF}]`)].reduce((acc, elem) => {
            const name = elem.getAttribute(REF);
            return [...acc, { [name]: elem }];
        }, []);
    }

    assignEvents() {
        for (const events of this.events.values()) {
            events.forEach((event) => {
                if (typeof this[event.cb] !== "function") {
                    throw new Error(`Specified callback not found : "${event.cb}", for event : "${event.name}"`);
                }
                event.elem.addEventListener(event.name, this[event.cb]);
            });
        }
    }

    updateNodeData(bind) {
        const val = this.resolvePath(this.state, bind.key);
        if (bind.condition === true) {
            bind.elem.innerHTML = val;
        } else {
            const cond = this.resolvePath(this.state, bind.condition);
            if (cond) bind.elem.innerHTML = val;
            else bind.elem.innerHTML = "";
        }
    }

    updateNodeClasses(bind) {
        const activatedClasses = bind.results.reduce((acc, res) => {
            if (res.condition === true) {
                return (acc += ` ${this.resolvePath(this.state, res.key)}`);
            }
            if (this.resolvePath(this.state, res.condition)) {
                return (acc += ` ${res.key}`);
            }
            return (acc += "");
        }, "");
        bind.elem.className = bind.baseClasses + activatedClasses;
    }

    updateTextBind(bind) {
        bind.elem.textContent = bind.results.reduce((acc, res) => {
            return acc.replace(res.match, this.resolvePath(this.state, res.key));
        }, bind.text);
    }

    /////////////
    // helpers //
    /////////////
    selectAll(selector, targetNode = null) {
        return targetNode ? targetNode.querySelectorAll(selector) : this.shadowRoot.querySelectorAll(selector);
    }

    select(selector, targetNode = null) {
        return targetNode ? targetNode.querySelector(selector) : this.shadowRoot.querySelector(selector);
    }

    resolvePath(obj, path, separator = ".") {
        return path
            .trim()
            .split(separator)
            .reduce((prev, curr) => prev && prev[curr], obj);
    }

    setPath(object, path, value, separator = ".") {
        path.trim()
            .split(separator)
            .reduce((o, p, i) => {
                return (o[p] = path.trim().split(separator).length === ++i ? value : o[p] || {});
            }, object);
        return this;
    }

    dotToCamel(dot) {
        return dot.indexOf(".") < 0 ? dot : dot.replace(/\.[a-z]/g, (m) => m[1].toUpperCase());
    }

    stringToHtml(string) {
        return new DOMParser().parseFromString(string, "text/html").body.firstChild;
    }

    splitTrim(string, separator) {
        return string.split(separator).map((e) => e.trim());
    }

    getNodePosition(node) {
        return Array.prototype.indexOf.call(node.parentNode.children, node);
    }

    ////////////////////
    // fancy iterator //
    ////////////////////

    [Symbol.iterator]() {
        let index = 0;
        const data = [{ binds: this.binds }, { events: this.events }, { props: this.props }, { refs: this.refs }];
        return {
            next: () => ({ value: data[index++], done: !(index - 1 in data) }),
        };
    }
}
