define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.replaceAll = exports.splitTrim = exports.setPath = exports.resolvePath = void 0;
    exports.resolvePath = function (obj, path, separator) {
        if (separator === void 0) { separator = "."; }
        return path
            .trim()
            .split(separator)
            .reduce(function (prev, curr) { return prev && prev[curr]; }, obj);
    };
    exports.setPath = function (obj, path, value, separator) {
        if (separator === void 0) { separator = "."; }
        path.trim()
            .split(separator)
            .reduce(function (o, p, i) {
            return (o[p] = path.trim().split(separator).length === ++i ? value : o[p] || {});
        }, obj);
    };
    exports.splitTrim = function (string, separator) {
        return string.split(separator).map(function (e) { return e.trim(); });
    };
    exports.replaceAll = function (s, m, r, p) {
        return s === p || r.includes(m) ? s : exports.replaceAll(s.replace(m, r), m, r, s);
    };
});
