var Organism = (function () {
    function Organism() {
        this.genome = [];
        this.maxNeuron = 0;
        this.innovationMin = Infinity;
        this.innovationMax = -Infinity;
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
        if (Math.random() < pPerturb) {
            this.perturbLinks();
        }
        if (Math.random() < pLink) {
            var n2 = this.randomNeuron(true);
            var n1 = this.randomNeuron(false);
            this.addLink(n1, n2, newWeight);
        }
        if (Math.random() < pNeuron) {
            this.addNeuron(randInt(0, this.genome.length - 1));
        }
    };
    Organism.prototype.generate = function () {
        this.phenome = new Network;
        for (var _i = 0, _a = this.genome; _i < _a.length; _i++) {
            var val = _a[_i];
            if (val.enabled) {
                var s = this.phenome.neurons[val.start];
                var t = this.phenome.neurons[val.target];
                var w = val.weight;
                if (s === undefined) {
                    s = new Neuron(neuronType.NEURON, neuronPlace.HIDDEN);
                }
                if (t === undefined) {
                    t = new Neuron(neuronType.NEURON, neuronPlace.HIDDEN);
                }
                t.linksIn.push(new Link(val.start, val.target, w));
                this.phenome.neurons[val.start] = s;
                this.phenome.neurons[val.target] = t;
            }
        }
    };
    Organism.prototype.getFitness = function () {
        if (this.fitness === undefined || this.fitness === null) {
            if (this.phenome === undefined || this.phenome === null) {
                this.generate();
            }
            this.evaluate();
        }
        return this.fitness;
    };
    Organism.prototype.evaluate = function () {
        var outputsConnected = false;
        for (var o = 1; o <= nOutputs; o++) {
            if (this.phenome.neurons[nMaxHidden + nInputs + o].linksIn.length > 0) {
                outputsConnected = true;
                break;
            }
        }
        if (outputsConnected) {
        }
        delete this.phenome;
    };
    return Organism;
}());
