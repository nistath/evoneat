var fs = require("fs");
var cfg = require("./config.js");
var FARM_OPTIONS = {
    maxConcurrentWorkers: require('os').cpus().length,
    maxCallsPerWorker: Infinity,
    maxConcurrentCallsPerWorker: 1
};
function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randEntry(arr) {
    return arr[randInt(0, arr.length - 1)];
}
function varundefined(val) {
    return val === undefined || val === null;
}
function insertionSort(val, arr, compare) {
    var i = 0;
    if (varundefined(arr))
        return;
    do {
        if (varundefined(arr[i])) {
            break;
        }
        else {
            i++;
        }
    } while (compare(arr[i], val));
    arr.splice(i, 0, val);
}
function shufflearr(a) {
    var j, x, i;
    for (i = a.length; i; i--) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
}
var innovations = new Array();
var innovationCount = 0;
function innovationCheck(Gene) {
    var start = Gene.start;
    var target = Gene.target;
    function newInnovation() {
        this.innovationCount++;
        this.innovations[start][target] = this.innovationCount;
    }
    if (varundefined(this.innovations[start])) {
        this.innovations[start] = new Array();
        newInnovation();
    }
    else if (varundefined(this.innovations[start][target])) {
        newInnovation();
    }
    return this.innovations[start][target];
}
var nInputs;
var nMaxHidden;
var nOutputs;
var nPopulation;
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
        this.value = cfg.neuronActivation(this.value);
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
    Network.prototype.pushLink = function (start, target, weight) {
        var s = this.neurons[start];
        var t = this.neurons[target];
        if (varundefined(s)) {
            s = new Neuron(neuronType.NEURON, neuronPlace.HIDDEN);
        }
        if (varundefined(t)) {
            t = new Neuron(neuronType.NEURON, neuronPlace.HIDDEN);
        }
        t.linksIn.push(new Link(start, target, weight));
        this.neurons[start] = s;
        this.neurons[target] = t;
    };
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
var Gene = (function () {
    function Gene(s, t, w, e) {
        this.start = s;
        this.target = t;
        this.weight = w;
        this.enabled = e;
        this.innovation = innovationCheck(this);
    }
    Gene.prototype.perturb = function () {
        if (Math.random() < cfg.pPerturbUniform) {
            this.weight *= Math.random();
        }
        else {
            this.weight = cfg.newWeight();
        }
    };
    return Gene;
}());
var Organism = (function () {
    function Organism() {
        this.genome = [];
        this.maxNeuron = 0;
        this.innovationMin = Infinity;
        this.innovationMax = -Infinity;
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
        if (this.getFitness > other.getFitness) {
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
            if (!varundefined(match[val.innovation])) {
                if (Math.random() < cfg.pKeepNotFit) {
                    push = match[val.innovation];
                }
                push.enabled = !((!val.enabled || !match[val.innovation].enabled) && Math.random() < cfg.pDisable);
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
                if (varundefined(exists[val.innovation])) {
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
        var N = (maxlen > cfg.cSmallGenome) ? maxlen : 1;
        return (cfg.cDisjoint * dis / N) + (cfg.cExcess * exc / N) + (cfg.cMatching * wDif / mat);
    };
    Organism.prototype.compatible = function (other) {
        return this.compatibility(other) < cfg.deltaThreshold;
    };
    Organism.prototype.addLink = function (s, t, weight) {
        var gene = new Gene(s, t, weight, true);
        this.pushGene(gene);
    };
    Organism.prototype.randomNeuron = function (notInput) {
        var count = 0;
        var exists = new Array();
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
            if (!(val.target <= nInputs && notInput)) {
                if (!exists[val.target])
                    count++;
                exists[val.target] = true;
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
        this.maxNeuron++;
        this.addLink(this.genome[index].start, this.maxNeuron, this.genome[index].weight);
        this.addLink(this.maxNeuron, this.genome[index].target, 1);
    };
    Organism.prototype.perturbLinks = function () {
        for (var _i = 0, _a = this.genome; _i < _a.length; _i++) {
            var val = _a[_i];
            val.perturb();
        }
    };
    Organism.prototype.mutate = function () {
        if (Math.random() < cfg.pPerturb) {
            this.perturbLinks();
        }
        if (Math.random() < cfg.pLink) {
            var n2 = this.randomNeuron(true);
            var n1 = this.randomNeuron(false);
            this.addLink(n1, n2, cfg.newWeight);
        }
        if (Math.random() < cfg.pNeuron) {
            this.addNeuron(randInt(0, this.genome.length - 1));
        }
    };
    Organism.prototype.generate = function () {
        this.phenome = new Network;
        for (var _i = 0, _a = this.genome; _i < _a.length; _i++) {
            var val = _a[_i];
            if (val.enabled) {
                this.phenome.pushLink(val.start, val.target, val.weight);
            }
        }
    };
    Organism.prototype.getFitness = function () {
        return this.fitness;
    };
    Organism.prototype.evaluate = function (worker, callback) {
        var outputsConnected = false;
        for (var o = 1; o <= nOutputs; o++) {
            if (this.phenome.neurons[nMaxHidden + nInputs + o].linksIn.length > 0) {
                outputsConnected = true;
                break;
            }
        }
        if (outputsConnected) {
        }
        else {
            this.fitness = 0;
        }
        delete this.phenome;
    };
    return Organism;
}());
var Species = (function () {
    function Species() {
        this.members = [];
        this.sumFitness = 0;
        this.sorted = false;
        this.stagnant = 0;
        this.prevMaxFitness = -Infinity;
    }
    Species.prototype.cull = function (allButTop) {
        this.sortByFitness();
        if (allButTop) {
            var temp = this.members[0];
            if (temp.fitness <= this.prevMaxFitness) {
                this.stagnant++;
            }
            if (this.members.length <= cfg.cSmallSpecies) {
                this.members = [];
                this.members.push(temp);
                return this.members.length - 1;
            }
            else {
                return 0;
            }
        }
        else {
            var oglen = this.members.length;
            while (this.members.length > cfg.cCull * oglen && this.members.length > 1) {
                this.members.pop();
            }
            return oglen - this.members.length;
        }
    };
    Species.prototype.sortByFitness = function () {
        if (!this.sorted) {
            this.members.sort(function (a, b) { return b.getFitness() - a.getFitness(); });
            this.sorted = true;
        }
    };
    Species.prototype.breed = function () {
        var child;
        if (Math.random() < cfg.pCrossover) {
            var p1 = randEntry(this.members);
            var p2 = randEntry(this.members);
            child = (p1 == p2) ? p1 : p1.crossover(p2);
        }
        else {
            child = randEntry(this.members);
        }
        child.mutate();
        return child;
    };
    Species.prototype.compatible = function (guy) {
        return this.members[0].compatible(guy);
    };
    Species.prototype.addMember = function (newMember) {
        this.members.push(newMember);
        this.sorted = false;
    };
    Species.prototype.getAdjFitness = function () {
        this.sumFitness = 0;
        console.log(this.members);
        for (var _i = 0, _a = this.members; _i < _a.length; _i++) {
            var val = _a[_i];
            val.adjFitness = val.getFitness() / this.members.length;
            this.sumFitness += val.adjFitness;
        }
        return this.sumFitness;
    };
    return Species;
}());
var Pool = (function () {
    function Pool(inputs, maxHidden, outputs, population) {
        this.species = [];
        this.generation = 0;
        this.populationSize = 0;
        nInputs = inputs;
        nMaxHidden = maxHidden;
        nOutputs = outputs;
        nPopulation = population;
        var sp = new Species;
        sp.members.push(new Organism);
        this.species.push(sp);
    }
    Pool.prototype.assignToSpecies = function (child) {
        for (var _i = 0, _a = this.species; _i < _a.length; _i++) {
            var val = _a[_i];
            if (val.compatible(child)) {
                val.addMember(child);
                return;
            }
        }
        var next = new Species;
        next.addMember(child);
        this.species.push(next);
        this.populationSize++;
    };
    Pool.prototype.cull = function (allButTop) {
        for (var _i = 0, _a = this.species; _i < _a.length; _i++) {
            var val = _a[_i];
            this.populationSize -= val.cull(allButTop);
        }
    };
    Pool.prototype.breed = function () {
        for (var _i = 0, _a = this.species; _i < _a.length; _i++) {
            var val = _a[_i];
            var times = Math.floor(val.getAdjFitness() / this.totalAdjFitness());
            for (var i = 0; i < times; i++)
                this.assignToSpecies(val.breed());
        }
        while (this.populationSize < nPopulation) {
            this.assignToSpecies(randEntry(this.species).breed());
        }
    };
    Pool.prototype.removeStagnant = function () {
        for (var i = 0; i < this.species.length; i++) {
            var member = this.species[i];
            if (member.stagnant >= cfg.cStagnantSpecies) {
                this.species.splice(i);
                i--;
            }
        }
    };
    Pool.prototype.totalAdjFitness = function () {
        if (!varundefined(this.totalFitness))
            return this.totalFitness;
        for (var _i = 0, _a = this.species; _i < _a.length; _i++) {
            var val = _a[_i];
            this.totalFitness += val.getAdjFitness();
        }
        return this.totalFitness;
    };
    Pool.prototype.tellFitness = function (species, member, fitness) {
        this.species[species].members[member].fitness = fitness;
    };
    Pool.prototype.evaluateAll = function () {
        var concurrent = workerFarm(FARM_OPTIONS, require.resolve(cfg.evaluatorPath));
        var count = this.populationSize;
        function tally(species, member, fitness) {
        }
        for (var sp in this.species) {
            var spe = this.species[sp];
            for (var me in spe) {
                spe.members[1].evaluate(concurrent, tally);
            }
        }
    };
    Pool.prototype.nextGeneration = function () {
        this.cull(false);
        this.removeStagnant();
        this.breed();
        this.cull(true);
        this.generation++;
        var gen = this.generation;
        fs.writeFile("./saves/generation_" + this.generation + ".json", JSON.stringify(this), function (err) {
            if (err) {
                return console.log(err);
            }
            console.log("Backed up generation number " + gen + ".");
        });
    };
    return Pool;
}());
