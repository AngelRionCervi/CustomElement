import _G from "./_GLOBALS_.js";
import StringParser, { parseTextWithVar } from "./StringParser.js";
import * as _H from "./helpers.js";

export default (_this: any, state: any) => {
    return {
        parse(vElem: vElem): any {
            const { attributes, node, cache, type } = vElem;
            if (type === "text" && cache.hasOwnProperty("baseText")) {
                node.textContent = this.parseTextContent(cache.baseText, attributes, vElem);
                return;
            }
            if (attributes.length === 0) return node;
            attributes.forEach((att) => {
                if (att.name && att.name.includes("on-")) {
                    this.createEventListener(att, node, vElem);
                } else {
                    switch (att.name) {
                        case _G.CLASS_BIND:
                            node.className = this.parseClasses(att.value, node.className, vElem);
                            break;
                        default:
                            node.setAttribute(att.name, parseTextWithVar(state, vElem, att.value));
                            break;
                    }
                }
            });
        },
        parseClasses(attVal: string, curClassName: string, vElem: vElem): string {
            const splitAtt = attVal.split(_G.EXP_DELIMITER);
            const attClassesList = splitAtt.map((e) => _H.splitTrim(e, _G.DOUBLEDOT_DELIMITER).pop());
            const baseClasses = curClassName.split(" ").filter((bc: string) => !attClassesList.includes(bc));
            return (
                baseClasses.join(" ") +
                splitAtt.reduce((acc: string, exp: string) => {
                    const [cond, clazz] = exp.split(_G.DOUBLEDOT_DELIMITER);
                    if (StringParser(state, vElem).parse(cond)) {
                        return acc + clazz;
                    }
                    return acc;
                }, "")
            );
        },
        parseTextContent(baseText: string, attributes: any[], vElem: vElem): string {
            
            return attributes.reduce((acc, res) => {
                // refactor pour utiliser parseTextContent
                const val = _H.getValueFromStrVar(state, vElem, parseTextWithVar(state, vElem, res.key));
                console.log("ffff", parseTextWithVar(state, vElem, res.key))
                return _H.replaceAll2(acc, res.match, val);
            }, baseText);
        },
        createEventListener(att: any, node: any, vElem: vElem): void {
            const eventType: string = att.name.replace("-", "").toLowerCase();
            const callbacks: string[] = _H.splitTrim(att.value, _G.EXP_DELIMITER);
            node[eventType] = (evt: Event) => {
                callbacks.forEach((cb: string) => {
                    const argsB: RegExpMatchArray | null = cb.match(_G.LOOP_BRACE_REGEXP);
                    let [args, fnName] = [[evt], cb] as [any, any];
                    if (argsB) {
                        args = StringParser(state, vElem).getPrimFromSplit(_H.splitTrim(argsB[1], _G.PARAM_DELIMITER));
                        fnName = cb.split(_G.LOOP_BRACE_REGEXP).shift();
                    }
                    const fn = _H.resolvePath(_this, fnName) || _H.resolvePath(state, fnName) || null;
                    if (fn) {
                        fn(...args);
                        return;
                    }
                    throw new Error(`Callback ${fnName} doesn't exist on component "${_this.tagName.toLowerCase()}".`);
                });
            };
        },
    };
};
