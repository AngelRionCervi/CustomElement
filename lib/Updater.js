import * as _H from "../lib/helpers.js";
import _G from "../lib/_GLOBALS_.js";

export default (_this) => {
    return {
        u_children(children) {
            const childrenLoops = children.filter((bind) => bind.type === "loop");
            _this.renderLoops(childrenLoops);
            const childrenIfs = children.filter((bind) => bind.type === "if");
            _this.renderIfs(childrenIfs);
            const childrenData = children.filter((bind) => bind.type === "data");
            _this.renderDataBinds(childrenData);
        },
        u_loops(key) {
            const corBinds = _this.binds.get(_G.LOOP_BIND).filter((bind) => _H.replaceAll(bind.key, "!", "") === key);
            if (corBinds.length > 0) _this.renderLoops(corBinds);
        },
        u_ifs(key) {
            const corBinds = _this.binds.get(_G.IF_BIND).filter((bind) => _H.replaceAll(bind.key, "!", "").includes(key));
            if (corBinds.length > 0) _this.renderIfs(corBinds);
        },
        u_data_binds(key) {
            const corBinds = _this.binds.get(_G.DATA_BIND).filter((bind) => _H.replaceAll(bind.key, "!", "") === key || _H.replaceAll(bind.condition, "!", "").includes(key));
            if (corBinds.length > 0) _this.renderDataBinds(corBinds);
        },
        u_text_binds(key) {
            const corBinds = _this.binds.get(_G.TEXT_BIND).filter((bind) => bind.keys.map((key) => _H.replaceAll(key, "!", "")).includes(key));
            if (corBinds.length > 0) _this.renderTextBinds(corBinds);
        },
        u_all_text_binds() {
            _this.detectTextBinds();
            _this.renderTextBinds(null);
        },
        set_state(...args) {
            if (!Array.isArray(args[0])) {
                _H.setPath(_this.state, args[0], args[1]);
                _this.updateBinds(args[0]);
                return _this;
            }
            args.forEach(([path, val]) => {
                _H.setPath(_this.state, path, val);
                _this.updateBinds(path);
            });
        },
    };
};
