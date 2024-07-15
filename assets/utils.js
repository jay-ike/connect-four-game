/*jslint browser, this */
const {cancelAnimationFrame, requestAnimationFrame} = window;
function sealerFactory() {
    const weakmap = new WeakMap();
    return Object.freeze({
        seal(object) {
            const box = Object.freeze(Object.create(null));
            weakmap.set(box, object);
            return box;
        },
        unseal(box) {
            return weakmap.get(box);
        }
    });
}

function Emitter(initialListeners) {
    const listeners = Object.create(null);
    const sealer = sealerFactory();

    Object.values(initialListeners).forEach(function (name) {
        listeners[name] = [];
    });

    this.register = function (name, fn, notifyWhen) {
        let listener;
        let registration;
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
        registration = sealer.seal(listener);
        listeners[name][listeners[name].length] = registration;
        return registration;
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
        registered.forEach(function (registration) {
            let fn = sealer.unseal(registration);
            if (typeof fn === "function") {
                fn(value);
            }
        });
    };
    this.unregister = function (name, registration) {
        if (!Array.isArray(listeners[name])) {
            return;
        }
        listeners[name] = listeners[name].filter((reg) => reg !== registration);
    };
}

function StopWatch(delayInSecond = 15, tickInSecond = 1) {
    let zero;
    let timeoutId;
    let timeout;
    const emitter = new Emitter(["delay", "tick"]);
    if (delayInSecond < tickInSecond) {
        throw new Error("The tick time should be lesser than the delay");
    }
    function firstFrame(timeStamp) {
        zero = timeStamp;
        step(timeStamp);
    }
    function step(timeStamp) {
        let time = (timeStamp - zero) / (tickInSecond * 1000);
        if (time < 1) {
            cancelAnimationFrame(timeoutId);
            timeoutId = requestAnimationFrame(step);
        } else {
            timeout -= tickInSecond;
            if (timeout < 1) {
                emitter.notify("delay");
            } else {
                emitter.notify("tick", timeout);
                cancelAnimationFrame(timeoutId);
                timeoutId = requestAnimationFrame(firstFrame);
            }
        }
    }
    this.init = function init(delay = delayInSecond) {
        timeout = delay;
        emitter.notify("tick", timeout);
        timeoutId = requestAnimationFrame(firstFrame);
    };
    this.pause = function pause() {
        cancelAnimationFrame(timeoutId);
    };
    this.restart = function restart(delay) {
        this.pause();
        this.init(delay);
    };
    this.resume = function resume() {
        this.restart(timeout);
    };
    this.stop = function () {
        this.pause();
        timeout = 0;
    };
    this.addTickListener = function tickListener(fn, listenWhen) {
        emitter.register("tick", fn, listenWhen);
    };
    this.addExpirationListener = function stopLister(fn, listenWhen) {
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
