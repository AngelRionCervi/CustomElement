import HtmlParser from "./HtmlParser.js";
const htmlParser = new HtmlParser();

export default class CustomElement extends HTMLElement {
    constructor() {
        super();
        this.binds = null;
        this.loops = null;
        this.boundAttrib = [];
        this.boundTextNode = [];
    }

    get propAccessorRegExp() {
        return /\{([^\}\}]+)+\}/g;
    }

    capitalize = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    dotToCamel(dot) {
        return dot.indexOf(".") < 0 ? dot : dot.replace(/\.[a-z]/g, (m) => m[1].toUpperCase());
    }

    connectedCallback() {
        this.loops = this.selectAll("[data-loop]");
        this.detectBinds();
        this.onInit();
        this.renderLoops();
        this.onRender();
    }

    setState(path, val) {
        const oldValue = this.resolvePath(this.state, path);
        this.setPath(this.state, path, val);
        this.updateDom(oldValue, path);
    }

    detectBinds() {
        const allBinds = [];
        this.shadowRoot.querySelectorAll("*").forEach((el) => {
            const binds = { elem: el, values: [] };
            for (let i = 0; i < el.attributes.length; i++) {
                const attrib = el.attributes[i];
                for (const match of attrib.value.matchAll(this.propAccessorRegExp)) {
                    binds.values.push({ type: "attr", name: attrib.name, path: match[1] });
                }
            }
            if (el.firstChild && el.firstChild.nodeType === 3) {
                for (const match of el.firstChild.textContent.matchAll(this.propAccessorRegExp)) {
                    binds.values.push({ type: "text", path: match[1] });
                }
            }
            if (binds.values.length > 0) allBinds.push(binds);
        });
        this.binds = allBinds;
        this.updateDom(true);
    }

    renderLoops() {
        this.loops.forEach((el) => {
            const loopTo = el.getAttribute("data-loop").split(" ");
            this.resolvePath(this.state, loopTo[2]).forEach((item, index) => {
                const node = el.cloneNode(true);
                node.removeAttribute("data-loop");
                node.innerHTML = el.innerHTML;
                el.parentNode.insertBefore(node, el.previousSibling);
                const childs = el.querySelectorAll("[data-loopItem]");
                childs.forEach((child) => (child.innerHTML = item));
                if (index === 0) node.remove();
            });
        });
    }

    updateDom(oldVal, src) {
        // this is really hard because the value changes and we need to recognize where it is situated on the element -> virtual dom
        console.log(this.binds)
        this.binds.forEach((bind) => {
            

            bind.values.forEach((match) => {

                const valToReplace = oldVal === true ? `{${match.path}}` : oldVal;
                if (bind.elem.firstChild && bind.elem.firstChild.nodeType === 3) {
                    console.log(bind.elem.firstChild.textContent, valToReplace, match.path)
                    bind.elem.firstChild.textContent = bind.elem.firstChild.textContent.replace(
                        valToReplace,
                        this.resolvePath(this.state, match.path)
                    );
                }
                /*
                for (let i = 0; i < bind.elem.attributes.length; i++) {
                    const attrib = bind.elem.attributes[i];
                    attrib.value = attrib.value.replace(valToReplace, this.resolvePath(this.state, match.path));
                }*/
            });
        });
    }

    // helpers //
    selectAll(selector) {
        return this.shadowRoot.querySelectorAll(selector);
    }

    select(selector) {
        return this.shadowRoot.querySelector(selector);
    }

    resolvePath(obj, path, separator = ".") {
        const properties = Array.isArray(path) ? path : path.split(separator);
        return properties.reduce((prev, curr) => prev && prev[curr], obj);
    }

    setPath(object, path, value) {
        return path
            .split(".")
            .reduce((o, p, i) => (o[p] = path.split(".").length === ++i ? value : o[p] || {}), object);
    }
}
