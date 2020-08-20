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
        this.updateBinds(null);
        if (typeof this.onRender === "function") this.onRender();
    }

    linkProps() {
        const props = this.attributes.props.value.split(" ");
        props.forEach((prop) => {
            const [key, path] = prop.includes("=") ? prop.split("=") : [prop, prop];
            const parentVal = this.resolvePath(this.getRootNode().host, path);
            this.props[key] = parentVal;
        });
    }

    renderLoops() {
        this.loops.forEach((el, index, loops) => {
            const loopTo = el.getAttribute(LOOP).split(" ");
            this.resolvePath(this, loopTo[2]).forEach((item) => {
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
            const key = elem.getAttribute(DATA_BIND);
            return [...acc, { elem, key }];
        }, []);
        const classBinds = [...this.selectAll(`[${CLASS_BIND}]`)].reduce((acc, elem) => {
            const key = elem.getAttribute(CLASS_BIND);
            return [...acc, { elem, key, baseClasses: elem.className }];
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
                return [ ...acc, { elem, cb, name } ];
            }, []);
            this.events.set(stripType, eventBinds);
        });
    }

    filterBinds(key = null) {
        if (!key) return this.binds;
        const tempMap = new Map();
        for (const [type, binds] of this.binds) {
            const corBinds = binds.filter((bind) => bind.key === key);
            if (corBinds.length > 0) {
                tempMap.set(type, corBinds);
            }
        }
        return tempMap;
    }

    updateBinds(key = null) {
        for (const [type, binds] of this.filterBinds(key)) {
            switch (type) {
                case DATA_BIND: {
                    binds.forEach((bind) => {
                        this.updateNodeData(bind);
                    });
                    break;
                }
                case CLASS_BIND: {
                    binds.forEach((bind) => {
                        this.updateNodeClass(bind);
                    });
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
        args.forEach(([path, val]) => {
            this.setPath(this, path, val);
            this.updateBinds(path);
        });
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
                    throw new Error(
                        `Specified callback not found : "${event.cb}" for event "${event.name}"`
                    );
                }
                event.elem.addEventListener(event.name, this[event.cb]);
            })
        }
    }

    updateNodeData(bind) {
        bind.elem.innerHTML = this.resolvePath(this, bind.key);
    }

    updateNodeClass(bind) {
        bind.elem.className = `${bind.baseClasses} ${this.resolvePath(this, bind.key)}`;
    }

    updateIf(bind) {
        const cond = this.resolvePath(this, bind.key);
        if (cond) bind.elem.style.display = "block";
        else bind.elem.style.display = "none";
    }

    // helpers //
    selectAll(selector, targetNode = null) {
        return targetNode ? targetNode.querySelectorAll(selector) : this.shadowRoot.querySelectorAll(selector);
    }

    select(selector, targetNode = null) {
        return targetNode ? targetNode.querySelector(selector) : this.shadowRoot.querySelector(selector);
    }

    resolvePath(obj, path, separator = ".") {
        return path.split(separator).reduce((prev, curr) => prev && prev[curr], obj);
    }

    setPath(object, path, value) {
        return path
            .split(".")
            .reduce((o, p, i) => (o[p] = path.split(".").length === ++i ? value : o[p] || {}), object);
    }

    dotToCamel(dot) {
        return dot.indexOf(".") < 0 ? dot : dot.replace(/\.[a-z]/g, (m) => m[1].toUpperCase());
    }

    stringToHtml(string) {
        return new DOMParser().parseFromString(string, "text/html").body.firstChild;
    }
}
