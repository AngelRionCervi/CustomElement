const LOOP_BIND = "loop";
const LOOP_ITEM = "loop-item";
const LOOP_INDEX = "loop-index";

export default class CustomElement extends HTMLElement {
    constructor() {
        super();
        this.binds = new Map();
        this.events = new Map();
        this.props = {};
        this.refs = {};
    }

    connectedCallback() {
        this.binds.set(LOOP_BIND, []);
        if (typeof this.beforeInit === "function") this.beforeInit();
        this.detectLoops();
        if (typeof this.onInit === "function") this.onInit();
        this.renderLoops();
        if (typeof this.onRender === "function") this.onRender();
    }

    detectLoops() {
        [...this.selectAll(`[${LOOP_BIND}]`)].forEach((elem) => {
            const attr = elem.getAttribute(LOOP_BIND);
            const [variable, key] = this.splitTrim(attr, "of");
            if (
                !this.binds
                    .get(LOOP_BIND)
                    .map((bind) => bind.attr)
                    .includes(attr)
            ) {
               

                const loopObj = {
                    elem,
                    innerStuff: elem.innerHTML,
                    parent: elem.parentNode,
                    position: this.getNodePosition(elem),
                    size: this.resolvePath(this.state, key).length,
                    items: this.resolvePath(this.state, key),
                    attr,
                    variable,
                    key,
                };
                
                this.binds.get(LOOP_BIND).push(loopObj);
            }
        });
        // paternity test
        /*
        this.binds.get(LOOP_BIND).forEach((bind, _, arr) => {
            bind.childrenLoops = this.getClosestLoopChildren(arr.filter((b) => bind.elem.contains(b.elem) && !bind.elem.isSameNode(b.elem)), bind)
        });*/
    }

    getClosestLoopChildren(childrenBinds, bind) {
        const childrenDepths = [];
        const bindDepth = elementDepth(bind.elem);
        childrenBinds.forEach((bind) => {
            const childDepth = elementDepth(bind.elem);
            if (childDepth) childrenDepths.push({ bind, depth: childDepth });
        });
        const closest = findClosest(
            bindDepth,
            childrenDepths.map((b) => b.depth)
        );
        if (closest) {
            return childrenDepths.filter((child) => child.depth === closest).map((child) => child.bind);
        } else {
            return [];
        }
    }

    renderLoops(setBinds = null) {
        console.log("hey")
        const binds = setBinds ? setBinds : this.binds.get(LOOP_BIND);
        binds.forEach((bind) => {
            const corLoops = [...this.selectAll(`[${LOOP_BIND}$="${bind.attr}"]`)];
            const arrayToLoop = this.resolvePath(this.state, bind.key);
            const htmlToLoop = bind.innerStuff;
            corLoops.forEach((elem) => {
                elem.innerHTML = "";
                arrayToLoop.forEach((item) => {
                    const node = this.stringToHtml(`<div>${htmlToLoop}</div>`);
                    [...this.selectAll(`[${LOOP_ITEM}]`, node)].forEach((child) => {
                        const itemVar = child.getAttribute(LOOP_ITEM);
                        if (itemVar === bind.variable) {
                            child.innerHTML = item;
                        }
                    });
                    elem.innerHTML += node.innerHTML;
                });
            });
            
        })
    }

    updateLoops(key) {
        const corBinds = this.binds.get(LOOP_BIND).filter((bind) => bind.key === key);
        this.renderLoops(corBinds);
    }

    setState(...args) {
        if (!Array.isArray(args[0])) {
            this.setPath(this.state, args[0], args[1]);
            this.updateLoops(args[0]);
            return this;
        }
        args.forEach(([path, val]) => {
            this.setPath(this.state, path, val);
            this.updateLoops(path);
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

    resolvePath(obj, path, separator = ".") {
        return path
            .trim()
            .split(separator)
            .reduce((prev, curr) => prev && prev[curr], obj);
    }

    setPath(object, path, value, separator = ".") {
        path.trim()
            .split(separator)
            .reduce((o, p, i) => {
                return (o[p] = path.trim().split(separator).length === ++i ? value : o[p] || {});
            }, object);
        return this;
    }

    dotToCamel(dot) {
        return dot.indexOf(".") < 0 ? dot : dot.replace(/\.[a-z]/g, (m) => m[1].toUpperCase());
    }

    stringToHtml(string) {
        return new DOMParser().parseFromString(string, "text/html").body.firstChild;
    }

    splitTrim(string, separator) {
        return string.split(separator).map((e) => e.trim());
    }

    getNodePosition(node) {
        return Array.prototype.indexOf.call(node.parentNode.children, node);
    }
}
function elementDepth(el) {
    var depth = 0;
    while (null !== el.parentElement) {
        el = el.parentElement;
        depth++;
    }
    return depth;
}

const findClosest = function (x, arr) {
    var indexArr = arr.map(function (k) {
        return Math.abs(k - x);
    });
    var min = Math.min.apply(Math, indexArr);
    return arr[indexArr.indexOf(min)];
};