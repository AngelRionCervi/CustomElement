const main = () => {
    const store = new Map();
    const methodKey = "methods";
    const globalKey = "globals";
    store.set(methodKey, {});
    store.set(globalKey, {});
    return {
        __add(symbol, foreignState) {
            store.set(symbol, foreignState);
            return this;
        },
        remove(symbol) {
            store.delete(symbol);
            return this;
        },
        __get(symbol) {
            if (!store.has(symbol)) return;
            return store.get(symbol).state;
        },
        getEntry(symbol) {
            if (!store.has(symbol)) return;
            return store.get(symbol);
        },
        registerMethods(key, fn) {
            store.get(methodKey)[key] = fn;
            return this;
        },
        getMethod(key = null) {
            if (!key) return store.get(methodKey)
            return store.get(methodKey)[key];
        },
        createGlobalState(obj) {
            for (const [key, val] of Object.entries(obj)) {
                const entry = { val, corStates: [] };
                this.getGlobal()[key] = entry;
            }
            return this;
        },
        addSymbolToKey(key, symbol) {
            this.getGlobal()[key].corStates.push(symbol);
            return this;
        },
        setGlobal(key, val) {
            const entry = this.getGlobal()[key];
            entry.val = val;
            entry.corStates.forEach((symbol) => {
                console.log(this)
                const ctx = this.getEntry(symbol).ctx;
                ctx.setState(key, entry.val);
            })
            return this;
        },
        getGlobal(key = null) {
            if (!key) return store.get(globalKey)
            return store.get(globalKey)[key].val;
        },
        getGlobalProps() {
            return {
                ...this.getMethod(),
                ...this.getGlobal(),
                ...this,
            };
        },
    };
};

export default main();
