import * as _H from "../lib/helpers.js";
import _G from "../lib/_GLOBALS_.js";

const tree = [];

export default (_this) => {
    return {
        detect() {
            const getAttributes = (node) => {
                const possibleAttrs = [_G.LOOP_BIND];
                const nodeAttrs = [];
                possibleAttrs.forEach((q) => {
                    if (node.hasAttribute(q)) {
                        nodeAttrs.push({ name: q, value: node.getAttribute(q) });
                    }
                });

                return nodeAttrs;
            };
            const categorize = (node, dfsOnHTMLNodesPreOrder) => {
                const attributes = getAttributes(node);
                const vElem = { attributes, tag: node.tagName, elem: node, children: dfsOnHTMLNodesPreOrder(node) };
                return vElem;
            };
            let dfsOnHTMLNodesPreOrder = (node = _this.shadowRoot) => {
                const res = [];
                let stk = [];
                if (node.firstElementChild) stk.push(node.firstElementChild);

                while (stk.length !== 0) {
                    let currentNode = stk.pop();

                    //check for the condiditon or just console.log
                    const vElem = categorize(currentNode, dfsOnHTMLNodesPreOrder)
                    res.push(vElem);

                    if (currentNode.nextElementSibling) {
                        stk.push(currentNode.nextElementSibling);
                    }
                }
                console.log(res)
                return res;
                
            };
            dfsOnHTMLNodesPreOrder();
        },
        render(setBinds = null) {
            const binds = setBinds ? setBinds : _this.binds.get(_G.LOOP_BIND);
            binds.forEach((bind) => {
                const corLoops = bind.results;
                const objToLoop = _H.resolvePath(_this.state, bind.key);
                corLoops.forEach((inst) => {
                    inst.elem.innerHTML = "";
                    Object.entries(objToLoop).forEach(([key, item]) => {
                        const node = _H.stringToHtml(`<div>${inst.innerStuff}</div>`);
                        [..._this.selectAll(`[${_G.LOOP_ITEM}$="${bind.variable}"]`, node)].forEach((child) => {
                            child.innerHTML = item;
                        });
                        [..._this.selectAll(`[${_G.LOOP_KEY}$="${bind.index}"]`, node)].forEach((child) => {
                            child.innerHTML = key;
                        });
                        inst.elem.innerHTML += node.innerHTML;
                    });
                    if (inst.children.length > 0) {
                        _this.updateChildren(inst.children);
                    }
                });
            });
        },
        renderChildren(children) {
            children.forEach((inst) => {
                inst.elem.innerHTML = "";
                const objToLoop = _H.resolvePath(_this.state, inst.key);
                Object.entries(objToLoop).forEach(([key, item]) => {
                    const node = _H.stringToHtml(`<div>${inst.innerStuff}</div>`);
                    [..._this.selectAll(`[${_G.LOOP_ITEM}$="${inst.variable}"]`, node)].forEach((child) => {
                        child.innerHTML = item;
                    });
                    [..._this.selectAll(`[${_G.LOOP_KEY}$="${inst.index}"]`, node)].forEach((child) => {
                        child.innerHTML = key;
                    });
                    inst.elem.innerHTML += node.innerHTML;
                });
            });
        },
    };
};
