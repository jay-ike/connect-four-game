import SteppedForm from "./stepped-form.js";
import Engine from "./game-engine.js";

let board;
let gameState;
let dialog = document.querySelector(".pause-menu");
let isDialogElement = HTMLDialogElement.prototype.isPrototypeOf(dialog);
let engine = new Engine();
function buildPawn(index) {
    const button = document.createElement("button");
    button.index = index;
    button.classList.add("pawn");
    button.setAttribute("aria-label", "a disc not yet selected");
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
        engine.init();
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
    dialog.addEventListener("transitionend", function () {
        if (!dialog.open && dialog.returnValue.length > 0) {
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
engine.addTimeListener(board.nextElementSibling);
engine.addTurnListener(board.nextElementSibling);
board.nextElementSibling.addEventListener("timeupdated", function ({detail}) {
    const timeout = board.nextElementSibling.querySelector(".timeout");
    if (timeout !== null) {
        timeout.textContent = timeout.textContent.replace(/\d*/, detail.time);
    }
});
engine.getBoardIndexes().forEach(function (value) {
    board.appendChild(buildPawn(value));
});
