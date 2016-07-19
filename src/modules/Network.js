"use strict";
const help = require("./Helper");
;
let neuronActivation = function (x) { return 2 / (1 + Math.exp(-4.9 * x)) - 1; };
(function (neuronPlace) {
    neuronPlace[neuronPlace["INPUT"] = 1] = "INPUT";
    neuronPlace[neuronPlace["HIDDEN"] = 2] = "HIDDEN";
    neuronPlace[neuronPlace["OUTPUT"] = 3] = "OUTPUT";
})(exports.neuronPlace || (exports.neuronPlace = {}));
var neuronPlace = exports.neuronPlace;
(function (neuronType) {
    neuronType[neuronType["BIAS"] = -1] = "BIAS";
    neuronType[neuronType["NULL"] = 0] = "NULL";
    neuronType[neuronType["SENSOR"] = 1] = "SENSOR";
    neuronType[neuronType["NEURON"] = 2] = "NEURON";
})(exports.neuronType || (exports.neuronType = {}));
var neuronType = exports.neuronType;
class Neuron {
    constructor(what, where) {
        this.value = 0;
        this.frame = 0;
        this.linksIn = [];
        this.type = what;
        this.place = where;
    }
    activation() {
        this.value = 2 / (1 + Math.exp(-4.9 * this.value)) - 1;
        return this.value;
    }
}
exports.Neuron = Neuron;
class Link {
    constructor(s, t, w) {
        this.start = s;
        this.target = t;
        this.weight = w;
    }
}
class Network {
    constructor(inputs, maxHidden, outputs) {
        this.frame = 0;
        this.neurons = Array();
        this.neurons[0] = new Neuron(neuronType.BIAS, neuronPlace.INPUT);
        this.neurons[0].value = 1;
        this.inputs = inputs;
        this.maxHidden = maxHidden;
        this.outputs = outputs;
        for (let i = 1; i <= this.inputs; i++) {
            this.neurons[i] = new Neuron(neuronType.SENSOR, neuronPlace.INPUT);
        }
        for (let o = 0; o <= this.outputs; o++) {
            this.neurons[this.inputs + this.maxHidden + 1 + o] = new Neuron(neuronType.NEURON, neuronPlace.OUTPUT);
        }
    }
    pushLink(start, target, weight) {
        let s = this.neurons[start];
        let t = this.neurons[target];
        if (help.varundefined(s)) {
            s = new Neuron(neuronType.NEURON, neuronPlace.HIDDEN);
        }
        if (help.varundefined(t)) {
            t = new Neuron(neuronType.NEURON, neuronPlace.HIDDEN);
        }
        t.linksIn.push(new Link(start, target, weight));
        this.neurons[start] = s;
        this.neurons[target] = t;
    }
    generate(gen) {
        for (let val of gen) {
            if (val.enabled) {
                this.pushLink(val.start, val.target, val.weight);
            }
        }
    }
    propagate(index) {
        if (this.neurons[index].place == neuronPlace.INPUT || this.neurons[index].frame == this.frame) {
            return this.neurons[index].value;
        }
        else {
            let sum = 0;
            this.neurons[index].frame = this.frame;
            for (let val of this.neurons[index].linksIn) {
                sum += val.weight * this.propagate(val.start);
            }
            this.neurons[index].value = sum;
            if (this.neurons[index].place == neuronPlace.OUTPUT) {
                return this.neurons[index].value;
            }
            else {
                return this.neurons[index].activation();
            }
        }
    }
    run(inputs) {
        this.frame++;
        if (inputs.length != this.inputs) {
            console.log("Invalid number of inputs given during network execution.");
            return;
        }
        for (let i = 1; i <= this.inputs; i++) {
            this.neurons[i].value = inputs[i - 1];
        }
        let outputs = new Array();
        for (let o = 1; o <= this.outputs; o++) {
            let current = this.inputs + this.maxHidden + o;
            outputs.push(this.propagate(current));
        }
        return outputs;
    }
}
exports.Network = Network;
