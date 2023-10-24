
function timerHandler(
    delayInseconds = 15,
    onchange = console.log,
    onEnd = console.log
) {
    let intervalId;
    let timeoutId;
    let timeout;
    function init(delay = delayInseconds) {
        timeout = delay;
        onchange(timeout);
        intervalId = setInterval(function () {
            timeout -= 1;
            onchange(timeout);
        }, 1000);
        timeoutId = setTimeout(function () {
            clearInterval(intervalId);
            onEnd();
        }, delay * 1000);
    }
    function pause() {
        clearInterval(intervalId);
        clearTimeout(timeoutId);
    }
    function restart(delay) {
        pause();
        init(delay);
    }
    function resume() {
        restart(timeout);
    }
    return {init, pause, restart, resume};
}
function turnHandler(player1, player2) {
    const state = Object.create(null);
    const listeners = [];
    state.starter = player1;
    state.currentTurn = player1;
    function addListener(fn) {
        listeners[listeners.length] = fn;
    }
    return {
        addListener,
        currentState() {
            return state;
        },
        init() {
            if (state.starter === player2) {
                state.starter = player1;
            } else {
                state.starter = player2;
            }
            state.previousTurn = state.currentTurn;
            state.currentTurn = state.starter;
        },
        switchTurn() {
            const previousTurn = state.currentTurn;
            state.currentTurn = state.previousTurn ?? player2;
            state.previousTurn = previousTurn;
            listeners.forEach((fn) => fn(state));
            return this;
        }
    };
}
function rowColIndex(index) {
    let row;
    let col;
    if (index > 0) {
        col = (index - 1) % 7;
        row = Math.trunc((index -1) / 7);
    }
    return [row, col];
}
function Engine(oponent = "player 2") {
    let timer;
    const board = Array(6).fill(0).map(() => Array(7).fill(0));
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
    turn.addListener(updateTurn);
    timer = timerHandler(15, updateTime, () => turn.switchTurn());
    this.currentTurn = () => turn.currentState().currentTurn;
    this.previousTurn = () => turn.currentState().previousTurn;
    this.getBoardIndexes = () => board.reduce(function (acc, row) {
        const rowIndex = acc.length;
        return acc.concat(row.map(function (ignore, index) {
            return rowIndex + index + 1;
        }));
    }, []);
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
    this.isNotSelected = function (discIndex) {
        const [row, col] = rowColIndex(discIndex);
        return board[row][col] === 0;
    };
    this.selectDisc = function (index) {
        const [row, col] = rowColIndex(index);
        let currentPlayer = turn.currentState().currentTurn;
        if (board[row][col] === 0) {
            board[row][col] = (
                currentPlayer === "player 1"
                ? 1
                : 2
            );
            turn.switchTurn();
            timer.restart();
        }
    };
}
export default Engine;
