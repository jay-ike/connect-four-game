import SteppedForm from "./stepped-form.js";

const container = new SteppedForm({
    parentClass: "menu-container",
    outClassIndicator: "step-out"
});
container.initialize();

container.parent.addEventListener("click", function ({target}) {
    if (target.classList.contains("rule-option")) {
        container.gotoStep(1);
    }
    if (target.classList.contains("menu-opt")) {
        container.gotoStep(0);
    }
    if (target.classList.contains("game-mode")) {
        container.gotoStep(2);
    }
});
