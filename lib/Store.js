const main = () => {
    const store = {};
    return {
        add(symbol, foreignState) {
            store[symbol] = foreignState;
        },
        remove(symbol) {
            delete store[symbol];
        },
        get(symbol) {
            console.log(store[symbol])
            return store[symbol];
        }
    }
}

export default main();