//import { config } from "./interfaces"; // Maybe unnecessary
import { config as cfg } from "./defaultConfig";

import * as fs from "fs";
//const worker = require("worker-farm");

/*
interface os {
    cpus: () => Array<any>
}

const FARM_OPTIONS = {
    maxConcurrentWorkers: <os>require('os').cpus().length, //Fix?
    maxCallsPerWorker: Infinity,
    maxConcurrentCallsPerWorker: 1
};
*/

import * as help from "./modules/helper";

//I'd like these to belong in class Pool, due to their pool specific nature, but can't reference them from child objects.
let innovations = new Array<Array<number>>();
let innovationCount: number = 0;

function innovationCheck(Gene: Gene): number {
    let start = Gene.start;
    let target = Gene.target;

    function newInnovation() {
        innovationCount++;
        innovations[start][target] = innovationCount;
    }

    if (help.varundefined(innovations[start])) {
        innovations[start] = new Array<number>();
        newInnovation();
    }
    else if (help.varundefined(innovations[start][target])) {
        newInnovation();
    }
    return innovations[start][target];
}

let nInputs: number;
let nMaxHidden: number;
let nOutputs: number;
let nPopulation: number;

import * as neural from "./modules/Network";

class Gene {
    innovation: number;
    start: number;
    target: number;
    weight: number;
    enabled: boolean;

    constructor(s: number, t: number, w: number, e: boolean) {
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
    genome: Array<Gene> = [];
    geneList: Array<boolean> = [];
    maxNeuron: number = nInputs + nOutputs;
    innovationMin: number = Infinity;
    innovationMax: number = -Infinity;
    fitness: number;
    phenome: neural.Network;

    sort() {
        function compare(a, b) {
            return a.innovation - b.innovation;
        }
        this.genome.sort(compare);
    }

    pushGene(gene: Gene) {
        if (!this.geneList[gene.innovation]) {
            this.innovationMin = Math.min(this.innovationMin, gene.innovation);
            this.innovationMax = Math.max(this.innovationMax, gene.innovation);
            this.genome.push(gene);
            this.geneList[gene.innovation] = true;
        }
    }

    crossover(other: Organism): Organism {
        if (this.getFitness > other.getFitness) {
            var p1: Organism = this;
            var p2: Organism = other;
        }
        else {
            var p1: Organism = other;
            var p2: Organism = this;
        }

        let child = new Organism();

        let match = new Array<Gene>();
        for (let val of p2.genome) {
            match[val.innovation] = val;
        }

        for (let val of p1.genome) {
            let push: Gene = val;
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

    /* Alternate crossover method. Requires sorted, by innovation, genomes.
    crossover(other: Organism): Organism{
        let i=0;
        let j=0;

        for(;;){
            let l=false;
            let k=false;
            if(i>=p1.genome.length){
                i=p1.genome.length-1;
                l=true;
            }
            if(j>=p2.genome.length){
                j=p2.genome.length-1;
                k=true;
            }
            let q={a: p1.genome[i], b: p2.genome[j], goa: l, gob: k};

            if(q.goa && q.gob) break;
            if(q.a.innovation==q.b.innovation){
                if(!q.b.enabled && Math.random()<pDisable){//If the b Gene is disabled and at a pDisable chance.
                    child.pushGene(q.b);
                }
                else{
                    child.pushGene(q.a);
                }
                i++;
                j++;
            }
            else if((q.a.innovation<q.b.innovation && !q.goa) || q.gob){
                child.pushGene(q.a);
                i++;
            }
            else if((q.a.innovation>q.b.innovation && !q.gob) || q.goa){
                child.pushGene(q.b);
                j++;
            }
        }

        return child;
    }
    */

    compatibility(other: Organism): number {
        let dis = 0;
        let exc = 0;
        let mat = 0;
        let wDif = 0;

        let exists = new Array<number>();
        let matching = new Array<boolean>();

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

    compatible(other: Organism) {
        return this.compatibility(other) < cfg.deltaThreshold
    }

    /*Compatibility function for alternate method.
    compatibility(other: Organism){
        let i=0;
        let j=0;
        let dis=0;
        let exc=0;
        let mat=0;
        let wDif=0;

        let excuntilnow=true;
        for(;;){
            if(i>=this.genome.length-1 || j>=other.genome.length-1) break;
            if(this.genome[i].innovation==other.genome[j].innovation){
                excuntilnow=false;
                i++;
                j++;
                mat++;
                wDif+=Math.abs(this.genome[i].weight-other.genome[j].weight);
            }
            else if(this.genome[i].innovation<other.genome[j].innovation){
                i++;
                if(excuntilnow){
                    exc++;
                }
                else{
                    dis++;
                }
            }
            else if(this.genome[i].innovation>other.genome[j].innovation){
                j++;
                if(excuntilnow){
                    exc++;
                }
                else{
                    dis++;
                }
            }
        }
        exc+=(i>=this.genome.length)? other.genome.length-j+1 : this.genome.length-i+1;

        let maxlen=Math.max(this.genome.length, other.genome.length);
        let N=(maxlen>cSmallGenome)? maxlen : 1;
        return (cDisjoint*dis/N)+(cExcess*exc/N)+(cMatching*wDif/mat);
    }
    */

    addLink(s: number, t: number, weight) {
        let gene = new Gene(s, t, weight, true);
        this.pushGene(gene);
    }

    /* Insertion sort addLink for the alternate crossover method.
    private addLink(s: number, t: number){
        let gen=new Gene(s, t, cfg.newWeight(), true);
        let i=this.genome.length-1;
        while(i>0 && this.genome[i]<this.genome[i-1]){
            swap(this.genome[i],this.genome[i-1]); //Check if swap actually changes anything in the array
            i--;
        }
    }
    */

    randomNeuron(notInput: boolean): number {
        let count = 0;
        let exists = new Array<boolean>();

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
            if (!(val.start <= nInputs && notInput) && val.start < nInputs + nMaxHidden + nOutputs) {
                if (!exists[val.start]) count++;
                exists[val.start] = true;
            }

            if (!(val.target <= nInputs && notInput) && val.target < nInputs + nMaxHidden + nOutputs) {
                if (!exists[val.target]) count++;
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
        return 0; //Failsafe...
    }

    private addNeuron(index: number) {
        if (!help.varundefined(this.genome[index]) && this.maxNeuron < nInputs + nOutputs + nMaxHidden) {
            this.genome[index].enabled = false;
            this.maxNeuron++;
            this.addLink(this.genome[index].start, this.maxNeuron, this.genome[index].weight);
            this.addLink(this.maxNeuron, this.genome[index].target, 1);
        }
    }

    private perturbLinks() {
        for (let val of this.genome) {
            val.perturb();
        }
    }

    addRandomLink() {
        let n2 = this.randomNeuron(true); //Premature optimization not yet implemented. :P
        let n1 = this.randomNeuron(false);

        if (n1 <= nInputs + nMaxHidden + nOutputs && n2 <= nInputs + nMaxHidden + nOutputs)
            this.addLink(n1, n2, cfg.newWeight());
    }

    mutate() {
        if (Math.random() < cfg.pPerturb)
            this.perturbLinks();

        if (Math.random() < cfg.pLink)
            this.addRandomLink();

        if (Math.random() < cfg.pNeuron) {
            this.addNeuron(help.randInt(0, this.genome.length - 1));
        }
    }

    generate() {
        this.phenome = new neural.Network(nInputs, nMaxHidden, nOutputs);

        for (let gene of this.genome) {
            if (gene.enabled) {
                this.phenome.addLink(gene.start, gene.target, gene.weight);
            }
        }
    }

    getFitness() {
        return this.fitness;
    }

    evaluate() {
        if (this.phenome.outputsConnected()) {
            //Run evaluator.
            let res = this.phenome.run([1]);
            let res2 = this.phenome.run([-1]);
            let res3 = this.phenome.run([0]);
            this.fitness = 3 / (Math.pow(res[0] + 0.25, 2) + Math.pow(res2[0] - 0.5, 2) + Math.pow(res3[0], 2));
            if (this.fitness > maxFit) {
                console.log("fit" + this.fitness);
                maxFit = this.fitness;
                console.log(res[0]);
                console.log(res2[0]);
                console.log(res3[0]);
            }
        }
        else {
            this.fitness = 1;
        }

        delete this.phenome;
    }
}

class Species {
    members: Array<Organism> = [];
    avgFitness: number = 0;
    sorted: boolean = false;
    stagnant: number = 0;
    maxFitness: number = 0;

    cull(allButTop: boolean): number { //Returns the number of members that got deleted.
        this.sortByFitness();

        if (allButTop) {
            let temp = this.members[0];

            this.members = [];
            this.members.push(temp);

            return this.members.length - 1;
        }
        else {
            let oglen = this.members.length;
            while (this.members.length > Math.ceil(cfg.cCull * oglen)) {
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
        let child: Organism;
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

    compatible(guy: Organism) {
        return this.members[0].compatible(guy);
    }

    addMember(newMember: Organism) {
        this.members.push(newMember);
        this.sorted = false;
        //insertionSort(newMember, this.members, function(a: Organism,b: Organism){return a.getFitness>b.getFitness;});
    }

    getAvgFitness(): number {
        this.avgFitness = 0;
        for (let val of this.members) {
            this.avgFitness += val.getFitness();
        }
        this.avgFitness /= this.members.length;

        return this.avgFitness;
    }
}

class Pool {
    species: Array<Species> = [];
    generation: number = 0;
    totalAvgFitness: number;
    populationSize: number = 1;

    constructor(inputs: number, maxHidden: number, outputs: number, population: number) {
        nInputs = inputs;
        nMaxHidden = maxHidden;
        nOutputs = outputs;
        nPopulation = population;

        let sp = new Species;
        let org = new Organism;
        org.addRandomLink();
        sp.members.push(org);
        this.species.push(sp);
    }

    assignToSpecies(child: Organism) {
        for (let val of this.species) {
            if (val.compatible(child)) {
                val.addMember(child);
                this.populationSize++;
                return;
            }
        }

        let next = new Species;
        next.addMember(child);
        this.species.push(next);
        this.populationSize++;
    }

    cull(allButTop: boolean) {
        for (let val of this.species) {
            this.populationSize -= val.cull(allButTop);
        }
    }

    removeStagnantSpecies() {
        let newArr = new Array<Species>();

        for (let val of this.species) {
            val.sortByFitness();

            if (val.members[0].fitness > val.maxFitness) {
                val.stagnant = 0;
                val.maxFitness = val.members[0].fitness;
            }
            else {
                val.stagnant++;
            }

            if (val.stagnant < cfg.cStagnantSpecies || val.maxFitness == maxFit) {
                newArr.push(val);
            }
        }

        this.species = newArr;
    }

    getTotalAvgFitness(): number {
        this.totalAvgFitness = 0;
        for (let val of this.species) {
            this.totalAvgFitness += val.getAvgFitness();
        }

        return this.totalAvgFitness;
    }

    evaluateAll() {
        for (let sp of this.species) {
            for (let me of sp.members) {
                me.generate();
                me.evaluate();
            }
        }
    }

    getPopulationSize() {
        this.populationSize = 0;
        for (let val of this.species) {
            this.populationSize += val.members.length;
        }
    }

    nextGeneration() {
        if (this.species.length == 0) console.log("dead");

        this.getTotalAvgFitness();
        this.getPopulationSize();
        this.cull(false);
        this.removeStagnantSpecies();
        this.getPopulationSize();

        let children = new Array<Organism>();

        for (let val of this.species) {
            let times = Math.floor(val.avgFitness / this.totalAvgFitness) * nPopulation - 1;
            for (let i = 0; i < times; i++) children.push(val.breed());
        }

        this.cull(true);
        this.getPopulationSize();

        while (this.populationSize + children.length < nPopulation) {
            children.push(help.randEntry(this.species).breed());
        }

        for (let val of children) {
            this.assignToSpecies(val);
        }

        this.generation++;

        if (this.generation % cfg.backup == 0) {
            fs.writeFileSync("../saves/generation_" + this.generation + ".json", JSON.stringify(this));
        }
        //console.log("Completed generation number " + this.generation + ".");
    }
}

let maxFit = 0;
let mainPool = new Pool(1, 4, 1, 100);
function klol() {
    for (let i = 0; i < 10000; i++) {
        mainPool.evaluateAll();
        mainPool.nextGeneration();
    }
}

klol();
