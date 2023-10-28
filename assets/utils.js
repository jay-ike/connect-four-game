
function Emitter(initialListeners) {
    const listeners = Object.create(null);
    Object.values(initialListeners).forEach(function (name) {
        listeners[name] = [];
    });
    this.register = function (name, fn, notifyWhen) {
        let listener;
        if (typeof fn !== "function") {
            return;
        }
        if (typeof notifyWhen === "function") {
            listener = function (val) {
                if (notifyWhen(val) === true) {
                    fn(val);
                }
            };
        } else {
            listener = fn;
        }
        if (listeners[name] === undefined) {
            listeners[name] = [];
        }
        listeners[name][listeners[name].length] = listener;
    };
    this.notify = function (name, value, indexes = []) {
        let registered;
        if (!Array.isArray(listeners[name])) {
            return;
        }
        if (Array.isArray(indexes) && indexes.length > 0) {
            registered = [];
            indexes.forEach(function indexParser(index) {
                registered[registered.length] = listeners[name][index];
            });
        } else {
            registered = listeners[name];
        }
        registered.forEach((fn) => fn(value));
    };
}

function StopWatch(delayInSecond = 15, tickInSecond = 1) {
    let intervalId;
    let timeoutId;
    let timeout;
    const emitter = new Emitter(["delay", "tick"]);
    this.init = function init(delay = delayInSecond) {
        timeout = delay;
        emitter.notify("tick", timeout);
        intervalId = setInterval(function () {
            timeout -= tickInSecond;
            emitter.notify("tick", timeout);
        }, tickInSecond * 1000);
        timeoutId = setTimeout(function () {
            clearInterval(intervalId);
            emitter.notify("delay");
        }, delay * 1000);
    };
    this.pause = function pause() {
        clearInterval(intervalId);
        clearTimeout(timeoutId);
    };
    this.restart = function restart(delay) {
        this.pause();
        this.init(delay);
    };
    this.resume = function resume() {
        this.restart(timeout);
    };
    this.addTickListener = function tickListener(fn, listenWhen) {
        emitter.register("tick", fn, listenWhen);
    };
    this.addStopListener = function stopLister(fn, listenWhen) {
        emitter.register("delay", fn, listenWhen);
    };
}


function TurnManager(player1, player2) {
    const state = Object.create(null);
    state.starter = player1;
    state.currentTurn = player1;
    this.currentState = () => state;
    this.switchTurn = function switchTurn() {
        const previousTurn = state.currentTurn;
        state.currentTurn = state.previousTurn ?? player2;
        state.previousTurn = previousTurn;
        return this;
    };
    this.init = function initialize() {
        if (state.starter === player2) {
            state.starter = player1;
            state.currentTurn = player2;
        } else {
            state.starter = player2;
            state.currentTurn = player1;
        }
        state.previousTurn = state.currentTurn;
        state.currentTurn = state.starter;
    };
}

export {Emitter, StopWatch, TurnManager};
