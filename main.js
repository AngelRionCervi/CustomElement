import EZC from "./lib/EZC.js";

class EZCTest extends EZC {
    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: "open" });
        this.state = {
            showOk: true,
            showLast: true,
            showLastest: true,
            ties: ["red", "blue"],
            fruits: ["strawberry", "mango"]
        };
        this.performance = 0;

        shadowRoot.innerHTML = /* html */`
            <div loop="fruit of fruits">
                hi
                <div if="showOk">
                    -<div loop="tie of ties">
                        <div if="showLast">
                            ~<div loop="fr of fruits">
                                <p loop-item="fr"></p>
                                <p if="showLastest">lastest</p>
                            </div>
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
        this.setState("fruits", [...this.state.fruits]);
        this.setState("ties", [...this.state.ties, "green"]);
        this.setState("showOk", true)
        this.setState("showLast", true)
        this.setState("showLastest", false)
        this.setState("fruits", [...this.state.fruits]);
        this.performance = Date.now() - this.performance;
        console.log(`rendering time : ${this.performance}`);
    }
}

customElements.define("loop-test", EZCTest);