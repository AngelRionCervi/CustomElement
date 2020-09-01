import * as _H from "./helpers.js";
import _G from "./_GLOBALS_.js";
import Loop from "./Loop.js";
import If from "./If.js";
import Updater from "./Updater.js";

export default class CustomElement extends HTMLElement {
    constructor() {
        super();
        this.binds = new Map();
        this.events = new Map();
        this.props = {};
        this.refs = {};
        this.Loop = Loop(this);
        this.If = If(this);
        this.Updater = Updater(this);
    }

    connectedCallback() {
        this.binds.set(_G.LOOP_BIND, []);
        this.binds.set(_G.IF_BIND, []);
        if (typeof this.beforeInit === "function") this.beforeInit();
        this.detectLoops();
        this.detectIfs();
        this.detectChildren();
        if (typeof this.onInit === "function") this.onInit();
        this.renderLoops();
        this.renderIfs();
        if (typeof this.onRender === "function") this.onRender();
    }

    detectChildren() {
        const genBinds = this.getAllGeneratorBinds();
        const getChildren = (elem) => {
            const children = [];
            let child = this.select(`[${_G.LOOP_BIND}], [${_G.IF_BIND}]`, elem);
            let childIndex = _H.getElementIndex(child);
            while (child) {
                const match = genBinds.find((bind) => bind.elem.isEqualNode(child));
                if (match) children.push(match);
                childIndex++;
                child = this.select(this.getGeneratorSiblingSelector(elem.tagName, childIndex), elem);
            }
            return children;
        };
        genBinds.forEach((bind) => {
            bind.children = getChildren(bind.elem);
        });
    }

    detectLoops() {
        this.Loop.detect();
    }

    detectIfs() {
        this.If.detect();
    }

    renderLoops(setBinds = null) {
        this.Loop.render(setBinds);
    }

    renderIfs(setBinds = null) {
        this.If.render(setBinds);
    }

    updateChildren(children) {
        this.Updater.u_children(children);
    }

    updateBinds(key) {
        this.Updater.u_loops(key);
        this.Updater.u_ifs(key);
    }

    setState(...args) {
        this.Updater.set_state(...args);
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

    getGeneratorSiblingSelector(parentTag, childIndex) {
        return this.getAllGeneratorAttr().reduce((acc, attr, index) => {
            return `${acc}${index === 0 ? "" : ","}${parentTag}:nth-child(n+${childIndex}) ~ [${attr}]`;
        }, "");
    }
}
