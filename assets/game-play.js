import SteppedForm from "./stepped-form.js";
import Engine from "./game-engine.js";

const turnMap = {
    "player 1": "pawn-home",
    "player 2": "pawn-away",
    "cpu": "pawn-away",
    "won": "pawn-won"
};
const components = Object.create(null);
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
components.dialog = document.querySelector(".pause-menu");
components.board = container.parent.querySelector(".game-board");
components.scores = container.parent.querySelectorAll(".scr-board");
components.result = components.board.nextElementSibling;
components.resultHeader = components.result.firstElementChild;
components.timer = components.resultHeader.nextElementSibling;

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
        components.dialog.showModal();
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
components.dialog.addEventListener("cancel", function (event) {
    event.preventDefault();
    dialog.close("continue");
});
components.dialog.addEventListener("click", function ({target}) {
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
components.dialog.addEventListener("transitionend", function () {
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
engine.addTimeListener(components.timer);
engine.addTurnListener(components.result);
engine.addGameEndListener(components.result);
components.scores.forEach(function (score) {
    const isHome = score.classList.contains("home");
    let notifyWhen = ({winner}) => (
        isHome
        ? winner === "player 1"
        : typeof winner === "string" && winner !== "player 1"
    );
    engine.addGameEndListener(score, notifyWhen);
    score.addEventListener("gameterminated", function () {
        let value = score.lastElementChild.textContent;
        value = value.replace(/(?:\d*)/, (val) => Number.parseInt(val, 10) + 1);
        score.lastElementChild.textContent = value;
    });

});
components.timer.addEventListener("timeupdated", function ({detail}) {
    let content = detail.time + "s";
    components.timer.textContent = content;
});
components.result.addEventListener("turnupdated", function ({detail}) {
    const {currentTurn, previousTurn} = detail;
    const content = currentTurn + "'s turn";
    components.resultHeader.textContent = content;
    this.classList.remove(turnMap[previousTurn], "game-result__end");
    this.classList.add(turnMap[currentTurn]);
    engine.restart();
});
components.result.addEventListener("gameterminated", function ({detail}) {
    const {winner} = detail;
    let content;
    let heading;
    engine.pause();
    Object.values(turnMap).forEach(
        (val) => components.result.classList.remove(val)
    );
    if (typeof winner === "string") {
        content = "wins";
        heading = winner;
    } else {
        content = "draw";
        heading = "";
    }
    components.resultHeader.textContent = heading;
    components.timer.textContent = content;
    components.result.classList.add("game-result__end");
});
components.board.querySelectorAll(".pawn").forEach(function setupDisc(node) {
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
