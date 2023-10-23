
function timerHandler(
    delayInseconds = 15,
    onchange = console.log,
    onEnd = console.log
) {
    let intervalId;
    let timeoutId;
    let timeout;
    return {
        init(delay = delayInseconds) {
            timeout = delay;
            onchange(timeout);
            intervalId = setInterval(function () {
                timeout -= 1;
                onchange(timeout);
            }, 1000);
            timeoutId = setTimeout(function () {
                onEnd();
                clearInterval(intervalId);
            }, delay * 1000);
        },
        pause() {
            clearInterval(intervalId);
            clearTimeout(timeoutId);
        },
        resume() {
            this.init(timeout);
        },
        restart() {
            this.pause();
            this.init();
        }
    };
}
function turnHandler(player1, player2) {
    const state = Object.create(null);
    state.starter = player1;
    state.currentTurn = player1;
    return {
        init() {
            if (state.starter === player2) {
                state.starter = player1;
            } else {
                state.starter = player2;
            }
            state.previousTurn = state.currentTurn;
            state.currentTurn = state.starter;
        },
        currentState() {
            return state;
        },
        switchTurn() {
            const previousTurn = state.currentTurn;
            state.currentTurn = state.previousTurn ?? player2;
            state.previousTurn = previousTurn;
            return this;
        }
    };
}
function Engine(oponent = "player 2") {
    let timer;
    const board = Array(6).fill(Array(7).fill(0));
    const turn = turnHandler("player 1", oponent);
    const timeListeners = [];
    const turnListeners = [];
    const updateTime = (time) => timeListeners.forEach((fn) => fn(time));
    const updateTurn = (state) => turnListeners.forEach((fn) => fn(state));
    function dispatchEvent(node, event) {
        if (typeof node.dispatchEvent === "function") {
            node.dispatchEvent(event);
        }
    }
    function handleTimeout () {
        let {currentTurn, previousTurn} = turn.switchTurn().currentState();
        updateTurn({currentTurn, previousTurn});
    }
    timer = timerHandler(15, updateTime, handleTimeout);
    this.currentTurn = () => turn.currentState().currentTurn;
    this.previousTurn = () => turn.currentState().previousTurn;
    this.getBoardIndexes = () => board.reduce(function (acc, row) {
        const rowIndex = acc.length;
        return acc.concat(row.map(function (ignore, index) {
            return rowIndex + index + 1;
        }));
    });
    this.addTimeListener = function (node) {
        const listener = function (time) {
            const timeUpdated = new CustomEvent("timeupdated", {
                detail: {time}
            });
            dispatchEvent(node, timeUpdated);
        };
        timeListeners[timeListeners.length] = listener;
    };
    this.addTurnListener = function (node) {
        const listener = function (turnState) {
            const turnChanged = new CustomEvent("turnupdated", {
                detail: turnState
            });
            dispatchEvent(node, turnChanged);
        };
        turnListeners[turnListeners.length] = listener;
    };
    this.init = function () {
        timer.init();
    };
    this.restart = function () {
        timer.restart();
    }
}
export default Engine;
