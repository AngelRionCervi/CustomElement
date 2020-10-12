import EZC, { createComp } from "./lib/EZC.js";
import store from "./lib/Store.js";

store.setNewKeys({ count: 4 });

const increaseCount = () => {
    store.setGlobal("count", store.getGlobal("count") + 1);
};

createComp("t-comp", ({ createState, cycle, registerFn, useGlobal }) => {
    const initState = {
        count: useGlobal("count"),
        name: "hola",
        fruits: ["melon", "berry"],
        ties: ["blue", "red"],
    };
    const { state, setState } = createState(initState);

    store.setGlobal("count", 2)

    setState("ties", [...state.ties, "green"]);

    registerFn({
        addThree() {
            setState("count", state.count + 0.5);
        },
        addNew() {
            setState("ties", [...state.ties, "eeeeeeeeee"]);
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
        <button on-click="addThree ~ addNew">add</button> <span> {{count}} {{name}} </span> 
        <div on-mouseover="state.b.eventTest ~ eventTest2(3, 'hey', two)" class="text-big" class-bind="count > 3 : color-red, untrue: underline">this should NOT be red</div>
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

// class SomeLilComponent extends EZC {
//     constructor() {
//         super();
//         const shadowRoot = this.attachShadow({ mode: "open" });
//         this.state = {};
//         shadowRoot.innerHTML = /* html */ `
//             <div> child comp </div>
//         `
//         this.props.p();
//     }
// }

// customElements.define("child-comp", SomeLilComponent);

// class EZCTest extends EZC {
//     constructor() {
//         super();
//         const shadowRoot = this.attachShadow({ mode: "open" });
//         this.state = {
//             showOk: true,
//             showLast: true,
//             showLastest: true,
//             untrue: true,
//             displayName: 10,
//             displayName2: 2,
//             one: 1,
//             two: 2,
//             hihi: "hahahahahaah",
//             someText: "some text lol",
//             ties: ["red", "blue"],
//             fruits: ["strawberry", "mango", "cherry"],
//             cars: { bmw: "m5", audi: "r8" },
//             rclass: "rezrzrzr",
//             bigAssArray: new Array(1000).fill(0),
//             b: {
//                 eventTest(evt) {
//                     console.log("event triggered")
//                 }
//             }
//         };
//         this.performance = 0;

//         shadowRoot.innerHTML = /* html */ `
//         <style>
//             .color-red {
//                 color: red;
//             }
//             .underline {
//                 text-decoration: underline;
//             }
//             .text-big {
//                 font-size: 5em;
//             }
//             .dtitle {
//                 font-size: 500%;
//             }
//         </style>

//         <div class="just-a-container">

//         </div>
//         <div>lalalalala</div>
//         <child-comp props="p: propsTest"></child-comp>
//         <br>
//         <div on-mouseover="state.b.eventTest ~ eventTest2(3, 'hey', two)" class="text-big" class-bind="one > two : color-red, untrue: underline">this should NOT be red</div>
//         <div class="just-a-container">
//             <div loop="($item, $inde) in fruits">
//                 <p>hey boyyyyy {{hihi}} {{rclass}}</p>
//                 <div loop="($ite, $index) in ties">
//                     <div loop-item="$ite"></div>
//                 </div>
//                 <div loop-index="$inde"></div>
//             </div>
//         </div>
//         <div>
//             <br>
//             <br>
//             <span>

//             </span>
//         </div>
//         <div if="showOk === true">
//             hi
//             <div loop="($it, $indx) in ties">
//                 <div loop-item="$it"></div>
//                 <div if="displayName2 - 1 < $indx">NAME DISPLAYED AAAAAAAA {{hihi}} {{rclass}}</div>
//             </div>
//             <br>
//             jojo
//             <br>
//             <br>
//             <div loop="($it, $indx) in ties">
//                 <div loop-item="$it"></div>
//             </div>
//             <span>spans</span>
//         </div>
//         `;
//         `
//         <div if="showOk">showok bud</div>
//         <div loop="(item, index) in fruits">
//         <p>out2</p>
//     </div>
//     <table>
//     <tbody loop="i of bigAssArray">
//         <tr>
//             <td>The table body</td>
//         </tr>
//     </tbody>
// </table>
// <p class-bind="displayName : color-red, rclass"> {{ someText }} </p>
// <div data-bind="one > 0 : hihi"></div>
// <div if="two === 3 - 2">
//     hi
//     <div if="showOk">
//         -<div loop="tize in ties">
//             <p loop-item="tize"></p>
//         </div>
//     cant see me
//     </div>
//     <div if="showLast">
//         -<div loop="(fruit, key) in fruits">
//         <p> {{ one }} {{ two }}</p>
//         <div data-bind="one > 0 : hihi"></div>
//             <div loop-item="fruit"></div>
//             <div loop-key="key"></div>
//             -<div loop="tie in ties">
//                 <p> {{ someText }} </p>
//                 <div data-bind="one > 0 : hihi"></div>
//             </div>
//         </div>
//     ok
//     </div>
// </div>
//     `;
//     }

//     beforeInit() {
//         this.performance = Date.now();
//     }

//     onInit() {
//         //console.log(this.dispatchEvent)
//     }

//     onRender() {
//         this.performance = Date.now() - this.performance;
//         console.log(`init rendering time : ${this.performance}`);
//         this.setState("ties", [...this.state.ties, "yy"]);
//         this.setState("fruits", [...this.state.fruits.filter((fruit) => fruit !== "mango")]);
//         this.setState("showOk", false);
//         this.setState("rclass", "hi");
//         this.setState("showOk", true);
//         this.setState("ties", [...this.state.ties, "gg"]);
//         this.setState("one", 5);
//         this.setState("hihi", "eee");
//         this.setState("hihi", "eeettetert");
//         //this.setState("ties", [...this.state.ties, "BIG TREE", "SAPLING"]);

//     }

//     eventTest2(n, s, v, l) {
//         console.log("event 2 triggered lol", n, s, v)
//     }

//     propsTest() {

//     }
// }

// customElements.define("loop-test", EZCTest);
