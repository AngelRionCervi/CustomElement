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

    findLoopIfChildren() { // todo: just create one children property (for both loops and ifs) so it's easier to get the closest one for both
        this.binds.get(_G.LOOP_BIND).forEach((bind, _, arr) => {
            bind.childrenLoops = this.getClosestChildren(
                arr.filter((b) => bind.elem.contains(b.elem) && !bind.elem.isSameNode(b.elem)),
                bind
            );
            bind.childrenIfs = this.getClosestChildren(
                this.binds.get(_G.IF_BIND).filter((b) => bind.elem.contains(b.elem) && !bind.elem.isSameNode(b.elem)),
                bind
            );
        });
        this.binds.get(_G.IF_BIND).forEach((bind, _, arr) => {
            bind.childrenIfs = this.getClosestChildren(
                arr.filter((b) => bind.elem.contains(b.elem) && !bind.elem.isSameNode(b.elem)),
                bind
            );
            bind.childrenLoops = this.getClosestChildren(
                this.binds.get(_G.LOOP_BIND).filter((b) => bind.elem.contains(b.elem) && !bind.elem.isSameNode(b.elem)),
                bind
            );
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
            if (bind.childrenLoops.length > 0) {
                this.renderLoops(bind.childrenLoops);
            }
            if (bind.childrenIfs.length > 0) {
                this.renderIfs(bind.childrenIfs);
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
            if (bind.childrenLoops.length > 0) {
                this.renderLoops(bind.childrenLoops);
            }
            if (bind.childrenIfs.length > 0) {
                this.renderIfs(bind.childrenIfs);
            }
        });
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
    getClosestChildren(childrenBinds, bind) {
        const childrenDepths = [];
        childrenBinds.forEach((bind) => {
            childrenDepths.push({ bind, depth: _H.getElementDepth(bind.elem) });
        });
        const closest = _H.findClosest(
            _H.getElementDepth(bind.elem),
            childrenDepths.map((b) => b.depth)
        );
        if (closest) {
            return childrenDepths.filter((child) => child.depth === closest).map((child) => child.bind);
        }
        return [];
    }

    selectAll(selector, targetNode = null) {
        return targetNode ? targetNode.querySelectorAll(selector) : this.shadowRoot.querySelectorAll(selector);
    }

    select(selector, targetNode = null) {
        return targetNode ? targetNode.querySelector(selector) : this.shadowRoot.querySelector(selector);
    }
}


