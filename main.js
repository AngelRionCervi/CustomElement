import { createComp } from "./lib/EZC.js";
import gState from "./state.js";

createComp("t-comp", ({ createState, registerFn, useGlobal, cycle }) => {
    const initState = {
        count: useGlobal("count"),
        name: "hola",
        fruits: ["melon", "berry"],
        ties: ["blue", "red"],
    };
    const { state, setState } = createState(initState);

    setState("ties", [...state.ties, "green"]);

    registerFn({
        addGlobalThree() {
            gState.increaseCount();
        },
        addNew() {
            setState("ties", [...state.ties, "eeeeeeeeee"]);
        },
        eventStuff(evt) {
            console.log("evt lol", evt)
        },
        eventTest2(t, s, w) {
            console.log(t, s, w)
        }
    });

    let startTime; 

    cycle({
        beforeInit() {
            startTime = Date.now();
        },
        onRender() {
            const endTime = Date.now() - startTime;
            console.log("rendering time : " + endTime)
        }
    })

    return /* html */ `
        <style>
            .color-red {
                color: red;
            }
            .text-big {
                font-size: 4em;
            }
        </style>
        <button on-click="addGlobalThree ~ addNew">add</button> <span> {{count}} {{name}} </span> 
        <div on-mouseover="eventStuff ~ eventTest2(3, 'hey', two)" class="text-big" class-bind="count > 3 : color-red, untrue: underline">this should NOT be red</div>
        <div class="just-a-container">
            <div loop="($item, $inde) in fruits">
                <p>hey boyyyyy {{name}} {{count}}</p>
                <div loop="($ite, $index) in ties">
                    <div loop-item="$ite"></div>
                </div>
                <div loop-index="$inde"></div>
            </div>
        </div>
    `;
});

