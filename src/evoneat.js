'use strict';
const workerFarm = require("worker-farm");
const fs = require("fs");
const cfg = require("./config.js");
const FARM_OPTIONS = {
    maxConcurrentWorkers: require('os').cpus().length,
    maxCallsPerWorker: Infinity,
    maxConcurrentCallsPerWorker: 1
};
const help = require("./modules/helper");
let innovations = new Array();
let innovationCount = 0;
function innovationCheck(Gene) {
    let start = Gene.start;
    let target = Gene.target;
    function newInnovation() {
        innovationCount++;
        innovations[start][target] = innovationCount;
    }
    if (help.varundefined(innovations[start])) {
        innovations[start] = new Array();
        newInnovation();
    }
    else if (help.varundefined(innovations[start][target])) {
        newInnovation();
    }
    return innovations[start][target];
}
let nInputs;
let nMaxHidden;
let nOutputs;
let nPopulation;
const neural = require("./modules/Network");
class Gene {
    constructor(s, t, w, e) {
        this.start = s;
        this.target = t;
        this.weight = w;
        this.enabled = e;
        this.innovation = innovationCheck(this);
    }
    perturb() {
        if (Math.random() < cfg.pPerturbUniform) {
            this.weight *= Math.random();
        }
        else {
            this.weight = cfg.newWeight();
        }
    }
}
class Organism {
    constructor() {
        this.genome = [];
        this.geneList = [];
        this.maxNeuron = 0;
        this.innovationMin = Infinity;
        this.innovationMax = -Infinity;
    }
    sort() {
        function compare(a, b) {
            return a.innovation - b.innovation;
        }
        this.genome.sort(compare);
    }
    pushGene(gene) {
        if (!this.geneList[gene.innovation]) {
            this.innovationMin = Math.min(this.innovationMin, gene.innovation);
            this.innovationMax = Math.max(this.innovationMax, gene.innovation);
            this.genome.push(gene);
            this.geneList[gene.innovation] = true;
        }
    }
    crossover(other) {
        if (this.getFitness > other.getFitness) {
            var p1 = this;
            var p2 = other;
        }
        else {
            var p1 = other;
            var p2 = this;
        }
        let child = new Organism();
        let match = new Array();
        for (let val of p2.genome) {
            match[val.innovation] = val;
        }
        for (let val of p1.genome) {
            let push = val;
            if (!help.varundefined(match[val.innovation])) {
                if (Math.random() < cfg.pKeepNotFit) {
                    push = match[val.innovation];
                }
                push.enabled = !((!val.enabled || !match[val.innovation].enabled) && Math.random() < cfg.pDisable);
            }
            child.pushGene(push);
        }
        return child;
    }
    compatibility(other) {
        let dis = 0;
        let exc = 0;
        let mat = 0;
        let wDif = 0;
        let exists = new Array();
        let matching = new Array();
        for (let val of other.genome) {
            exists[val.innovation] = val.weight;
        }
        for (let val of this.genome) {
            if (val.innovation < other.innovationMin || val.innovation > other.innovationMax) {
                exc++;
            }
            else {
                if (help.varundefined(exists[val.innovation])) {
                    dis++;
                }
                else {
                    wDif += Math.abs(val.weight - exists[val.innovation]);
                    mat++;
                    matching[val.innovation] = true;
                }
            }
        }
        for (let val of other.genome) {
            if (val.innovation < this.innovationMin || val.innovation > this.innovationMax) {
                exc++;
            }
            else if (matching[val.innovation] != true) {
                dis++;
            }
        }
        let maxlen = Math.max(this.genome.length, other.genome.length);
        let N = (maxlen > cfg.cSmallGenome) ? maxlen : 1;
        return (cfg.cDisjoint * dis / N) + (cfg.cExcess * exc / N) + (cfg.cMatching * wDif / mat);
    }
    compatible(other) {
        return this.compatibility(other) < cfg.deltaThreshold;
    }
    addLink(s, t, weight) {
        let gene = new Gene(s, t, weight, true);
        this.pushGene(gene);
    }
    randomNeuron(notInput) {
        let count = 0;
        let exists = new Array();
        if (!notInput) {
            for (let i = 0; i <= nInputs; i++) {
                exists[i] = true;
                count++;
            }
        }
        for (let o = 0; o < nOutputs; o++) {
            exists[nInputs + nMaxHidden + 1 + o] = true;
            count++;
        }
        for (let val of this.genome) {
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
        let index = help.randInt(1, count);
        for (let val in exists) {
            index--;
            if (index == 0) {
                return parseInt(val);
            }
        }
        return 0;
    }
    addNeuron(index) {
        if (!help.varundefined(this.genome[index])) {
            this.genome[index].enabled = false;
            this.maxNeuron++;
            this.addLink(this.genome[index].start, this.maxNeuron, this.genome[index].weight);
            this.addLink(this.maxNeuron, this.genome[index].target, 1);
        }
    }
    perturbLinks() {
        for (let val of this.genome) {
            val.perturb();
        }
    }
    mutate() {
        if (Math.random() < cfg.pPerturb) {
            this.perturbLinks();
        }
        if (Math.random() < cfg.pLink) {
            let n2 = this.randomNeuron(true);
            let n1 = this.randomNeuron(false);
            if (n1 < nInputs + nMaxHidden + nOutputs && n2 < nInputs + nMaxHidden + nOutputs)
                this.addLink(n1, n2, cfg.newWeight());
        }
        if (Math.random() < cfg.pNeuron) {
            this.addNeuron(help.randInt(0, this.genome.length - 1));
        }
    }
    generate() {
        this.phenome = new neural.Network(nInputs, nMaxHidden, nOutputs);
        this.phenome.generate(this.genome);
    }
    getFitness() {
        return this.fitness;
    }
    evaluate() {
        let outputsConnected = false;
        for (let o = 1; o <= nOutputs; o++) {
            if (this.phenome.neurons[nMaxHidden + nInputs + o].linksIn.length > 0) {
                outputsConnected = true;
                break;
            }
        }
        if (outputsConnected) {
            let res = this.phenome.run([0.5]);
            this.fitness = 900 - (Math.abs(res[0] - 2)) * 10;
            if (this.fitness > 890)
                console.log(res);
            if (this.fitness > maxFit) {
                console.log(this.fitness);
                maxFit = this.fitness;
            }
        }
        else {
            this.fitness = 1;
        }
        delete this.phenome;
    }
}
class Species {
    constructor() {
        this.members = [];
        this.sumFitness = -1;
        this.sorted = false;
        this.stagnant = 0;
        this.prevMaxFitness = -Infinity;
    }
    cull(allButTop) {
        this.sortByFitness();
        if (allButTop) {
            let temp = this.members[0];
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
            let oglen = this.members.length;
            while (this.members.length > cfg.cCull * oglen && this.members.length > 1) {
                this.members.pop();
            }
            return oglen - this.members.length;
        }
    }
    sortByFitness() {
        if (!this.sorted) {
            this.members.sort((a, b) => b.getFitness() - a.getFitness());
            this.sorted = true;
        }
    }
    breed() {
        let child;
        if (Math.random() < cfg.pCrossover) {
            let p1 = help.randEntry(this.members);
            let p2 = help.randEntry(this.members);
            if (p1 == p2) {
                child = p1;
            }
            else {
                child = p1.crossover(p2);
            }
        }
        else {
            child = help.randEntry(this.members);
        }
        child.mutate();
        return child;
    }
    compatible(guy) {
        return this.members[0].compatible(guy);
    }
    addMember(newMember) {
        this.members.push(newMember);
        this.sorted = false;
    }
    getAdjFitness() {
        this.sumFitness = 0;
        for (let val of this.members) {
            val.adjFitness = val.getFitness() / this.members.length;
            this.sumFitness += val.adjFitness;
        }
    }
}
class Pool {
    constructor(inputs, maxHidden, outputs, population) {
        this.species = [];
        this.generation = 0;
        this.populationSize = 1;
        nInputs = inputs;
        nMaxHidden = maxHidden;
        nOutputs = outputs;
        nPopulation = population;
        let sp = new Species;
        let org = new Organism;
        org.addLink(1, 3, cfg.newWeight());
        sp.members.push(org);
        this.species.push(sp);
    }
    assignToSpecies(child) {
        for (let val of this.species) {
            if (val.compatible(child)) {
                val.addMember(child);
                return;
            }
        }
        let next = new Species;
        next.addMember(child);
        this.species.push(next);
        this.populationSize++;
    }
    cull(allButTop) {
        for (let val of this.species) {
            this.populationSize -= val.cull(allButTop);
        }
    }
    removeUnfitSpecies() {
        if (this.species.length > 2) {
            let newArr = new Array();
            for (let val of this.species) {
                if (this.species.length > 2) {
                    let t = (val.sumFitness / this.totalFitness) * this.populationSize;
                    if (val.stagnant < cfg.cStagnantSpecies) {
                        newArr.push(val);
                    }
                }
                else {
                    break;
                }
            }
            this.species = newArr;
        }
    }
    calculateFitness() {
        this.totalFitness = 0;
        for (let val of this.species) {
            val.getAdjFitness();
            this.totalFitness += val.sumFitness;
        }
    }
    evaluateAll() {
        for (let sp of this.species) {
            for (let me of sp.members) {
                me.generate();
                me.evaluate();
            }
        }
    }
    nextGeneration() {
        this.evaluateAll();
        this.calculateFitness();
        this.cull(false);
        this.removeUnfitSpecies();
        for (let val of this.species) {
            let times = Math.floor(val.sumFitness / this.totalFitness);
            for (let i = 0; i < times; i++)
                this.assignToSpecies(val.breed());
        }
        this.cull(true);
        while (this.populationSize < nPopulation) {
            this.assignToSpecies(help.randEntry(this.species).breed());
            this.populationSize++;
        }
        this.generation++;
        if (cfg.backup) {
            fs.writeFileSync("./saves/generation_" + this.generation + ".json", JSON.stringify(this));
        }
        console.log("Completed generation number " + this.generation + ".");
        if (this.species.length == 0)
            process.exit();
    }
}
let maxFit = -Infinity;
let mainPool = new Pool(1, 3, 1, 500);
function klol() {
    for (let i = 0; i < 5005; i++) {
        mainPool.nextGeneration();
        if (i % 50 == 0)
            fs.writeFileSync("./saves/generation_" + i + ".json", JSON.stringify(mainPool));
    }
}
klol();
