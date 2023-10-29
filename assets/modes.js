
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

export {SimpleMode};
