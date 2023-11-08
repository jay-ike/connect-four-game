/*jslint browser this*/
function SimpleMode() {
    let turn;
    let choose;

    this.player1 = "player 1";
    this.player2 = "player 2";
    this.destroy = function () {
        turn = null;
        choose = null;
    };
    this.setup = function (selectorFn, initialTurn) {
        if (typeof selectorFn === "function") {
            choose = selectorFn;
        }
        turn = initialTurn;
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
    let timeoutId = setInterval(requestSelection, 5000);
    let choose;

    this.player1 = "player 1";
    this.player2 = "cpu";

    this.destroy = function () {
        turn = null;
        choose = null;
        clearInterval(timeoutId);
    };

    this.setup = function (selectorFn, initialTurn) {
        if (typeof selectorFn === "function") {
            choose = selectorFn;
        }
        turn = initialTurn;
    };

    function requestSelection() {
        let fn = moves.shift();
        const canCall = (
            typeof fn === "function"
            && typeof choose === "function"
        );
        if (canCall && turn === "cpu") {
            fn();
        }
    }

    this.updateTurn = function (newTurn) {
        let discIndex;
        turn = newTurn;
        if (turn === "cpu") {
            discIndex = Math.floor(Math.random() * 42);
            moves[moves.length] = () => choose(discIndex);
        }
    };

    this.selectDisc = function (index) {
        if (turn === "player 1" && typeof choose === "function") {
            choose(index);
        }
    };
}

export default Object.freeze({
    cpu: () => new CPUMode(),
    player: () => new SimpleMode()
});

