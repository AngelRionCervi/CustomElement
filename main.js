import EZC from "./lib/EZC.js";

class EZCTest extends EZC {
    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: "open" });
        this.state = {
            showOk: true,
            showLast: true,
            showLastest: true,
            displayName: true,
            one: 1,
            two: 2,
            hihi: "hahahahahaah",
            someText: "some text lol",
            ties: ["red", "blue"],
            fruits: ["strawberry", "mango", "cherry"],
            cars: { bmw: "m5", audi: "r8" },
            rclass: "rezrzrzr",
            bigAssArray: new Array(1000).fill(0),
        };
        this.performance = 0;

        shadowRoot.innerHTML = /* html */ `
        <style>
            .color-red {
                color: red;
            }
            .underline {
                text-decoration: underline;
            }
            .text-big {
                font-size: 5em;
            }
            .dtitle {
                font-size: 500%;
            }
        </style>
        
            <div>lalalalala</div>
            <div class="just-a-container">
                <div loop="(item, inde) in fruits">
                    <p>hey boyyyyy</p>
                    <div loop="(ite, index) in ties">
                        <p>aa</p>
                        <div loop-item="ite"></div>
                    </div>
                    <div loop-index="inde"></div>
                </div>
                
            </div>
            
        `;
        `
        <div loop="(item, index) in fruits">
        <p>out2</p>
    </div>

    <table>
    <tbody loop="i of bigAssArray">
        <tr>
            <td>The table body</td>
        </tr>
    </tbody>
</table>
<p class-bind="displayName : color-red, rclass"> {{ someText }} </p>
<div data-bind="one > 0 : hihi"></div>
<div if="two === 3 - 2">
    hi
    <div if="showOk">
        -<div loop="tize in ties">
            <p loop-item="tize"></p>
        </div>
    cant see me
    </div>
    <div if="showLast">
        -<div loop="(fruit, key) in fruits">
        <p> {{ one }} {{ two }}</p>
        <div data-bind="one > 0 : hihi"></div>
            <div loop-item="fruit"></div>
            <div loop-key="key"></div>
            -<div loop="tie in ties">
                <p> {{ someText }} </p>
                <div data-bind="one > 0 : hihi"></div>
            </div>
        </div>
    ok
    </div>
</div>
    `
    }

    beforeInit() {
        this.performance = Date.now();
    }

    onInit() {
        //console.log(this.dispatchEvent)
    }

    onRender() {

        this.setState("fruits", [...this.state.fruits.filter((fruit) => fruit !== "mango")]);
        //this.setState("ties", [...this.state.ties, "BIG TREE", "SAPLING"]);
        this.performance = Date.now() - this.performance;
        console.log(`rendering time : ${this.performance}`);
    }
}

customElements.define("loop-test", EZCTest);
