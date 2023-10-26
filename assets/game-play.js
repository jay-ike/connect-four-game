import SteppedForm from "./stepped-form.js";
import Engine from "./game-engine.js";

let board;
const turnMap = {
    "player 1": "pawn-home",
    "player 2": "pawn-away",
    "cpu": "pawn-away",
    "won": "pawn-won"
};
const dialog = document.querySelector(".pause-menu");
const engine = new Engine();
const container = new SteppedForm({
    parentClass: "menu-container",
    outClassIndicator: "step-out"
});
const dialogActions = {
    continue: () => engine.resume(),
    restart: () => engine.resetBoard().restart(),
    quit: function () {
        container.gotoStep(0);
        engine.resetBoard().restart().pause();
    }
};

container.initialize();

container.parent.addEventListener("click", function ({target}) {
    let index;
    if (target.classList.contains("rule-option")) {
        index = 1;
    }
    if (target.classList.contains("menu-opt")) {
        index = 0;
        engine.resetBoard().restart().pause();
    }
    if (target.classList.contains("game-mode")) {
        index = 2;
        engine.restart();
    }
    if (target.classList.contains("res-opt")) {
        dialog.showModal();
        engine.pause();
    }
    if (target.classList.contains("pawn")) {
        target.requestSelection();
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
    let tmp = header.nextElementSibling;
    if (won === undefined) {
        header.textContent = header.textContent.replace(previousTurn, currentTurn);
        this.classList.remove(turnMap[previousTurn]);
        this.classList.add(turnMap[currentTurn]);
        engine.restart();
    };
    if (won === true) {
        engine.pause();
        header.textContent = currentTurn;
        tmp.textContent = "wins";
        tmp = this;
        Object.values(turnMap).forEach((val) => tmp.classList.remove(val));
        tmp.classList.add("game-result__end");
    }
});
board.querySelectorAll(".pawn").forEach(function setupDisc(node) {
    const index = Number.parseInt(node.dataset.index, 10);
    const rect = node.getBoundingClientRect();
    const parentRect = node.parentElement.getBoundingClientRect();
    const offset = Math.trunc(parentRect.y - (rect.y + rect.height));
    node.style.setProperty("--p-offset", offset + "px");
    node.addEventListener("discselected", function ({detail}) {
        let label;
        const {turn, won} = detail;
        if (typeof turn !== "string") {
            Object.values(turnMap).forEach((val) => node.classList.remove(val));
            return;
        }
        if (won === false) {
            label = "disc selected by " + turn;
            node.classList.add(turnMap[turn]);
            node.setAttribute("aria-label", label);
        } else {
            label = "disc won by " + turn;
            node.classList.add(turnMap.won);
            node.setAttribute("aria-label", label);
        }
    });
    node.requestSelection = function () {
        engine.selectDisc(index);
    };
    engine.registerDisc(node);
});
