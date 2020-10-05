import * as _H from "./helpers.js";
import _G from "./_GLOBALS_.js";
import Vdom from "./Vdom.js";


let state = {};
let setters = {};

export function createState(initState = {}) {
    state = {};
    Object.assign(state, initState);
    Object.keys(state).forEach((key) => {
        setters[key] = (val) => {
            state[key] = val;
        }
    })
    return [state, setters];
}

export function createHTML(htmlStr) {
    
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
