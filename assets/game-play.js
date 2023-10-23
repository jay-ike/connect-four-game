import SteppedForm from "./stepped-form.js";
import Engine from "./game-engine.js";

let board;
const turnMap = {
    "player 2": "away-turn",
    "cpu": "away-turn"
};
const dialog = document.querySelector(".pause-menu");
const engine = new Engine();
const container = new SteppedForm({
    parentClass: "menu-container",
    outClassIndicator: "step-out"
});
const dialogActions = {
    continue: () => engine.resume(),
    restart: () => engine.restart(),
    quit: function () {
        engine.restart().pause();
        container.gotoStep(0);
    }
};
function buildDisc(index) {
    const button = document.createElement("button");
    button.index = index;
    button.classList.add("pawn");
    button.setAttribute("aria-label", "a disc not yet selected");
    return button;
}

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
        engine.restart();
        index = 2;
    }
    if (target.classList.contains("res-opt")) {
        dialog.showModal();
        engine.pause();
    }
    container.gotoStep(index);
    if (index === 0) {
        document.body.classList.add("switch-clr");
    } else {
        document.body.classList.remove("switch-clr");
    }
});
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
        dialogActions[dialog.returnValue]();
    }
});
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
board.nextElementSibling.addEventListener("turnupdated", function ({detail}) {
    const {currentTurn, previousTurn, won} = detail;
    const header = this.firstElementChild;
    if (won === undefined) {
        header.textContent = header.textContent.replace(previousTurn, currentTurn);
        this.classList.remove(turnMap[previousTurn] ?? "home-turn");
        this.classList.add(turnMap[currentTurn] ?? "home-turn");
        engine.restart();
    }
});
engine.getBoardIndexes().forEach(function (value) {
    board.appendChild(buildDisc(value));
});
