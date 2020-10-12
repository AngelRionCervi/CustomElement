const main = () => {
    const store = new Map();
    const methodKey = "methods";
    const globalKey = "globals";
    store.set(methodKey, {});
    store.set(globalKey, {});
    return {
        add(symbol, foreignState) {
            store.set(symbol, foreignState);
            return this;
        },
        remove(symbol) {
            store.delete(symbol);
            return this;
        },
        get(symbol) {
            if (!store.has(symbol)) return;
            return store.get(symbol).state;
        },
        getEntry(symbol) {
            if (!store.has(symbol)) return;
            return store.get(symbol);
        },
        registerMethods(fns) {
            store.set(methodKey, { ...store.get(methodKey), ...fns });
            return this;
        },
        setNewKeys(obj) {
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
                const ctx = this.getEntry(symbol).ctx;
                ctx.setState(key, entry.val);
            })
            return this;
        },
        getGlobal() {
            return store.get(globalKey);
        },
        /// debug ///
        getStore() {
            return store;
        },
    };
};

export default main();
