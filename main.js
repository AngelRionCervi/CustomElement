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
            <p> {{ one }} {{ two }}</p>
            <div if="two === 3 - 2">
                hi
                <div if="showOk">
                    -<div loop="tize of ties">
                        <p loop-item="tize"></p>
                    </div>
                ok
                </div>
                <div if="showLast">
  
                    -<div loop="fruit of fruits">
                    <p> {{ one }} {{ two }}</p>
                        <div loop-item="fruit"></div>
                        -<div loop="tie of ties">
                            <p> {{ one }} {{ two }}</p>
                            
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
        this.setState("two", 1)
        this.setState("ties", [...this.state.ties, "green", "yellow"])
        this.performance = Date.now() - this.performance;
        console.log(`rendering time : ${this.performance}`);
    }
}

customElements.define("loop-test", EZCTest);