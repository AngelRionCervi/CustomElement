const main = () => {
    const store = new Map();
    return {
        add(symbol, foreignState) {
            store.set(symbol, foreignState);
        },
        remove(symbol) {
            store.delete(symbol);
        },
        get(symbol) {
            console.log(store.get(symbol));
            return store.get(symbol);
        }
    }
}

export default main();