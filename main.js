import EZC from "./lib/EZC.js";

class EZCTest extends EZC {
    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: "open" });
        this.state = {
            showOk: true,
            showLast: true,
            showLastest: true,
            one: 1,
            two: 2,
            ties: ["red", "blue"],
            fruits: ["strawberry", "mango"]
        };
        this.performance = 0;

        shadowRoot.innerHTML = /* html */`
            <div if="two > one">
                hi
                <div if="!showOk">
                    -<div loop="tie of ties">
                        <p loop-item="tie"></p>
                    </div>
                ok
                </div>
                <div if="showLast">
                    -<div loop="tie of fruits">
                        <div loop-item="tie"></div>
                    </div>
                ok
                </div>
            </div>
        `;
    }

    beforeInit() {
        this.performance = Date.now();
    }

    onInit() {
        //console.log(this.dispatchEvent)
    }

    onRender() {
        this.setState("showOk", false)
        this.setState("showLast", false)
        this.performance = Date.now() - this.performance;
        console.log(`rendering time : ${this.performance}`);
    }
}

customElements.define("loop-test", EZCTest);