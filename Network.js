var neuronPlace;
(function (neuronPlace) {
    neuronPlace[neuronPlace["INPUT"] = 1] = "INPUT";
    neuronPlace[neuronPlace["HIDDEN"] = 2] = "HIDDEN";
    neuronPlace[neuronPlace["OUTPUT"] = 3] = "OUTPUT";
})(neuronPlace || (neuronPlace = {}));
var neuronType;
(function (neuronType) {
    neuronType[neuronType["BIAS"] = -1] = "BIAS";
    neuronType[neuronType["NULL"] = 0] = "NULL";
    neuronType[neuronType["SENSOR"] = 1] = "SENSOR";
    neuronType[neuronType["NEURON"] = 2] = "NEURON";
})(neuronType || (neuronType = {}));
var Neuron = (function () {
    function Neuron(what, where) {
        this.value = 0;
        this.frame = 0;
        this.linksIn = [];
        this.type = what;
        this.place = where;
    }
    Neuron.prototype.activation = function () {
        this.value = 2 / (1 + Math.exp(-4.9 * this.value)) - 1;
        return this.value;
    };
    return Neuron;
}());
var Link = (function () {
    function Link(s, t, w) {
        this.start = s;
        this.target = t;
        this.weight = w;
    }
    return Link;
}());
var Network = (function () {
    function Network() {
        this.frame = 0;
        this.neurons = Array();
        this.neurons[0] = new Neuron(neuronType.BIAS, neuronPlace.INPUT);
        this.neurons[0].value = 1;
        for (var i = 1; i <= nInputs; i++) {
            this.neurons[i] = new Neuron(neuronType.SENSOR, neuronPlace.INPUT);
        }
        for (var o = 1; o <= nOutputs; o++) {
            this.neurons[nMaxHidden + nInputs + o] = new Neuron(neuronType.NEURON, neuronPlace.OUTPUT);
        }
    }
    Network.prototype.propagate = function (index) {
        if (this.neurons[index].place == neuronPlace.INPUT || this.neurons[index].frame == this.frame) {
            return this.neurons[index].value;
        }
        else {
            var sum = 0;
            this.neurons[index].frame = this.frame;
            for (var _i = 0, _a = this.neurons[index].linksIn; _i < _a.length; _i++) {
                var val = _a[_i];
                sum += val.weight * this.propagate(val.start);
            }
            this.neurons[index].value = sum;
            return this.neurons[index].activation();
        }
    };
    Network.prototype.run = function (inputs) {
        this.frame++;
        if (inputs.length != nInputs) {
            console.log("Invalid number of inputs given during network execution.");
            return;
        }
        for (var i = 1; i <= nInputs; i++) {
            this.neurons[i].value = inputs[i - 1];
        }
        var outputs = new Array();
        for (var o = 1; o <= nOutputs; o++) {
            var current = nInputs + nMaxHidden + o;
            outputs.push(this.propagate(current));
        }
        return outputs;
    };
    return Network;
}());
