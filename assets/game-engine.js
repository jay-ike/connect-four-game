/*jslint browser this*/
import {Emitter, StopWatch, TurnManager} from "./utils.js";
import Board from "./board.js";
const {CustomEvent} = window;

function dispatchEvent(node, event) {
    if (typeof node.dispatchEvent === "function") {
        node.dispatchEvent(event);
    }
}

function Engine(boardRows = 6, boardCols = 7) {
    let timer = new StopWatch();
    let turn;
    let mode;
    const board = new Board(boardRows, boardCols);
    const emitter = new Emitter(["disc", "turn", "time"]);
    function switchTurn() {
        let newState;
        turn.switchTurn();
        newState = turn.currentState();
        mode.updateTurn(newState.currentTurn);
        emitter.notify("turn", newState);
        timer.restart();
    }
    timer.addTickListener((time) => emitter.notify("time", time));
    timer.addExpirationListener(switchTurn);
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
    this.addModeListener = function modeListener(node) {
        const notifier = function (state) {
            const modeChanged = new CustomEvent("modechanged", {
                detail: state
            });
            dispatchEvent(node, modeChanged);
        };
        emitter.register("mode", notifier);
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
        function notify(gameState) {
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
        let turnState;
        if (turn !== undefined) {
            turnState = turn.currentState();
            emitter.notify("turn", turnState);
            mode.updateTurn(turnState.currentTurn);
            timer.restart();
        }
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
        board.init();
        emitter.notify("disc", {turn: null});
        return this;
    };
    this.replay = function () {
        let currentPlayer;
        turn.init();
        currentPlayer = turn.currentState().currentTurn;
        emitter.notify("restart", {turn: currentPlayer});
        mode.updateTurn(currentPlayer);
        this.resetBoard().restart();
    };
    function selectDisc(index) {
        let response;
        let state = {
            turn: turn.currentState().currentTurn,
            won: false
        };
        let discValue = mode.getMarkers() ?? {};
        discValue = discValue[state.turn];
        response = board.requestDiscSelection(index, discValue);
        discValue = response.getIndex();
        if (discValue !== null) {
            emitter.notify("disc", state, [discValue]);
            switchTurn();
        }
        response = response.consecutiveItems();
        if (response.length === 4) {
            state.won = true;
            mode.updateTurn(null);
            setTimeout(function () {
                state.currentTurn = state.turn;
                emitter.notify("disc", state, response.map(
                    function ([row, col]) {
                        return board.getIndexFrom(row, col);
                    }
                ));
                emitter.notify("game", {winner: state.turn});
            }, 1500);
        }
        if (board.isFilled()) {
            mode.updateTurn(null);
            setTimeout(function () {
                emitter.notify("game", {});
            }, 1500);
        }
    };
    this.setMode = function (newMode) {
        const {player1, player2} = newMode;
        const config = {};
        config.selector = function (index) {
            if (mode === newMode) {
                selectDisc(index);
            }
        };
        turn = new TurnManager(player1, player2);
        config.getBoard = () => board.getMatrix();
        config.initialTurn = turn.currentState().currentTurn;
        newMode.setup(config);
        if (typeof mode?.destroy === "function") {
            mode.destroy();
        }
        mode = newMode;
        emitter.notify("mode", {player1, player2});
        emitter.notify("restart", {turn: turn.currentState().currentTurn});

    };
}
export default Object.freeze(Engine);
