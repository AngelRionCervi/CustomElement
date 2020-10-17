import { createComp } from "./dist/EZC.js";
import gState from "./state.js";

createComp("simple-counter", ({ createState, register }) => {
    const { setState } = createState({
        count: 0,
        bgSrc: "https://i0.wp.com/www.wushujia.fr/wp-content/uploads/2016/03/js-logo.png?ssl=1",
    });
    
    register({
        addImage() {
            console.log("hey")
        }
    })

    return /* html */ `
        <p>{{count}}</p>
        <button on-click="setState('count', count + 1)">add</button>
        <img src="{{ bgSrc }}">
        <div loop="$n in 0..10"> {{ $n }} </div>
    `;
});

createComp("t-comp", ({ createState, register, useGlobal, cycle }) => {
    const initState = {
        count: useGlobal("count"),
        name: "hola",
        fruits: [{ name: "melon" }, "berry"],
        ties: [{ color: "blue" }, { color: "red" }],
        increaseGlobal() {
            gState.increaseALot();
        },
    };
    const { state, setState } = createState(initState);

    setState("ties", [...state.ties, "green"]);

    register({
        addGlobalThree() {
            gState.increaseALot();
        },
        addNew() {
            setState("ties", [...state.ties, "eeeeeeeeee"]);
        },
        eventStuff(evt) {
            console.log("evt lol", evt);
        },
        eventTest2(t, s, w) {
            console.log(t, s, w);
        },
        moreStuff: {
            that(whattolog, whattolog2) {
                console.log(whattolog, whattolog2);
            },
        },
    });

    let startTime;

    cycle({
        beforeInit() {
            startTime = Date.now();
        },
        onRender() {
            const endTime = Date.now() - startTime;
            console.log("rendering time : " + endTime);
        },
    });

    return /* html */ `
        <style>
            .color-red {
                color: red;
            }
            .text-big {
                font-size: 4em;
            }
        </style>
        <button on-click="increaseGlobal ~ addNew ~ moreStuff.that('yes', 3)">add</button> <span> {{count}} {{name}} </span> 
        <div on-mouseover="eventStuff ~ eventTest2(3, 'hey', two)" class="text-big" class-bind="count > 3 : color-red ~ untrue: underline">this should NOT be red</div>
        <div class="just-a-container">
            <div loop="($item, $inde) in fruits">
                <p>hey boyyyyy {{$item.name}} {{count}}</p>
                <div loop="($ite, $index) in ties">
                    <br>hh {{$ite.color}} {{$index}} {{$ite}}
                    <div if="$ite.color === 'blue'">HIIIIIIIIIIIIII</div>
                </div>
                <div loop-index="$inde"></div>
            </div>
        </div>
    `;
});
