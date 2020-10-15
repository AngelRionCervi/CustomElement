const main = () => {
    const store = new Map();
    const methodKey = "methods";
    const globalKey = "globals";
    store.set(methodKey, {});
    store.set(globalKey, {});
    return {
        __add(symbol: Symbol, foreignState: any): object {
            store.set(symbol, foreignState);
            return this;
        },
        __remove(symbol: Symbol): object {
            store.delete(symbol);
            return this;
        },
        __get(symbol: Symbol): object {
            if (!store.has(symbol)) return this;
            return store.get(symbol).state;
        },
        getEntry(symbol: Symbol): any {
            if (!store.has(symbol)) return this;
            return store.get(symbol);
        },
        createGlobalState(obj: any): object {
            for (const [key, val] of Object.entries(obj)) {
                if (typeof val === "function") {
                    this.getGlobal()[key] = val;
                    continue;
                }
                const entry = { val, corStates: [] };
                this.getGlobal()[key] = entry;
            }
            return this;
        },
        addSymbolToKey(key: string, symbol: Symbol): object {
            this.getGlobal()[key].corStates.push(symbol);
            return this;
        },
        setGlobal(key: string, val: any): object {
            let entry = this.getGlobal()[key];
            if (!entry) {
                entry = { val, corStates: [] };
                this.getGlobal()[key] = entry.val;
            }
            entry.val = val;
            entry.corStates.forEach((symbol: Symbol) => {
                const ctx = this.getEntry(symbol).ctx;
                ctx.setState(key, entry.val);
            });
            return this;
        },
        getGlobal(key: string | null = null): any {
            if (!key) return store.get(globalKey);
            return store.get(globalKey)[key].val;
        },
        getGlobalState(): object {
            return {
                ...this.getGlobal(),
                getGlobal: this.getGlobal,
                setGlobal: this.setGlobal,
            };
        },
    };
};

export default main();
