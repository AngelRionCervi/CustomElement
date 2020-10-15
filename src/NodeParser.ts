import _G from "./_GLOBALS_.js";
import StringParser from "./StringParser.js";
import * as _H from "./helpers.js";

export default (_this: any, state: any) => {
    return {
        parse(vElem: vElem): any {
            const { attributes, node, cache, type } = vElem;
            if (type === "text" && cache.hasOwnProperty("baseText")) {
                node.textContent = this.parseTextContent(cache.baseText, attributes, vElem);
            }
            if (attributes.length === 0) return node;
            attributes.forEach((att) => {
                if (att.name && att.name.includes("on-")) {
                    this.createEventListener(att, node);
                } else {
                    switch(att.name) {
                        case _G.CLASS_BIND:
                            node.className = this.parseClasses(att.value, node.className);
                            break;
                    }
                }
            })
        },
        parseClasses(attVal: string, curClassName: string): string {
            const splitAtt = attVal.split(_G.EXP_DELIMITER);
            const attClassesList = splitAtt.map((e) => _H.splitTrim(e, _G.DOUBLEDOT_DELIMITER).pop());
            const baseClasses = curClassName.split(" ").filter((bc: string) => !attClassesList.includes(bc));
            return baseClasses.join(" ") + splitAtt.reduce((acc: string, exp: string) => {
                const [cond, clazz] = exp.split(_G.DOUBLEDOT_DELIMITER);
                if (StringParser(state).parse(cond)) {
                    return acc + clazz;
                } 
                return acc;
            }, "")
        },
        parseTextContent(baseText: string, attributes: any[], vElem: vElem): string {
            return attributes.reduce((acc, res) => {
                const cachedVal = _H.findCache(res.key, vElem);
                if (cachedVal) return acc.replace(res.match, cachedVal);
                return acc.replace(res.match, _H.resolvePath(state, res.key));
            }, baseText);
        },
        createEventListener(att: any, node: any): void {
            const [eventType, callbacks] = [att.name.replace("-", "").toLowerCase(), _H.splitTrim(att.value, _G.EXP_DELIMITER)] as [string, string[]];
            node[eventType] = (evt: Event) => {
                callbacks.forEach((cb: string) => {
                    const argsB: RegExpMatchArray | null = cb.match(_G.LOOP_BRACE_REGEXP);
                    let [args, fnName] = [[evt], cb] as [any, any];
                    if (argsB) {
                        args = StringParser(state).getPrimFromSplit(_H.splitTrim(argsB[1], _G.PARAM_DELIMITER));
                        fnName = cb.split(_G.LOOP_BRACE_REGEXP).shift();
                    } 
                    const fn = _H.resolvePath(_this, fnName);
                    if (fn) {
                        fn(...args);
                        return;
                    } 
                    throw new Error(`Callback ${ fnName } doesn't exist on component "${ _this.tagName.toLowerCase() }".`)
                })
            }
        }
    }
}