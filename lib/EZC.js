import * as _H from "../lib/helpers.js";
import _G from "../lib/_GLOBALS_.js";

export default class CustomElement extends HTMLElement {
    constructor() {
        super();
        this.binds = new Map();
        this.events = new Map();
        this.props = {};
        this.refs = {};
    }

    connectedCallback() {
        this.binds.set(_G.LOOP_BIND, []);
        this.binds.set(_G.IF_BIND, []);
        if (typeof this.beforeInit === "function") this.beforeInit();
        this.detectLoops();
        this.detectIfs();
        this.findLoopIfChildren();
        if (typeof this.onInit === "function") this.onInit();
        this.renderLoops();
        this.renderIfs();
        if (typeof this.onRender === "function") this.onRender();
    }

    detectLoops() {
        [...this.selectAll(`[${_G.LOOP_BIND}]`)].forEach((elem) => {
            const attr = elem.getAttribute(_G.LOOP_BIND);
            if (
                !this.binds
                    .get(_G.LOOP_BIND)
                    .map((bind) => bind.attr)
                    .includes(attr)
            ) {
                const [variable, key] = _H.splitTrim(attr, "of");
                const loopObj = {
                    type: "loop",
                    elem,
                    innerStuff: elem.innerHTML,
                    parent: elem.parentNode,
                    attr,
                    variable,
                    key,
                };
                this.binds.get(_G.LOOP_BIND).push(loopObj);
            }
        });
    }

    findLoopIfChildren() {
        const genBinds = this.getAllGeneratorBinds();
        const getChildren = (elem) => {
            const children = [];
            let child = this.select(`[${_G.LOOP_BIND}], [${_G.IF_BIND}]`, elem);
            while (child) {
                if ([...child.attributes].map((a) => a.name).some((at) => this.getAllGeneratorAttr().includes(at))) {
                    const matches = genBinds.filter((bind) => bind.elem.isEqualNode(child));
                    if (matches?.length > 0) children.push(...matches);
                }
                child = child.nextElementSibling;
            }
            return children;
        };
        genBinds.forEach((bind) => {
            bind.children = getChildren(bind.elem);
        });
    }

    detectIfs() {
        [...this.selectAll(`[${_G.IF_BIND}]`)].forEach((elem) => {
            const key = elem.getAttribute(_G.IF_BIND).trim();
            if (
                !this.binds
                    .get(_G.IF_BIND)
                    .map((bind) => bind.key)
                    .includes(key)
            ) {
                const ifObj = {
                    type: "if",
                    elem,
                    innerStuff: elem.innerHTML,
                    parent: elem.parentNode,
                    key,
                };
                this.binds.get(_G.IF_BIND).push(ifObj);
            }
        });
    }

    renderLoops(setBinds = null) {
        const binds = setBinds ? setBinds : this.binds.get(_G.LOOP_BIND);
        binds.forEach((bind) => {
            const corLoops = [...this.selectAll(`[${_G.LOOP_BIND}$="${bind.attr}"]`)];
            const arrayToLoop = _H.resolvePath(this.state, bind.key);
            corLoops.forEach((elem) => {
                elem.innerHTML = "";
                arrayToLoop.forEach((item) => {
                    const node = _H.stringToHtml(`<div>${bind.innerStuff}</div>`);
                    [...this.selectAll(`[${_G.LOOP_ITEM}]`, node)].forEach((child) => {
                        const itemVar = child.getAttribute(_G.LOOP_ITEM);
                        if (itemVar === bind.variable) {
                            child.innerHTML = item;
                        }
                    });
                    elem.innerHTML += node.innerHTML;
                });
            });
            if (bind.children.length > 0) {
                this.updateChildren(bind.children);
            }
        });
    }

    renderIfs(setBinds = null) {
        const binds = setBinds ? setBinds : this.binds.get(_G.IF_BIND);
        binds.forEach((bind) => {
            const corIfs = [...this.selectAll(`[${_G.IF_BIND}$="${bind.key}"]`)];
            const condition = _H.resolvePath(this.state, bind.key);
            const node = _H.stringToHtml(`<div>${bind.innerStuff}</div>`);
            corIfs.forEach((elem) => {
                elem.innerHTML = "";
                if (condition) elem.innerHTML = node.innerHTML;
            });
            if (bind.children.length > 0) {
                this.updateChildren(bind.children);
            }
        });
    }

    updateChildren(children) {
        const childrenLoops = children.filter((bind) => bind.type === "loop");
        this.renderLoops(childrenLoops);
        const childrenIfs = children.filter((bind) => bind.type === "if");
        this.renderIfs(childrenIfs);
    }

    updateLoops(key) {
        const corBinds = this.binds.get(_G.LOOP_BIND).filter((bind) => bind.key === key);
        if (corBinds.length > 0) this.renderLoops(corBinds);
    }

    updateIfs(key) {
        const corBinds = this.binds.get(_G.IF_BIND).filter((bind) => bind.key === key);
        if (corBinds.length > 0) this.renderIfs(corBinds);
    }

    updateBinds(key) {
        this.updateLoops(key);
        this.updateIfs(key);
    }

    setState(...args) {
        if (!Array.isArray(args[0])) {
            _H.setPath(this.state, args[0], args[1]);
            this.updateBinds(args[0]);
            return this;
        }
        args.forEach(([path, val]) => {
            _H.setPath(this.state, path, val);
            this.updateBinds(path);
        });
        return this;
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

    getAllGeneratorBinds() {
        return [...this.binds.get(_G.LOOP_BIND), ...this.binds.get(_G.IF_BIND)];
    }

    getAllBinds() {
        return [...this.binds.values()].flat();
    }

    getAllGeneratorAttr() {
        return [_G.LOOP_BIND, _G.IF_BIND];
    }
}
