export default class CustomElement extends HTMLElement {
    constructor() {
        super();
        this.dataBindAttr = "data-bind";
        this.classBindAttr = "class-bind";
        this.eventsAttr = [
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
        this.loopAttr = "data-loop";
        this.loopItemAttr = "loop-item";
        this.ifAttr = "data-if";
        this.propsAttr = "props";
        this.refAttr = "ref";

        this.binds = new Map();
        this.events = new Map();
        this.props = {};
        this.refs = {};
        this.dataBinds = null;
        this.classBinds = null;
        this.loops = null;
    }

    connectedCallback() {
        this.binds.set("data-bind", []);
        this.binds.set("class-bind", []);
        this.binds.set("events", []);
        this.binds.set("data-loop", []);
        this.binds.set("data-if", []);
        this.loops = this.selectAll(`[${this.loopAttr}]`);
        this.updateBinds(null);
        if (this.attributes.hasOwnProperty(this.propsAttr)) {
            this.linkProps();
        }
        this.applyDefaults();
        this.onInit();
        this.renderLoops();
        this.onRender();
    }

    linkProps() {
        const props = this.attributes.props.value.split(" ");
        props.forEach((prop) => {
            const [key, path] = prop.includes("=") ? prop.split("=") : [prop, prop];
            const parentVal = this.resolvePath(this.getRootNode().host, path);
            if (typeof parentVal === "function") {
                this.props[key] = (...args) => {
                    return parentVal(args);
                };
            } else {
                this.props[key] = parentVal;
            }
        });
    }

    updateBinds(targetNode = null) {
        const newBinds = new Map();
        const newEvents = new Map();

        const dataBinds = [...this.selectAll(`[${this.dataBindAttr}]`, targetNode)].reduce((acc, elem) => {
            return [...acc, { elem }];
        }, []);
        const classBinds = [...this.selectAll(`[${this.classBindAttr}]`, targetNode)].reduce((acc, elem) => {
            return [...acc, { elem, baseClasses: elem.className }];
        }, []);
        const ifBinds = [...this.selectAll(`[${this.ifAttr}]`, targetNode)].reduce((acc, elem) => {
            return [...acc, { elem }];
        }, []);
        const newRefs = [...this.selectAll(`[${this.refAttr}]`, targetNode)].reduce((acc, elem) => {
            const name = elem.getAttribute(this.refAttr);
            return { ...acc, [name]: { elem } };
        }, {});

        this.eventsAttr
            .map((e) => `[${e}]`)
            .forEach((eventType) => {
                const stripType = eventType.slice(1, -1);
                const eventBinds = [...this.selectAll(eventType, targetNode)].reduce((acc, elem) => {
                    return [...acc, { elem, type: stripType }];
                }, []);
                newEvents.set(stripType, eventBinds);
            });

        newBinds.set("data-bind", dataBinds);
        newBinds.set("class-bind", classBinds);

        for (const [type, binds] of newBinds) {
            binds.forEach((bind) => {
                const bindTo = bind.elem.getAttribute(type);
                const camelKey = this.capitalize(this.dotToCamel(bindTo));
                Object.assign(this, {
                    [`get${camelKey}`]() {
                        return this.resolvePath(this, bindTo);
                    },
                    [`set${camelKey}`](val) {
                        this.setPath(this, bindTo, val);
                        type === "class-bind"
                            ? this.updateDomClass(bindTo, bind.baseClasses)
                            : this.updateDomTextNode(bindTo);
                        return this;
                    },
                });
            });
        }

        for (const [type, binds] of newEvents) {
            binds.forEach((bind) => {
                const cbName = bind.elem.getAttribute(type);
                const stripType = type.slice(3); //removes "on-"
                bind.elem.addEventListener(stripType, (evt) => this[cbName](evt));
            });
        }

        ifBinds.forEach((bind) => {
            const bindTo = bind.elem.getAttribute(this.ifAttr);
            const testVal = this.resolvePath(this, bindTo);
            if (testVal) bind.elem.style.display = "block";
            else bind.elem.style.display = "none";
        });

        this.binds.set("data-bind", [...dataBinds, ...this.binds.get("data-bind")]);
        this.binds.set("class-bind", [...classBinds, ...this.binds.get("class-bind")]);
        this.binds.set("data-if", [...ifBinds, ...this.binds.get("data-if")]);
        this.refs = { ...this.refs, ...newRefs };
    }

    applyDefaults() {
        for (const [type, binds] of this.binds) {
            binds.forEach((bind) => {
                console.log(bind)
                const bindTo = bind.elem.getAttribute(type);
                const val = this.resolvePath(this, bindTo);
                switch (type) {
                    case "data-bind": {
                        bind.elem.innerHTML = val;
                        break;
                    }
                    case "class-bind": {
                        bind.elem.classList.add(val);
                        break;
                    }
                }
            });
        }
    }

    renderLoops() {
        this.loops.forEach((el, index, loops) => {
            const loopTo = el.getAttribute(this.loopAttr).split(" ");
            this.resolvePath(this, loopTo[2]).forEach((item) => {
                const node = this.stringToHtml(el.outerHTML);
                this.updateBinds(node);
                node.removeAttribute(this.loopAttr);
                el.parentNode.insertBefore(node, el.previousSibling);
                const children = this.selectAll(`[${this.loopItemAttr}]`, node);
                children.forEach((child) => (child.innerHTML = item));
            });
            if (index === 0) loops[index].remove();
        });
    }

    updateDomTextNode(bindTo) {
        const elems = this.selectAll(`[${this.dataBindAttr}$="${bindTo}"]`);
        const val = this.resolvePath(this, bindTo);
        elems.forEach((el) => {
            el.innerHTML = val;
        });
    }

    updateDomClass(bindTo, baseClasses) {
        const elems = this.selectAll(`[${this.classBindAttr}$="${bindTo}"]`);
        const val = this.resolvePath(this, bindTo);
        elems.forEach((el) => {
            el.className = `${baseClasses} ${val}`;
        });
    }

    updateDomVisibility(bindTo) {
        const elems = this.selectAll(`[${this.ifAttr}$="${bindTo}"]`);
        const val = this.resolvePath(this, bindTo);
        elems.forEach((el) => {
            el.style.display = val ? "block" : "none";
        });
    }

    setState(...args) {
        args.forEach(([path, val]) => {
            this.setPath(this, path, val);
            for (const [type, binds] of this.binds) {
                binds.forEach((bind) => {
                    switch (type) {
                        case "data-bind": {
                            this.updateDomTextNode(path);
                            break;
                        }
                        case "class-bind": {
                            this.updateDomClass(path, bind.baseClasses);
                            break;
                        }
                        case "data-if": {
                            this.updateDomVisibility(path);
                            break;
                        }
                    }
                });
            }
        });
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

    capitalize = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    dotToCamel(dot) {
        return dot.indexOf(".") < 0 ? dot : dot.replace(/\.[a-z]/g, (m) => m[1].toUpperCase());
    }

    stringToHtml(string) {
        return new DOMParser().parseFromString(string, "text/html").body.firstChild;
    }
}
