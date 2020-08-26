import CustomElement from "/test/Loop.js";

class LoopTest extends CustomElement {
    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: "open" });
        this.state = {
            ties: ["red"],
            fruits: ["strawberry", "mango"]
        };

        shadowRoot.innerHTML = /* html */`
            <div loop="fruit of ties">-<div loop="ee of ties">~<div loop="tie of fruits"><p loop-item="tie"></div></p></div></div>
            
        `;
    }

    onInit() {
        //console.log(this.dispatchEvent)
    }

    onRender() {
        this.setState("ties", [...this.state.ties]);
        this.setState("fruits", [...this.state.fruits, "orange", "peach"]);
        this.setState("fruits", [...this.state.fruits.filter((fruit) => fruit !== "orange")]);
        //this.props.sayHi();
        //console.log(this.getRootNode().host.shadowRoot.innerHTML)
    }
}

customElements.define("loop-test", LoopTest);