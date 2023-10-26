
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
function boardHandler(maxRow, maxCol) {
    const board = Array(maxRow).fill(0).map(() => Array(maxCol).fill(0));
    const indexFrom = (row, col) => (row * maxCol) + col + 1;
    function rowColFrom(index) {
        let row;
        let col;
        if (index > 0) {
            col = (index - 1) % 7;
            row = Math.trunc((index -1) / 7);
        }
        return [row, col];
    }
    return {
        getBoard : () => board,
        getBoardIndexes: () => board.reduce(function (acc, row) {
            const rowIndex = acc.length;
            return acc.concat(row.map(function(ignore, index) {
                return rowIndex + index;
            }));
        }, []),
        requestDiscSelection(index, value) {
            const [row, col] = rowColFrom(index);
            const defaultResponse = {getIndex: () => null};
            let selectableRow = maxRow - 1;
            let indexInvalid = row !== undefined && col !== undefined;
            if (!indexInvalid) {
                return defaultResponse;
            }
            indexInvalid = board[row][col] !== 0 && row === 0;
            while (!indexInvalid && selectableRow >= 0) {
                if (board[selectableRow][col] === 0) {
                    board[selectableRow][col] = value;
                    return {getIndex: () => indexFrom(selectableRow, col) - 1 };
                }
                selectableRow -=1;
            }
            return defaultResponse;
        }
    };
}
function Engine(oponent = "player 2") {
    let timer;
    const board = boardHandler(6, 7);
    const turn = turnHandler("player 1", oponent);
    const timeListeners = [];
    const turnListeners = [];
    const discStateListeners = [];
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
    this.getBoardIndexes = () => board.getBoardIndexes();
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
    this.registerDisc = function (node) {
        function notify(turnState) {
            const discSelected = new CustomEvent("discselected", {
                detail: turnState
            });
            dispatchEvent(node, discSelected);
        }
        discStateListeners[discStateListeners.length] = notify;
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
    this.selectDisc = function (index) {
        let currentPlayer = turn.currentState().currentTurn;
        let discValue = (
            currentPlayer === "player 1"
            ? 1
            : 2
        );
        discValue = board.requestDiscSelection(index, discValue).getIndex();
        if (discValue !== null && discStateListeners[discValue] !== undefined) {
            discStateListeners[discValue]({
                turn: currentPlayer,
                won: false
            });
            turn.switchTurn();
            timer.restart();
        }
    };
}
export default Engine;
