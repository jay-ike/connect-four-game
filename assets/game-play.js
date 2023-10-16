import SteppedForm from "./stepped-form.js";

let board;
let dialog = document.querySelector(".pause-menu");
let isDialogElement = HTMLDialogElement.prototype.isPrototypeOf(dialog);
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
    if (target.classList.contains("res-opt") && isDialogElement) {
        dialog.showModal();
    }
    container.gotoStep(index);
    if (index === 0) {
        document.body.classList.add("switch-clr");
    } else {
        document.body.classList.remove("switch-clr");
    }
});
if (isDialogElement) {
    dialog.addEventListener("cancel", function (event) {
        event.preventDefault();
        dialog.close("continue");
    });
    dialog.addEventListener("click", function ({target}) {
        if (target.classList.contains("opt-continue")) {
            dialog.close("continue");
        }
        if (target.classList.contains("opt-restart")) {
            dialog.close("restart");
        }
        if (target.classList.contains("opt-quit")) {
            dialog.close("quit");
        }
    });
    dialog.addEventListener("transitionend", function (event) {
        if (!dialog.open) {
            console.log(dialog.returnValue);
        }
    });
}
function handlePointer(event) {
    const {target} = event;
    let targetRect;
    let parentRect;
    event.stopPropagation();
    if (target.classList.contains("pawn")) {
        targetRect = target.getBoundingClientRect();
        parentRect = target.parentElement.getBoundingClientRect();
        target.parentElement.style.setProperty(
            "--indicator-x",
            (targetRect.left - parentRect.left) + targetRect.width / 2
        );
    }
};
container.parent.addEventListener("mouseover", handlePointer);
container.parent.addEventListener("touchstart", handlePointer);
board = container.parent.querySelector(".game-board");
Array(42).fill(1).forEach(function (ignore, index) {
    board.appendChild(buildPawn(index));
});
