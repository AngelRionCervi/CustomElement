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
        this.detectLoops();
        this.detectEvents();
        this.assignRefs();
        this.assignEvents();
        if (this.attributes.hasOwnProperty(PROPS)) {
            this.linkProps();
        }
        if (typeof this.onInit === "function") this.onInit();
        this.renderLoops();
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

    renderLoops(key = null, elem = null) {
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
                this.detectLoops(loop.elem).forEach((bind) => {
                    this.renderLoops(bind.key, bind.elem);
                });
                this.detectBinds(loop.elem);
                this.updateBinds(null, loop.elem, true)
            });
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
                for (const match of elem.firstChild.textContent.matchAll(TEXT_BIND_REGEXP)) {
                    newBinds.push({
                        elem,
                        text: elem.textContent,
                        match: match[0],
                        key: match[1],
                        index: elem.textContent.indexOf(match[0]),
                    });
                }
            }
            return [...acc, ...newBinds];
        }, []);
        const classBinds = [...this.selectAll(`[${CLASS_BIND}]`, node)].reduce((acc, elem) => {
            const attrVal = elem.getAttribute(CLASS_BIND);
            const list = this.splitTrim(attrVal, ",").reduce((a, attr) => {
                let [condition, key] = [true, attr];
                if (attr.includes(":")) [condition, key] = this.splitTrim(attr, ":");
                return [...a, { elem, key, condition, baseClasses: elem.className }];
            }, []);
            return [...acc, ...list];
        }, []);
        const ifBinds = [...this.selectAll(`[${IF_BIND}]`, node)].reduce((acc, elem) => {
            const key = elem.getAttribute(IF_BIND);
            return [...acc, { elem, key }];
        }, []);
        this.binds.get(DATA_BIND).push(...dataBinds);
        this.binds.get(TEXT_BIND).push(...textBinds);
        this.binds.get(CLASS_BIND).push(...classBinds);
        this.binds.get(IF_BIND).push(...ifBinds);
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
        if (node) {
            return loopBinds;
        }
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
                corBinds = corBinds.filter((bind) => bind.key === key.trim() || bind.condition === key.trim())
            }
            if (node) {
                if (contains) {
                    corBinds = corBinds.filter((bind) => node.contains(bind.elem));
                } else {
                    corBinds = corBinds.filter((bind) => bind.elem.isSameNode(node));
                }
                
            }
            tempMap.set(type, corBinds);
        }
        return tempMap;
    }

    getUniqueNodesFromBinds(binds) {
        return [...new Set(binds.map((item) => item.elem))];
    }

    getSameNodeBinds(node, bindType = null) {
        const sameNodeBinds = [];
        for (const [type, binds] of this.binds) {
            if (bindType && type !== bindType) continue;
            sameNodeBinds.push(...binds.filter((bind) => bind.elem.isSameNode(node)));
        }
        return sameNodeBinds;
    }

    updateBinds(key = null, node = null, contains = null) {
        const map = this.filterBinds(key, node, contains);
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
                    this.updateNodeClasses(binds);
                    break;
                }
                case IF_BIND: {
                    binds.forEach((bind) => {
                        this.updateIf(bind);
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

    updateNodeClasses(binds) {
        const uniqNodes = this.getUniqueNodesFromBinds(binds);
        uniqNodes.forEach((node) => {
            const sameElsBinds = this.getSameNodeBinds(node, CLASS_BIND);
            const activatedClasses = sameElsBinds.reduce((acc, bind) => {
                if (bind.condition === true) {
                    return [...acc, this.resolvePath(this.state, bind.key)];
                } else {
                    const cond = this.resolvePath(this.state, bind.condition);
                    if (cond) return [...acc, bind.key];
                    else return acc;
                }
            }, []);
            node.className = `${sameElsBinds[0].baseClasses} ${activatedClasses.join(" ")}`;
        });
    }

    updateIf(bind) {
        const cond = this.resolvePath(this.state, bind.key);
        if (cond) bind.elem.style.display = "block";
        else bind.elem.style.display = "none";
    }

    updateTextBind(bind) {
        const newText = bind.text.replace(bind.match, this.resolvePath(this.state, bind.key));
        bind.elem.textContent = newText;
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
