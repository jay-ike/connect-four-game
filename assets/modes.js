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
    let timer = new StopWatch(5);
    let engine = {};

    timer.addStopListener(requestSelection);
    timer.init();
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
        }
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
    function evaluateRange(range, piece) {
        const playerFields = range.filter((val) => val === piece).length;
        const emptyFields = range.filter((val) => val === 0).length;
        let opponentFields;
        let score = 0;
        let opponent = 1;

        if (piece = 1) {
            opponent = 2;
        }
        opponentFields = range.filter((val) => val === opponent).length;
        if (playerFields === 4) {
            score += 100;
        }
        if (playerFields === 3 && emptyFields === 1) {
            score += 5;
        }
        if (playerFields === 2 && emptyFields === 2) {
            score += 2;
        }
        if (opponentFields === 3 && emptyFields === 1) {
            score -= 4;
        }
        return score;
    }
    function horizontalScores(board, windowLength, piece) {
        let totalScore = board.map(function (arr) {
            const max = arr.length - windowLength;
            let score = 0;
            let i = 0;
            while (i < arr.length - max && max >= 0) {
                score += evaluateRange(arr.slice(i, i + windowLength), piece);
                i += 1;
            }
            return score;
        }).reduce((acc, val) => acc + val, 0);
        return totalScore;
    }
    function verticalScores(board, windowLength, piece) {
        const max = board.length - windowLength;
        const range = new Array(windowLength).fill(0);
        let row;
        let col = 0;
        let score = 0;
        while(col < board[0].length) {
            row = 0;
            while (row <= max && max >= 0) {
                score += evaluateRange(range.map(
                    (ignore, i) => board[row + i][col]
                ), piece);
                row += 1;
            }
            col += 1;
        }
        return score;
    }
    function positiveDiagonalScores(board, windowLength, piece) {
        const range = new Array(windowLength).fill(0);
        let score = 0;
        let row = board.length;
        let col;
        while (row - windowLength >= 0) {
            col = 0;
            while (col + windowLength - 1 < board[0].length) {
                score += evaluateRange(range.map(
                    (ignore, i) => board[row - 1 - i][col + i]
                ), piece);
                col += 1;
            }

            row -= 1;
        }
        return score;
    }
    function getScore(board, piece) {
        const columns = board[0].length;
        let col = Math.floor(columns / 2);
        let row = board.length;
        let score = board.map((arr) => arr[col]).filter(
            (val) => val === piece
        ).length * 3;
    }

    this.updateTurn = function (newTurn) {
        let discIndex;
        turn = newTurn;
        if (turn === "cpu") {
            discIndex = Math.floor(Math.random() * 42);
            moves[moves.length] = () => engine.choose(discIndex);
            timer.restart();
        }
    };

    this.selectDisc = function (index) {
        if (turn === "player 1" && typeof engine.choose === "function") {
            engine.choose(index);
            console.log(positiveDiagonalScores(engine.getBoard(), 4, 1));
        }
    };
    this.getMarkers = markers;
}

export default Object.freeze({
    cpu: () => new CPUMode(),
    player: () => new SimpleMode()
});

