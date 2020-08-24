import CustomElement from "./lib/CustomElement2.js";

class subEl extends CustomElement {
    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: "open" });
        this.state = {
            is: "ok",
        };

        shadowRoot.innerHTML = `<div data-bind="is"></div>`;
    }

    onInit() {
        //console.log(this.dispatchEvent)
    }

    onRender() {
        //this.props.sayHi();
        //console.log(this.getRootNode().host.shadowRoot.innerHTML)
    }
}

customElements.define("sub-el", subEl);

export class DemoElement extends CustomElement {
    constructor() {
        super();
        this.performance = 0;
        const shadowRoot = this.attachShadow({ mode: "open" });
        this.state = {
            showCart: true,
            displayName: false,
            displayTitle: false,
            title: "lul",
            user: {
                class: "color-red",
                name: "A name",
                lastname: "rc",
                address: {
                    city: "A CITY",
                },
            },
            rclass: "rezrzrzr",
            pets: ["z", "z", "fish"],
            cities: ["LA", "NY", "Chicago", "Houston", "Phoenix", "San Diego", "Dallas"],
            lfs: ["skulk", "lerk"]
        };

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
      <template id="template">
        <p id="template-content">This is the content of the template</p>
      </template>
      
      <div id="container">
        <h1>hi <span data-bind="displayName : user.name" ></span></h1>

        <p data-bind="title" id="title"></p>
        
        <h3>user.name {{user.name}} {{user.lastname}}</h3>
        <h2 data-bind="user.name" class-bind="displayName : color-red, displayTitle: dtitle, rclass" class="underline random-class" id="name"></h2>
            
        <div loop="pet of pets">
            <p>{{user.name}} {{user.lastname}}</p>
            <div loop="lf2 of lfs"><span if-bind="showCart">cart<div>items : 3</div></span><span loop-item="lf2"></span><span> </span><span class-bind="displayName : color-red" data-bind="user.lastname"></span><span> </span></div>
        </div>
 
        <h3 class-bind="user.class">user.address.city</h3>
        <p on-mouseover="hoveredP" data-bind="user.address.city" id="city"></p>

        <h3 ref="h3title" on-click="clickedH3" data-bind="title"></h3>

        <form on-submit="submitthatform">
            <input type="checkbox" name="yes">
            <button type="submit">send</button>
        </form>
        
        
      </div>
        `;
    }

    beforeInit() {
        this.performance = Date.now();
    }

    onRender() {
        /*
        this.setStateTitle("TITLKE");
        this.setStateUserAddressCity("LA");
        this.setStateUserName("wadaheck");
        this.setStateUserName("wadaheck2");
        this.setStateUserClass("text-big");*/
        //this.setState(["state.displayName", true]);
        this.setState(["pets", [...this.state.pets, "leopard", "lion", "some animal"]]);
        //this.setState("pets", [...this.state.pets.filter((el) => el !== "goat")]);
        this.setState("cities", [...this.state.cities.filter((el) => el !== "Houston" && el !== "Phoenix"), "SA", "Paris"]);
        
        this.setState(["pets", [...this.state.pets.filter((el) => el !== "lion")]]);
        this.setState(["displayName", true])
     
    
        this.performance = Date.now() - this.performance;
        console.log("rendering time : " + this.performance + " ms")
    }

    sayHi() {
        console.log("hi");
    }

    clickedH3(evt) {
        evt.preventDefault();
        console.log("wadup", evt);
    }

    hoveredP(evt) {
        evt.preventDefault();
        console.log("hover", evt);
    }

    submitthatform(evt) {
        evt.preventDefault();
        console.log("submit", Object.fromEntries(new FormData(evt.target)));
    }

    downdown(evt) {
        console.log("mousedown sub-el", evt);
    }

    upup(evt) {
        console.log("mouseup sub-el", evt);
        console.log(this.refs);
    }
}

customElements.define("demo-element", DemoElement);
