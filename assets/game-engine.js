
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
    let board = Array(maxRow).fill(0).map(() => Array(maxCol).fill(0));
    const indexFrom = (row, col) => (row * maxCol) + col + 1;
    function getConsecutiveItems(position) {
        const moves = [[1,0], [0,1], [1,1], [1, -1]];
        let groups = [];
        const [row, col] = position;
        if (board[row][col] === 0) {
            return [];
        }
        moves.forEach(function ([deltaRow, deltaCol]) {
            let items = [];
            const symetricFactors = [1, -1];
            symetricFactors.forEach(function (factor) {
                const colIncrement = deltaCol * factor;
                const rowIncrement = deltaRow * factor;
                let tmp = [];
                let nextCol = col + colIncrement;
                let nextRow = row + rowIncrement;
                while (
                    board[nextRow] !== undefined &&
                    board[nextRow][nextCol] !== undefined
                ) {
                    if (board[nextRow][nextCol] === board[row][col]) {
                        tmp[tmp.length] = [nextRow, nextCol];
                    } else {
                        break;
                    }
                    nextRow += rowIncrement;
                    nextCol += colIncrement;
                }
                items[items.length] = tmp;
            });
            if (items[0].concat(items[1]).length >= 3) {
                groups[groups.length] = items[0].concat([position]).concat(items[1]);
            } else {
                groups[groups.length] = [position].concat(items[0]);
                groups[groups.length] = [position].concat(items[1]);
            }
        });
        return groups.reduce(function (acc, group) {
            if (acc.length > group.length) {
                return acc;
            }
            return group;
        });
    }
    function rowColFrom(index) {
        let row;
        let col;
        if (index > 0) {
            col = (index - 1) % 7;
            row = Math.trunc((index -1) / 7);
        }
        return [row, col];
    }
    function getSelectablePosition(index) {
        let selectableRow = maxRow -1;
        let [row, col] = rowColFrom(index);
        if (row === undefined || col === undefined) {
            return null;
        }
        while (selectableRow >= 0) {
            if (board[selectableRow][col] === 0) {
                return [selectableRow, col];
            }
            selectableRow -= 1;
        }
        return null;
    };
    return {
        getBoard : () => board,
        getBoardIndexes: () => board.reduce(function (acc, row) {
            const rowIndex = acc.length;
            return acc.concat(row.map(function(ignore, index) {
                return rowIndex + index;
            }));
        }, []),
        getIndexFrom: (row, col) => indexFrom(row, col) - 1,
        init() {
            board = Array(maxRow).fill(0).map(() => Array(maxCol).fill(0));
        },
        requestDiscSelection(index, value) {
            let row;
            let col;
            const position = getSelectablePosition(index);
            const response = {
                consecutiveItems: () => [],
                getIndex: () => null
            };
            if (position !== null) {
                [row, col] = position;
                board[row][col] = value;
                response.getIndex = () => indexFrom(row, col) - 1;
                response.consecutiveItems = () => getConsecutiveItems([row, col]);
            }
            return response;
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
    this.resetBoard = function () {
        board.init();
        discStateListeners.forEach((fn) => fn({turn: null}));
        return this;
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
        response = board.requestDiscSelection(index, discValue);
        discValue = response.getIndex();
        if (discValue !== null && discStateListeners[discValue] !== undefined) {
            discStateListeners[discValue](state);
            turn.switchTurn();
            timer.restart();
        }
        response = response.consecutiveItems();
        if (response.length === 4) {
            state.won = true;
            setTimeout(() => response.forEach(function ([row, col]) {
                const index = board.getIndexFrom(row, col);
                discStateListeners[index](state)
            }), 1500);
        }
    };
}
export default Engine;
