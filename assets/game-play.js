import SteppedForm from "./stepped-form.js";

let board;

function buildPawn(index) {
    const button = document.createElement("button");
    button.index = index;
    button.classList.add("pawn");
    return button;
}

const container = new SteppedForm({
    parentClass: "menu-container",
    outClassIndicator: "step-out"
});
container.initialize();

container.parent.addEventListener("click", function ({target}) {
    let index;
    if (target.classList.contains("rule-option")) {
        index = 1;
    }
    if (target.classList.contains("menu-opt")) {
        index = 0;
    }
    if (target.classList.contains("game-mode")) {
        index = 2;
    }
    container.gotoStep(index);
    if (index === 0) {
        document.body.classList.add("switch-clr");
    } else {
        document.body.classList.remove("switch-clr");
    }
});
board = container.parent.querySelector(".game-board");
Array(42).fill(1).forEach(function (ignore, index) {
    board.appendChild(buildPawn(index));
});
