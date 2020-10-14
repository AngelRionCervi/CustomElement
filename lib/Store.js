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
        __remove(symbol) {
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
        createGlobalState(obj) {
            for (const [key, val] of Object.entries(obj)) {
                if (typeof val === "function")  {
                    this.getGlobal()[key] = val;
                    continue;
                }
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
            let entry = this.getGlobal()[key];
            if (!entry) {
                entry = { val, corStates: [] };
                this.getGlobal()[key] = entry.val;
            }
            entry.val = val;
            entry.corStates.forEach((symbol) => {
                const ctx = this.getEntry(symbol).ctx;
                ctx.setState(key, entry.val);
            })
            return this;
        },
        getGlobal(key = null) {
            if (!key) return store.get(globalKey);
            return store.get(globalKey)[key].val;
        },
        getGlobalProps() {
            return {
                ...this.getGlobal(),
                getGlobal: this.getGlobal,
                setGlobal: this.setGlobal,
            };
        },
    };
};

export default main();
