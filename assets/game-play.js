import SteppedForm from "./stepped-form.js";

const container = new SteppedForm({
    parentClass: "menu-container"
});
container.initialize();

container.parent.addEventListener("click", function ({target}) {
    if (target.classList.contains("rule-option")) {
        container.gotoStep(1);
    }
});
