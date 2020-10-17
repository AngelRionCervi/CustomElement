interface options {
    LOOP_BIND: string;
    LOOP_ITEM: string;
    LOOP_KEY: string;
    LOOP_INDEX: string;
    DATA_BIND: string;
    TEXT_BIND: string;
    CLASS_BIND: string;
    IF_BIND: string;
    REF: string;
    PROPS: string;
    KEY_ATTR: string;
    EVENTS_ATTR: string[];
    TEXT_BIND_REGEXP: RegExp;
    IF_SCOPE_REGEXP: RegExp;
    LOOP_BRACE_REGEXP: RegExp;
    LOOP_IN_REGEX: RegExp;
    PARAM_DELIMITER: string;
    EXP_DELIMITER: string;
    DOUBLEDOT_DELIMITER: string;
    OBJECT_SEPARATOR: string;
    LOOP_VAR_REGEX: RegExp;
    RANGE_LOOP_DOTS: string;
}

interface vElem {
    attributes: any[];
    updateKeys: string[];
    tag: string;
    type: string;
    options: any;
    cache: any;
    node: HTMLElement;
    baseHTML: string;
    children: vElem[];
    parent: vElem;
    nodeIndex: number;
    condition?: string;
}

interface nodeInfo {
    attributes: any[] | null,
    type: string,
    variable: any,
    index: any,
    key: any,
}

interface register {
    name: string,
    fn: Function,
}
