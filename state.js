import { store } from "./lib/EZC.js";

store.createGlobalState({ count: 1 });

const increaseCount = () => {
    store.setGlobal("count", store.getGlobal("count") + 1);
};


store.registerMethods("increaseCount", increaseCount);

export default store.getGlobalProps();