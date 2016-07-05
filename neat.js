var nInputs = 5;
var nMaxHidden = 40;
var nOutputs = 4;
var cExcess = 1.0;
var cDisjoint = 1.0;
var cMatching = 0.4;
var cSmallGenome = 20;
var cCull = 0.2;
var cCrossover = 0.75;
var deltaThreshold = 10;
var pDisable = 0.75;
var pPerturb = 0.8;
var pPerturbUniform = 0.9;
var pLink = 0.2;
var pneuron = 0.1;
var pKeepNotFit = 0.5;
var inputs = 5;
function newWeight() {
    return Math.random() * 4 - 2;
}
var innovations = new Array();
var innovationCount = 0;
function innovationCheck(Gene) {
    var start = Gene.start;
    var end = Gene.end;
    function newInnovation() {
        innovationCount++;
        innovations[start][end] = innovationCount;
    }
    if (innovations[start] === null || innovations[start] === undefined) {
        innovations[start] = new Array();
        newInnovation();
    }
    else if (innovations[start][end] === null || innovations[start][end] === undefined) {
        newInnovation();
    }
    return innovations[start][end];
}
function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function binarySearch(l, r, key, query) {
    if (l > r) {
        return [l, r];
    }
    var m = Math.floor(l + (r - l) / 2);
    var q = query(m);
    if (key == q) {
        return m;
    }
    else if (key < q) {
        return binarySearch(l, m - 1, key, query);
    }
    else {
        return binarySearch(m + 1, r, key, query);
    }
}
function insertionSort() {
}
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
        this.neuronsIn = [];
        this.type = what;
        this.place = where;
    }
    Neuron.prototype.activation = function () {
        this.value = 2 / (1 + Math.exp(-4.9 * this.value)) - 1;
    };
    return Neuron;
}());
var Link = (function () {
    function Link(i, o, w) {
        this.in = i;
        this.out = o;
        this.weight = w;
    }
    return Link;
}());
var Network = (function () {
    function Network() {
        this.frame = 0;
        this.neurons = Array();
        this.neurons[0] = new Neuron(neuronType.BIAS, neuronPlace.INPUT);
        for (var i = 1; i < nInputs; i++) {
            this.neurons[i] = new Neuron(neuronType.SENSOR, neuronPlace.INPUT);
        }
        for (var o = 1; o < nOutputs; o++) {
            this.neurons[nMaxHidden + o] = new Neuron(neuronType.NEURON, neuronPlace.OUTPUT);
        }
    }
    Network.prototype.run = function () {
        var outputs = new Array();
        this.frame++;
        function propagate(index) {
            var sum = 0;
            for (var i = 0; i < this.neurons[index].neuronsIn.length; i++) {
                if (this.neurons[index].frame != this.frame) {
                    sum += propagate(this.neurons[index].neuronsIn[i]);
                }
                else {
                    sum += this.neurons[index].neuronsIn[i].value;
                }
            }
            return this.neurons[index].activation();
        }
        for (var o = 1; o < nOutputs; o++) {
            var current = nMaxHidden + o;
            propagate(current);
        }
    };
    return Network;
}());
var Gene = (function () {
    function Gene(s, t, w, e) {
        this.start = s;
        this.end = t;
        this.weight = w;
        this.enabled = e;
        this.innovation = innovationCheck(this);
    }
    Gene.prototype.perturb = function () {
        if (Math.random() < pPerturb) {
            if (Math.random() < pPerturbUniform) {
                this.weight *= Math.random();
            }
            else {
                this.weight = newWeight();
            }
        }
    };
    return Gene;
}());
var Organism = (function () {
    function Organism() {
        this.genome = [];
        this.innovationMin = Infinity;
        this.innovationMax = -Infinity;
        this.fitness = 0;
        this.adjFitness = 0;
    }
    Organism.prototype.sort = function () {
        function compare(a, b) {
            return a.innovation - b.innovation;
        }
        this.genome.sort(compare);
    };
    Organism.prototype.pushGene = function (gene) {
        this.innovationMin = Math.min(this.innovationMin, gene.innovation);
        this.innovationMax = Math.max(this.innovationMax, gene.innovation);
        this.genome.push(gene);
    };
    Organism.prototype.crossover = function (other) {
        if (this.fitness > other.fitness) {
            var p1 = this;
            var p2 = other;
        }
        else {
            var p1 = other;
            var p2 = this;
        }
        var child = new Organism();
        var match = new Array();
        for (var _i = 0, _a = p2.genome; _i < _a.length; _i++) {
            var val = _a[_i];
            match[val.innovation] = val;
        }
        for (var _b = 0, _c = p1.genome; _b < _c.length; _b++) {
            var val = _c[_b];
            var push = val;
            if (match[val.innovation] !== undefined) {
                if (Math.random() < pKeepNotFit) {
                    push = match[val.innovation];
                }
                push.enabled = !((!val.enabled || !match[val.innovation].enabled) && Math.random() < pDisable);
            }
            child.pushGene(push);
        }
        return child;
    };
    Organism.prototype.compatibility = function (other) {
        var dis = 0;
        var exc = 0;
        var mat = 0;
        var wDif = 0;
        var exists = new Array();
        var matching = new Array();
        for (var _i = 0, _a = other.genome; _i < _a.length; _i++) {
            var val = _a[_i];
            exists[val.innovation] = val.weight;
        }
        for (var _b = 0, _c = this.genome; _b < _c.length; _b++) {
            var val = _c[_b];
            if (val.innovation < other.innovationMin || val.innovation > other.innovationMax) {
                exc++;
            }
            else {
                if (exists[val.innovation] === undefined) {
                    dis++;
                }
                else {
                    wDif += Math.abs(val.weight - exists[val.innovation]);
                    mat++;
                    matching[val.innovation] = true;
                }
            }
        }
        for (var _d = 0, _e = other.genome; _d < _e.length; _d++) {
            var val = _e[_d];
            if (val.innovation < this.innovationMin || val.innovation > this.innovationMax) {
                exc++;
            }
            else if (matching[val.innovation] != true) {
                dis++;
            }
        }
        var maxlen = Math.max(this.genome.length, other.genome.length);
        var N = (maxlen > cSmallGenome) ? maxlen : 1;
        return (cDisjoint * dis / N) + (cExcess * exc / N) + (cMatching * wDif / mat);
    };
    Organism.prototype.addLink = function (s, t, weight) {
        var gene = new Gene(s, t, weight, true);
        this.pushGene(gene);
    };
    Organism.prototype.randomNeuron = function (notInput) {
        var exists = new Array();
        var count = 0;
        if (!notInput) {
            for (var i = 0; i < nInputs; i++) {
                exists[i] = true;
                count++;
            }
        }
        for (var o = 1; o < nOutputs; o++) {
            exists[nMaxHidden + o] = true;
            count++;
        }
        for (var _i = 0, _a = this.genome; _i < _a.length; _i++) {
            var val = _a[_i];
            if (!(val.start <= nInputs && notInput)) {
                if (!exists[val.start])
                    count++;
                exists[val.start] = true;
            }
            if (!(val.end <= nInputs && notInput)) {
                if (!exists[val.end])
                    count++;
                exists[val.end] = true;
            }
        }
        var index = randInt(0, count);
        for (var val in exists) {
            index--;
            if (index == 0) {
                return parseInt(val);
            }
        }
    };
    Organism.prototype.addNeuron = function (index) {
        this.genome[index].enabled = false;
        var newneuron = this.randomNeuron(true);
        this.addLink(this.genome[index].start, newneuron, this.genome[index].weight);
        this.addLink(newneuron, this.genome[index].end, 1);
    };
    Organism.prototype.perturbLinks = function () {
        for (var _i = 0, _a = this.genome; _i < _a.length; _i++) {
            var val = _a[_i];
            val.perturb();
        }
    };
    Organism.prototype.mutate = function () {
        this.perturbLinks();
    };
    Organism.prototype.generate = function () {
        this.phenome = new Network;
        for (var _i = 0, _a = this.genome; _i < _a.length; _i++) {
            var val = _a[_i];
            if (val.enabled) {
                var s = this.phenome.neurons[val.start];
                var e = this.phenome.neurons[val.end];
                var w = val.weight;
                if (s === undefined) {
                    s = new Neuron(neuronType.NEURON, neuronPlace.HIDDEN);
                }
                if (e === undefined) {
                    e = new Neuron(neuronType.NEURON, neuronPlace.HIDDEN);
                }
                e.neuronsIn.push(new Link(s, e, w));
                this.phenome.neurons[val.start] = s;
                this.phenome.neurons[val.end] = e;
            }
        }
    };
    Organism.prototype.evaluate = function () {
    };
    return Organism;
}());
var species = (function () {
    function species() {
    }
    species.prototype.cull = function () {
        function compare(a, b) {
            return a.fitness - b.fitness;
        }
        this.members.sort(compare);
        var len = this.members.length;
        while (this.members.length > cCull * len) {
            this.members.pop();
        }
    };
    species.prototype.breed = function () {
        var child;
        if (Math.random() < cCrossover) {
            var p1 = this.members[randInt(0, this.members.length - 1)];
            var p2 = this.members[randInt(0, this.members.length - 1)];
            child = p1.crossover(p2);
        }
        else {
            child = this.members[randInt(0, this.members.length - 1)];
        }
        child.mutate();
        return child;
    };
    return species;
}());
var Generation = (function () {
    function Generation() {
    }
    return Generation;
}());
