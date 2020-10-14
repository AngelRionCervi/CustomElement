import * as _H from "./helpers.js";
import _G from "./_GLOBALS_.js";
import Vdom from "./Vdom.js";
import store from "./Store.js";
export { store };

export function createComp(name, defineComp) {
    customElements.define(
        name,
        class extends HTMLElement {
            constructor() {
                super();
                this.storeSymbol = Symbol();
                this.Vdom = Vdom(this, this.storeSymbol);
                this.attached = false;
                this.setStateQueue = [];

                const createState = (initState = {}) => {
                    store.__add(this.storeSymbol, { ctx: this, state: initState });
                    this.setState = (key, val) => {
                        this.setStateQueue.unshift({ key, val });
                        this.execSetStateQueue();
                    };
                    return { state: store.__get(this.storeSymbol), setState: this.setState };
                };

                const registerFn = (fns) => {
                    Object.entries(fns).forEach(([name, fn]) => {
                        this[name] = fn;
                    });
                };

                this.cycle = Object.seal({
                    beforeInit: () => void 0,
                    onInit: () => void 0,
                    onRender: () => void 0,
                });

                const cycle = (cbs) => {
                    for (const key of Object.keys(cbs)) {
                        if (!["beforeInit", "onInit", "onRender"].includes(key)) {
                            throw new Error("life cycle functions can only be called beforeInit, onInit and onRender");
                        }
                    }
                    Object.assign(this.cycle, cbs);
                };

                const useGlobal = (key) => {
                    store.addSymbolToKey(key, this.storeSymbol);
                    return store.getGlobal()[key].val;
                };

                const html = defineComp({ createState, registerFn, cycle, useGlobal });

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
                this.execSetStateQueue();
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

            execSetStateQueue() {
                if (!this.attached) return;
                while (this.setStateQueue.length !== 0) {
                    const curSetState = this.setStateQueue.pop();
                    this.Vdom.update(curSetState.key, curSetState.val);
                }
            }
        }
    );
}
