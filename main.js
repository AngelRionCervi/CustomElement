import { createComp } from "./dist/EZC.js";
import gState from "./state.js";

createComp("simple-counter", ({ createState, register }) => {
    const { setState, state } = createState({
        count: 0,
        bgSrc: "https://i0.wp.com/www.wushujia.fr/wp-content/uploads/2016/03/js-logo.png?ssl=1",
        images: [{src: "https://i0.wp.com/www.wushujia.fr/wp-content/uploads/2016/03/js-logo.png?ssl=1"}],
    });

    register({
        addImage() {
            setState("bgSrc", "https://cdn4.iconfinder.com/data/icons/logos-and-brands/512/256_Php_logo-512.png")
            setState("images", ["https://cdn4.iconfinder.com/data/icons/logos-and-brands/512/256_Php_logo-512.png"])
        },
        swapImage() {
            setState("images", [...state.images, {src: "https://cdn4.iconfinder.com/data/icons/logos-and-brands/512/256_Php_logo-512.png"}]);
            console.log(state.images)
        }
    });

    return /* html */ `
        <p>{{count}}</p>
        <button on-click="setState('count', count + 1)">add</button>
        <button on-click="setState('count', count - 1)">decrease</button>
        <button on-click="swapImage">swap</button>
        <img src="{{ bgSrc }}"/>
        <p>{{images[0].src}}</p>
        <div if="{{ count }} >= 5">
            yoyo
            <div loop="$i in 0..5">
                <img src="{{ images[$i].src }}"/>
            </div>
        </div>
        <div loop="($img, $key, $index) in images">{{ $img.src }}</div>
    `;
});

createComp("t-comp", ({ createState, register, useGlobal, cycle }) => {
    const initState = {
        count: useGlobal("count"),
        name: "hola",
        fruits: [{ name: ["melon"] }, { name: ["berry"] }],
        ties: ["blue", "red"],
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
            .display-none {
                display: none;
            }
        </style>
        <button on-click="increaseGlobal ~ addNew ~ moreStuff.that('yes', 3)">add</button> <span> {{count}} {{name}} </span> 
        <div on-mouseover="eventStuff ~ eventTest2(3, 'hey', two)" class="text-big" class-bind="count > 3 : color-red ~ untrue: underline">this should NOT be red</div>
        <div class="just-a-container">
            <div loop="($item, $inde, $ii) in fruits">
                <p>hey boyyyyy {{$item.name}} {{count}} {{ $ii }}</p>
                <div loop="($ite, $index) in ties">
                    <br>hh {{$ite}} {{$index}}
                    <div if="$ite === 'blue'" class-bind="$ite !== 'blue' : display-none">HIIIIIIIIIIIIII</div>
                </div>
                <div loop-index="$inde"></div>
            </div>
        </div>
    `;
});
//<div loop="$n in {{ images }}">{{images}}</div>