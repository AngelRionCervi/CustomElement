import { store } from "./lib/EZC.js";

store.createGlobalState({
    count: 1,
    increaseCount: () => store.setGlobal("count", store.getGlobal("count") + 1),
    sayHi() {
        console.log("HI");
    },
    yes: "no",
    rndmInt: Math.random() * 1000,
});

const increaseALot = () => {
    store.setGlobal("count", store.getGlobal("count") + 500);
};

store.setGlobal("increaseALot", increaseALot);

export default store.getGlobalProps();
