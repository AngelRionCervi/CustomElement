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
            <div if="two > 3 - 2">
                hi
                <div if="showOk">
                    -<div loop="tie of ties">
                        <p loop-item="tie"></p>
                    </div>
                ok
                </div>
                <div if="showLast">
                    -<div loop="tie of fruits">
                        <div loop-item="tie"></div>
                        -<div loop="tie of ties">
                        <p loop-item="tie"></p>
                    </div>
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
        this.setState("showLast", true)
        this.setState("ties", [...this.state.ties, "green", "yellow"])
        this.performance = Date.now() - this.performance;
        console.log(`rendering time : ${this.performance}`);
    }
}

customElements.define("loop-test", EZCTest);