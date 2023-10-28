import {Emitter, StopWatch, TurnManager} from "./utils.js";
import Board from "./board.js";
function Engine(oponent = "player 2") {
    let timer = new StopWatch();
    let isStopped = false;
    const board = new Board(6, 7);
    const turn = new TurnManager("player 1", oponent);
    const emitter = new Emitter(["disc", "turn", "time"]);
    function dispatchEvent(node, event) {
        if (typeof node.dispatchEvent === "function") {
            node.dispatchEvent(event);
        }
    }
    function switchTurn() {
        let newState;
        turn.switchTurn();
        newState = turn.currentState();
        emitter.notify("turn", newState);
        timer.restart();
    }
    timer.addTickListener((time) => emitter.notify("time", time));
    timer.addStopListener(switchTurn);
    this.getBoardIndexes = () => board.getBoardIndexes();
    this.addTimeListener = function (node) {
        const listener = function (time) {
            const timeUpdated = new CustomEvent("timeupdated", {
                detail: {time}
            });
            dispatchEvent(node, timeUpdated);
        };
        emitter.register("time", listener);
    };
    this.addTurnListener = function turnRegistration(node) {
        const listener = function (turnState) {
            const turnChanged = new CustomEvent("turnupdated", {
                detail: turnState
            });
            dispatchEvent(node, turnChanged);
        };
        emitter.register("turn", listener);
    };
    this.registerDisc = function registration(node) {
        function notify(turnState) {
            const discSelected = new CustomEvent("discselected", {
                detail: turnState
            });
            dispatchEvent(node, discSelected);
        }
        emitter.register("disc", notify);
    };
    this.addGameEndListener = function (node, notifyWhen) {
        function notify (gameState) {
            const gameEnd = new CustomEvent("gameterminated", {
                detail: gameState
            });
            dispatchEvent(node, gameEnd);
        }
        emitter.register("game", notify, notifyWhen);
    };
    this.addRestartListener = function (node) {
        function notify(state) {
            const gameRestarted = new CustomEvent("gamerestarted", {
                detail: state
            });
            dispatchEvent(node, gameRestarted);
        }
        emitter.register("restart", notify);
    };
    this.init = function () {
        timer.init();
        return this;
    };
    this.restart = function () {
        timer.restart();
        return this;
    };
    this.pause = function () {
        timer.pause();
        return this;
    };
    this.resume = function () {
        timer.resume();
        return this;
    };
    this.resetBoard = function () {
        isStopped = false;
        board.init();
        emitter.notify("disc", {turn: null});
        return this;
    };
    this.replay = function () {
        let currentPlayer;
        turn.init();
        currentPlayer = turn.currentState().currentTurn;
        emitter.notify("restart", {turn: currentPlayer});
        this.resetBoard().restart();
    };
    this.selectDisc = function (index) {
        let response;
        let state = {
            turn: turn.currentState().currentTurn,
            won: false
        };
        let discValue = (
            state.turn === "player 1"
            ? 1
            : 2
        );
        if (isStopped) {
            return;
        }
        response = board.requestDiscSelection(index, discValue);
        discValue = response.getIndex();
        if (discValue !== null) {
            emitter.notify("disc", state, [discValue]);
            switchTurn();
        }
        response = response.consecutiveItems();
        if (response.length === 4) {
            isStopped = true;
            state.won = true;
            setTimeout(function () {
                state.currentTurn = state.turn;
                emitter.notify("disc", state, response.map(
                    ([row, col]) => board.getIndexFrom(row, col)
                ));
                emitter.notify("game", {winner: state.turn});
            }, 1500);
        }
        if (board.isFilled()) {
            setTimeout(function () {
                emitter.notify("game", {});
            }, 1500);
        }
    };
}
export default Engine;
