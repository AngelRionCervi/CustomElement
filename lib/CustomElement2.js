const LOOP = "loop";
const LOOP_ITEM = "loop-item";
const DATA_BIND = "data-bind";
const CLASS_BIND = "class-bind";
const IF_BIND = "if-bind";
const REF = "ref";
const PROPS = "props";
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
        this.binds.set(CLASS_BIND, []);
        this.binds.set(IF_BIND, []);
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

    renderLoops() {
        this.loops.forEach((el, index, loops) => {
            const loopTo = this.splitTrim(el.getAttribute(LOOP), "of");
            this.resolvePath(this.state, loopTo[1]).forEach((item) => {
                const node = this.stringToHtml(el.outerHTML);
                this.updateBinds(node);
                node.removeAttribute(this.loopAttr);
                el.parentNode.insertBefore(node, el.previousSibling);
                const children = this.selectAll(`[${LOOP_ITEM}]`, node);
                children.forEach((child) => (child.innerHTML = item));
            });
            if (index === 0) loops[index].remove();
        });
    }

    detectBinds() {
        const dataBinds = [...this.selectAll(`[${DATA_BIND}]`)].reduce((acc, elem) => {
            const attrVal = elem.getAttribute(DATA_BIND);
            let [condition, key] = [true, attrVal];
            if (attrVal.includes(":")) [condition, key] = this.splitTrim(attrVal, ":");
            return [...acc, { elem, key, condition }];
        }, []);
        const classBinds = [...this.selectAll(`[${CLASS_BIND}]`)].reduce((acc, elem) => {
            const attrVal = elem.getAttribute(CLASS_BIND);
            const list = this.splitTrim(attrVal, ",").reduce((a, attr) => {
                let [condition, key] = [true, attr];
                if (attr.includes(":")) [condition, key] = this.splitTrim(attr, ":");
                return [...a, { elem, key, condition, baseClasses: elem.className }];
            }, []);
            return [...acc, ...list];
        }, []);
        const ifBinds = [...this.selectAll(`[${IF_BIND}]`)].reduce((acc, elem) => {
            const key = elem.getAttribute(IF_BIND);
            return [...acc, { elem, key }];
        }, []);
        this.binds.set(DATA_BIND, dataBinds);
        this.binds.set(CLASS_BIND, classBinds);
        this.binds.set(IF_BIND, ifBinds);
    }

    detectLoops() {
        this.loops = this.selectAll(`[${LOOP}]`);
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

    filterBindsByKey(key = null) {
        if (!key) return this.binds;
        const tempMap = new Map();
        for (const [type, binds] of this.binds) {
            const corBinds = binds.filter((bind) => bind.key === key.trim() || bind.condition === key.trim());
            if (corBinds.length > 0) {
                tempMap.set(type, corBinds);
            }
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

    updateBinds(key = null) {
        for (const [type, binds] of this.filterBindsByKey(key)) {
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
                    throw new Error(`Specified callback not found : "${event.cb}" for event : "${event.name}"`);
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
            const generatedClasses = sameElsBinds.reduce((acc, bind) => {
                if (bind.condition === true) {
                    return [...acc, this.resolvePath(this.state, bind.key)];
                } else {
                    const cond = this.resolvePath(this.state, bind.condition);
                    if (cond) return [...acc, bind.key];
                    else return acc;
                }
            }, []);
            node.className = `${sameElsBinds[0].baseClasses} ${generatedClasses.join(" ")}`;
        });
    }

    updateIf(bind) {
        const cond = this.resolvePath(this.state, bind.key);
        if (cond) bind.elem.style.display = "block";
        else bind.elem.style.display = "none";
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
