/*jslint browser this*/
import {Stepper} from "./stepped-form.js";
import Engine from "./game-engine.js";
import modeMap from "./modes.js";

let mode;
const turnMap = {
    "cpu": "pawn-away",
    "player 1": "pawn-home",
    "player 2": "pawn-away",
    "won": "pawn-won"
};
const components = Object.create(null);
const engine = new Engine();
const dialogActions = {
    continue: () => engine.resume(),
    quit: function () {
        components.container.gotoStep(0);
        engine.resetBoard().restart().pause();
    },
    restart: () => engine.resetBoard().restart()
};

components.container = document.querySelector("step-by-step");
components.dialog = document.querySelector(".pause-menu");
components.board = components.container.querySelector(".game-board");
components.scores = components.container.querySelectorAll(".score");
components.result = components.board.nextElementSibling;
components.resultHeader = components.result.firstElementChild;
components.timer = components.resultHeader.nextElementSibling;

components.container.addEventListener("click", function ({target}) {
    let index;
    if (target.dataset.mode === "rules") {
        index = 1;
    }
    if (target.dataset.mode === "menu") {
        index = 0;
        if (typeof mode?.destroy === "function") {
            mode.destroy();
        }
        engine.resetBoard().restart().pause();
    }
    if (typeof modeMap[target.dataset.mode] === "function") {
        index = 2;
        mode = modeMap[target.dataset.mode](engine);
        engine.setMode(mode);
        engine.restart();
    }
    if (target.dataset.option === "restart") {
        components.dialog.showModal();
        engine.pause();
    }
    if (target.classList.contains("replay")) {
        engine.replay();
    }
    if (target.classList.contains("pawn")) {
        target.requestSelection();
    }
    if (Number.isFinite(index)) {
        this.gotoStep(index);
    }
    if (index === 0) {
        document.body.classList.add("switch-clr");
    } else {
        document.body.classList.remove("switch-clr");
    }
});
components.dialog.addEventListener("cancel", function (event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    components.dialog.close("continue");
});
components.dialog.addEventListener("click", function (event) {
    const {target} = event;
    event.preventDefault();
    components.dialog.close(target.dataset.option);
});
components.dialog.addEventListener("transitionend", function (event) {
    if (event.propertyName !== "transform") {
        return;
    }
    if (!components.dialog.open && components.dialog.returnValue.length > 0) {
        dialogActions[components.dialog.returnValue]();
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
}
function updateScore(node, value) {
    let score = node.lastElementChild.textContent;
    const replacer = (val) => (
        Number.isFinite(value)
        ? value
        : Number.parseInt(val, 10) + 1
    );
    score = score.replace(/(?:\d*)/, replacer);
    node.lastElementChild.textContent = score;
}

components.container.addEventListener("mouseover", handlePointer);
components.container.addEventListener("touchstart", handlePointer);
engine.addTimeListener(components.timer);
engine.addTurnListener(components.result);
engine.addGameEndListener(components.result);
engine.addRestartListener(components.result);

components.scores.forEach(function (score) {
    const isHome = score.classList.contains("home-score");
    let notifyWhen = function ({winner}) {
        if (isHome) {
            return winner === "player 1";
        } else {
            return typeof winner === "string" && winner !== "player 1";
        }
    };
    engine.addGameEndListener(score, notifyWhen);
    engine.addModeListener(score);
    score.addEventListener("gameterminated", function () {
        updateScore(score);
    });
    score.addEventListener("modechanged", function ({detail}) {
        updateScore(score, 0);
        if (isHome) {
            score.firstElementChild.textContent = detail.player1;
        } else {
            score.dataset.player = detail.player2;
            score.firstElementChild.textContent = detail.player2;
        }
    });
});

components.timer.addEventListener("timeupdated", function ({detail}) {
    let content = detail.time + "s";
    components.timer.textContent = content;
});

components.result.addEventListener("gamerestarted", function ({detail}) {
    const {turn} = detail;
    const content = turn + "'s turn";
    components.resultHeader.textContent = content;
    Object.values(turnMap).concat(["game-result__end"]).forEach(
        (val) => components.result.classList.remove(val)
    );
    components.result.classList.add(turnMap[turn]);
    delete this.parentElement.dataset.winner;
});

components.result.addEventListener("turnupdated", function ({detail}) {
    const {currentTurn, previousTurn} = detail;
    const content = currentTurn + "'s turn";
    components.resultHeader.textContent = content;
    this.classList.remove(turnMap[previousTurn], "game-result__end");
    this.classList.add(turnMap[currentTurn]);
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
        this.parentElement.dataset.winner = winner;
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
        mode.selectDisc(index);
    };
    engine.registerDisc(node);
});
document.addEventListener("visibilitychange", function () {
    let currentStep = components.container.style.getPropertyValue("--current");
    currentStep = Number.parseInt(currentStep, 10);
    if (document.visibilityState === "hidden") {
        engine.pause();
    }
    if (document.visibilityState !== "hidden" && currentStep === 2) {
        engine.resume();
    }
});
Stepper.define();
