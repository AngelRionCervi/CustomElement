import * as _H from "../lib/helpers.js";
import _G from "../lib/_GLOBALS_.js";

export default (_this) => {
    return {
        u_children(children) {
            const childrenLoops = children.filter((bind) => bind.type === "loop");
            _this.renderLoops(childrenLoops);
            const childrenIfs = children.filter((bind) => bind.type === "if");
            _this.renderIfs(childrenIfs);
        },
        u_loops(key) {
            const corBinds = _this.binds.get(_G.LOOP_BIND).filter((bind) => _H.replaceAll(bind.key, "!", "") === key);
            if (corBinds.length > 0) _this.renderLoops(corBinds);
        },
        u_ifs(key) {
            const corBinds = _this.binds.get(_G.IF_BIND).filter((bind) => _H.replaceAll(bind.key, "!", "") === key);
            if (corBinds.length > 0) _this.renderIfs(corBinds);
        },
        u_binds(key) {
            _this.updateLoops(key);
            _this.updateIfs(key);
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
        }
    };
};
