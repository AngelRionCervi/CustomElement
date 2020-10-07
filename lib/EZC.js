import * as _H from "./helpers.js";
import _G from "./_GLOBALS_.js";
import Vdom from "./Vdom.js";

export function createComp(name, defineComp) {

    customElements.define(
        name,
        class extends HTMLElement {
            constructor() {
                super();
                this.state = {};
                this.Vdom = Vdom(this);
                this.attached = false;

                const createState = (initState = {}) => {
                    Object.assign(this.state, initState);
                    this.setState = (key, val) => {
                        if (!this.attached) {
                            setTimeout(() => {
                                this.Vdom.update(key, val);
                            }, 0)
                        } else {
                            this.Vdom.update(key, val);
                        }
                    }
                    return { state: this.state, setState: this.setState };
                }

                const registerFn = (fns) => {
                    Object.entries(fns).forEach(([name, fn]) => {
                        this[name] = fn;
                    })
                }

                this.cycle = Object.seal({
                    beforeInit: () => void 0,
                    onInit: () => void 0,
                    onRender: () => void 0,
                });

                const cycle = (cbs) => {
                    for (const key of Object.keys(cbs)) {
                        if (!["beforeInit", "onInit", "onRender"].includes(key)) {
                            throw new Error("life cycle functions can only be called beforeInit, onInit and onRender")
                        }
                    }
                    Object.assign(this.cycle, cbs);
                }

                const html = defineComp({ createState, registerFn, cycle });

                const shadowRoot = this.attachShadow({ mode: "open" });
                shadowRoot.innerHTML = html;
                this.props = {};

                if (this.attributes.hasOwnProperty("props")) {
                    this.linkProps();
                }
            }

            connectedCallback() {
                this.attached = true;
                this.cycle.beforeInit();
                this.Vdom.scanNode();
                this.cycle.onInit();
                this.Vdom.renderLoops();
                this.Vdom.renderIfs();
                this.cycle.onRender();
            }

            linkProps() {
                const props = _H.splitTrim(this.attributes.props.value, ",");
                props.forEach((prop) => {
                    const [key, path] = prop.includes(":") ? _H.splitTrim(prop, ":") : [prop, prop];
                    const parentVal = _H.resolvePath(this.getRootNode().host, path);
                    this.props[key] = parentVal;
                });
            }
        }
    );
}

export default class CustomElement extends HTMLElement {
    constructor() {
        super();
        this.binds = new Map();
        this.events = new Map();
        this.props = {};
        this.refs = {};
        // this.Loop = Loop(this);
        // this.If = If(this);
        // this.Updater = Updater(this);
        // this.TextBind = TextBind(this);
        // this.DataBind = DataBind(this);
        // this.ClassBind = ClassBind(this);
        // this.ChildrenManager = ChildrenManager(this);
        this.Vdom = Vdom(this);
        if (this.attributes.hasOwnProperty("props")) {
            this.linkProps();
        }
    }

    connectedCallback() {
        if (typeof this.beforeInit === "function") this.beforeInit();

        this.Vdom.scanNode();
        this.Vdom.renderLoops();
        this.Vdom.renderIfs();

        if (typeof this.onInit === "function") this.onInit();

        if (typeof this.onRender === "function") this.onRender();
    }

    linkProps() {
        const props = _H.splitTrim(this.attributes.props.value, ",");
        props.forEach((prop) => {
            const [key, path] = prop.includes(":") ? _H.splitTrim(prop, ":") : [prop, prop];
            const parentVal = _H.resolvePath(this.getRootNode().host, path);
            this.props[key] = parentVal;
        });
    }

    setState(key, val) {
        this.Vdom.update(key, val);
    }
}
