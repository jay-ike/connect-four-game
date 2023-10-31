
function SimpleMode() {
    let turn;
    let engine;

    this.player1 = "player 1";
    this.player2 = "player 2";
    this.setup = function (mountedEngine, initialTurn) {
        engine = mountedEngine;
        turn = initialTurn;
    };
    this.updateTurn = function (newTurn) {
        turn = newTurn;
    };
    this.selectDisc = function (index) {
        if (turn !== null) {
            engine.selectDisc(index);
        }
    };
}

function CPUMode() {
    let turn;
    let engine;
    let moves = [];

    this.player1 = "player 1";
    this.player2 = "cpu";
    this.setup = function (mountedEngine, initialTurn) {
        engine = mountedEngine;
        turn = initialTurn;
    };
    this.updateTurn = function (newTurn) {
        let discIndex;
        turn = newTurn;
        if (turn === "cpu") {
            discIndex = Math.floor(Math.random() * 42);
            moves[moves.length] = () => engine.selectDisc(discIndex);
            setTimeout(function () {
                let fn = moves.shift();
                if (typeof fn === "function" && turn === "cpu") {
                    fn();
                }
            }, 2000);
        }
    };
    this.selectDisc = function (index) {
        if (turn === "player 1") {
            engine.selectDisc(index);
        }
    };
}
const modeMap = Object.freeze({
    cpu: () => new CPUMode(),
    player: () => new SimpleMode()
});

export default modeMap;
