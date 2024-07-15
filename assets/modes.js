/*jslint browser this*/
import {StopWatch} from "./utils.js";

function SimpleMode() {
    let turn;
    let choose;

    this.player1 = "player 1";
    this.player2 = "player 2";
    this.getMarkers = function () {
        return {
            "player 1": 1,
            "player 2": 2
        };
    }
    this.destroy = function () {
        turn = null;
        choose = null;
    };
    this.setup = function (config) {
        if (typeof config?.selector === "function") {
            choose = config.selector;
        }
        turn = config?.initialTurn;
    };
    this.updateTurn = function (newTurn) {
        turn = newTurn;
    };
    this.selectDisc = function (index) {
        if (turn !== null && typeof choose === "function") {
            choose(index);
        }
    };
}

function CPUMode() {
    let turn;
    let moves = [];
    let timer = new StopWatch(3);
    let engine = {};
    const maxValue = Number.POSITIVE_INFINITY;

    timer.addExpirationListener(requestSelection);
    this.player1 = "player 1";
    this.player2 = "cpu";

    function markers() {
        return {
            cpu: 2,
            "player 1": 1
        };
    }
    this.destroy = function () {
        turn = null;
        engine = null;
    };

    this.setup = function (config) {
        engine.choose = config?.selector;
        engine.getBoard = config?.getBoard;
        turn = config?.initialTurn;
    };
    window.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "hidden") {
            timer.pause();
        } else {
            timer.resume();
        }
    });

    function requestSelection() {
        let fn = moves.shift();
        const canCall = (
            typeof fn === "function"
            && typeof engine?.choose === "function"
        );
        if (canCall && turn === "cpu") {
            fn();
            timer.stop();
        }
    }

    function boardFilled(board, depth) {
        return depth === 0 || board[0].every((val) => val !== 0);
    }
    function getValidColumn(board) {
        const validCols = [];
        const columns = board[0].length;
        let row = board.length;
        let col = 0;
        while (row > 0 && col < columns) {
            if (board[row - 1][col] === 0) {
                validCols[validCols.length] = col;
                col += 1;
            }
            row -= 1;
            if (row <= 0) {
                col += 1;
                row = board.length;
            }
        }
        return validCols;
    }
    function getNextOpenRow(board, col) {
        let row = board.length - 1;
        while (row >= 0 && board[row][col] !== 0) {
            row -= 1;
        }
        if (row >= 0) {
            return row
        }
    }
    function evaluateRange(range, piece, isMaximized) {
        const connections = range.reduce(function (acc, val) {
            if (val === piece) {
                acc.acc += 1;
            } else {
                acc.acc = 0;
            }
            acc.count = Math.max(acc.count, acc.acc);
            return acc;
        }, {acc:0, count: 0});
        const emptyFields = range.filter((val) => val === 0).length;
        let score = 0;

        if (connections.count >= 4) {
            score = maxValue;
        } else {
            score = Math.pow(connections.count, 2) + Math.pow(emptyFields, 2);
        }
        if (!isMaximized) {
            score *= -1;
        }
        return score;
    }
    function horizontalScores(board, windowLength) {
        let totalScore = board.map(function (arr) {
            const max = arr.length - windowLength;
            let score = [];
            let i = 0;
            while (i < arr.length - max && max >= 0) {
                score.push(arr.slice(i, i + windowLength));
                i += 1;
            }
            return score;
        }).reduce((acc, val) => acc.concat(val));
        return totalScore;
    }
    function verticalScores(board, windowLength) {
        const max = board.length - windowLength;
        const range = new Array(windowLength).fill(0);
        let row;
        let col = 0;
        let score = [];
        while(col < board[0].length) {
            row = 0;
            while (row <= max && max >= 0) {
                score.push(range.map(
                    (ignore, i) => board[row + i][col]
                ));
                row += 1;
            }
            col += 1;
        }
        return score;
    }
    function positiveDiagonalScores(board, windowLength) {
        const range = new Array(windowLength).fill(0);
        let score = [];
        let row = board.length;
        let col;
        while (row - windowLength >= 0) {
            col = 0;
            while (col + windowLength - 1 < board[0].length) {
                score.push(range.map(
                    (ignore, i) => board[row - 1 - i][col + i]
                ));
                col += 1;
            }

            row -= 1;
        }
        return score;
    }
    function negativeDiagonalScores(board, windowLength) {
        const range = new Array(windowLength).fill(0);
        let score = [];
        let row = 0;
        let col;

        while (row + windowLength - 1 < board.length)  {
            col = 0;
            while (col + windowLength - 1 < board[0].length) {
                score.push(range.map(
                    (ignore, i) => board[row +i][col + i]
                ));
                col += 1;
            }
            row += 1;
        }

        return score;
    }
    function getScore(board, piece, isMaximized) {
        const columns = board[0].length;
        let col = Math.floor(columns / 2);
        let score = board.map((arr) => arr[col]).filter(
            (val) => val === piece
        ).length * 3;
        score += horizontalScores(board, 4).concat(
            verticalScores(board, 4)
        ).concat(positiveDiagonalScores(board, 4)).concat(
            negativeDiagonalScores(board, 4)
        ).map(
            (val) => evaluateRange(val, piece, isMaximized)
        ).reduce((acc, val) => acc + val, 0);
        return score;
    }
    function minimax(board, depth, alpha, beta, opponent, maximized) {
        const validCols = getValidColumn(board);
        let result;
        let col = 0;
        let row;
        let clone;
        let score = getScore(board, markers()[(
            maximized
            ? turn
            : opponent
        )], maximized);
        if (boardFilled(board, depth) || Math.abs(score) === maxValue) {
            return [null, score];
        }
        result = [
            validCols[Math.floor(Math.random() * validCols.length)],
            score
        ];
        if (maximized) {
            while (col < validCols.length) {
                clone = board.slice().map((row) => row.slice());
                row = getNextOpenRow(clone, validCols[col]);
                clone[row][validCols[col]] = markers()[turn];
                score = minimax(clone, depth - 1, alpha, beta, opponent, false);
                if (score[1] > result[1]) {
                    result = [validCols[col], score[1]];
                }
                if (score[1] === result[1]) {
                    result = score;
                }
                alpha = score[1];
                if (alpha >= beta) {
                    break;
                }
                col += 1;
            }
        } else {
            while (col < validCols.length) {
                clone = board.slice().map((row) => row.slice());
                row = getNextOpenRow(clone, validCols[col]);
                clone[row][validCols[col]] = markers()[opponent];
                score = minimax(clone, depth - 1, alpha, beta, opponent, true);
                if (score[1] < result[1]) {
                    result = [validCols[col], score[1]];
                }
                beta = score[1];
                if (alpha >= beta) {
                    break;
                }
                col += 1;
            }
        }
        return result;
    }

    this.updateTurn = function (newTurn) {
        let disc;
        let board;
        turn = newTurn;
        if (turn === "cpu" && engine !== null) {
            timer.init();
            board = engine.getBoard();
            [disc] = minimax(board, 3, -maxValue, maxValue, "player 1", true);
            moves[moves.length] = () => engine.choose(disc + 1);
        }
    };

    this.selectDisc = function (index) {
        if (turn === "player 1" && typeof engine.choose === "function") {
            engine.choose(index);
        }
    };
    this.getMarkers = markers;
}

export default Object.freeze({
    cpu: () => new CPUMode(),
    player: () => new SimpleMode()
});

