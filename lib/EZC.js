import * as _H from "./helpers.js";
import _G from "./_GLOBALS_.js";
import Updater from "./Updater.js";
import ChildrenManager from "./ChildrenManager.js";
import Loop from "./Loop.js";
import If from "./If.js";
import TextBind from "./TextBind.js";
import DataBind from "./DataBind.js";
import ClassBind from "./ClassBind.js";

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
        this.TextBind = TextBind(this);
        this.DataBind = DataBind(this);
        this.ClassBind = ClassBind(this);
        this.ChildrenManager = ChildrenManager(this);
    }

    connectedCallback() {
        this.binds.set(_G.TEXT_BIND, []);
        this.binds.set(_G.DATA_BIND, []);
        this.binds.set(_G.CLASS_BIND, []);
        this.binds.set(_G.LOOP_BIND, []);
        this.binds.set(_G.IF_BIND, []);
        if (typeof this.beforeInit === "function") this.beforeInit();
        
        this.detectLoops();
        this.detectIfs();
        this.detectTextBinds();
        this.detectDataBinds();
        this.detectClassBinds();
        this.detectChildren();

        if (typeof this.onInit === "function") this.onInit();

        this.renderLoops();
        this.renderIfs();
        this.renderTextBinds();
        this.renderDataBinds();
        this.renderClassBinds();
        if (typeof this.onRender === "function") this.onRender();
    }

    detectChildren() {
        const genBinds = this.getAllGeneratorBinds().map((n) => n.results).flat();
        console.log(genBinds)
        genBinds.forEach((bind, _, genbinds) => {
      
                bind.children = [...this.ChildrenManager.getDirectGeneratorChildren(genbinds, bind.elem), ...this.ChildrenManager.getGeneralChildren(bind.elem)];
         
        });
    }

    detectTextBinds() {
        this.TextBind.detect();
    }

    detectDataBinds() {
        this.DataBind.detect();
    }

    detectClassBinds() {
        this.ClassBind.detect();
    }

    detectLoops() {
        this.Loop.detect();
    }

    detectIfs() {
        this.If.detect();
    }

    renderTextBinds(setBinds = null) {
        this.TextBind.render(setBinds);
    }

    renderDataBinds(setBinds = null) {
        this.DataBind.render(setBinds);
    }

    renderClassBinds(setBinds = null) {
        this.ClassBind.render(setBinds);
    }

    renderLoops(setBinds = null) {
        this.Loop.render(setBinds);
        this.Updater.u_all_text_binds();
    }

    renderChildrenLoops(setBinds = null) {
        this.Loop.renderChildren(setBinds);
        this.Updater.u_all_text_binds();
    }

    renderIfs(setBinds = null) {
        this.If.render(setBinds);
        this.Updater.u_all_text_binds();
    }

    updateChildren(children) {
        this.Updater.u_children(children);
    }

    updateBinds(key) {
        if (!_H.keyExists(this.state, key)) return;
        this.Updater.u_loops(key);
        this.Updater.u_ifs(key);
        this.Updater.u_data_binds(key);
        this.Updater.u_text_binds(key);
        this.Updater.u_class_binds(key);
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

    getAllGeneralBinds() {
        return [...this.binds.get(_G.DATA_BIND)];
    }

    getGeneratorSiblingSelector(parentTag, childIndex) {
        return this.getAllGeneratorAttr().reduce((acc, attr, index) => {
            return `${acc}${index === 0 ? "" : ","}${parentTag}:nth-child(n+${childIndex}) ~ [${attr}]`;
        }, "");
    }
}
