function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function varundefined(val: any): boolean{
    return val===undefined || val===null;
}

//I'd like these to belong in class Pool, due to their pool specific nature, but can't reference them from child objects.
let innovations=new Array<Array<number>>();
let innovationCount: number=0;
function newWeight(){
    return Math.random()*4-2;
}

function innovationCheck(Gene: Gene): number{
    let start=Gene.start;
    let target=Gene.target;

    function newInnovation(){
        this.innovationCount++;
        this.innovations[start][target]=this.innovationCount;
    }

    if(varundefined(this.innovations[start])){
        this.innovations[start]=new Array<number>();
        newInnovation();
    }
    else if(varundefined(this.innovations[start][target])){
        newInnovation();
    }
    return this.innovations[start][target];
}

declare var require: {
    <T>(path: string): T;
    (paths: string[], callback: (...modules: any[]) => void): void;
    ensure: (paths: string[], callback: (require: <T>(path: string) => T) => void) => void;
};

let nInputs: number;
let nMaxHidden: number;
let nOutputs: number;

interface config{
    hyperparameters:{
        cExcess: number, //The compatibility constant for excess genes.
        cDisjoint: number, //The compatibility constant for disjoint genes.
        cMatching: number, //The compatibility constant for matching genes.
        deltaThreshold: number, //The compatibility threshold.
        cSmallGenome: number,//The maximum number of genes a genome can have to be considered small.
        cCull: number, //The fraction of its population a species will be culled to.
        pCrossover: number, //The probability that two parents will crossover before mutating.
        pDisable: number, //The probability a gene will be disabled if it's disabled in either parent.
        pPerturb: number, //The probability a genome will have its connection weights perturbed.
        pPerturbUniform: number, //If a weight is to be perturbed, it will either be uniformly perturbed or set to a new value.
        pLink: number, //The probability of adding a new link during mutation.
        pNeuron: number, //The probability of adding a new neuron during mutation.
        pKeepNotFit: number //Keep the matching Gene from the least fit Organism during crossover.
    }
}
let cfg: config=require("../data/config.json");

enum neuronPlace{
    INPUT=1,
    HIDDEN=2,
    OUTPUT=3
}

enum neuronType{
    BIAS=-1,
    NULL=0,
    SENSOR=1,
    NEURON=2
}

class Neuron{
    id: number;
    type: neuronType;
    place: neuronPlace;
    value: number=0;
    frame: number=0;
    linksIn: Array<Link>=[];

    constructor(what: neuronType, where: neuronPlace){
        this.type=what;
        this.place=where;
    }

    activation(){
        this.value=2/(1+Math.exp(-4.9*this.value))-1;
        return this.value;
    }
}

class Link{
    start: number;
    target: number;
    weight: number;

    constructor(s, t, w){
        this.start=s;
        this.target=t;
        this.weight=w;
    }
}

class Network{
    neurons: Array<Neuron>;
    frame: number=0;

    constructor(){
        this.neurons=Array<Neuron>();
        this.neurons[0]=new Neuron(neuronType.BIAS,neuronPlace.INPUT);
        this.neurons[0].value=1;

        for(let i=1; i<=nInputs; i++){
            this.neurons[i]=new Neuron(neuronType.SENSOR,neuronPlace.INPUT);
        }

        for(let o=1; o<=nOutputs; o++){
            this.neurons[nMaxHidden+nInputs+o]=new Neuron(neuronType.NEURON,neuronPlace.OUTPUT);
        }
    }

    pushLink(start, target, weight){
        let s=this.neurons[start];
        let t=this.neurons[target];

        if(varundefined(s)){
            s=new Neuron(neuronType.NEURON, neuronPlace.HIDDEN);
        }
        if(varundefined(t)){
            t=new Neuron(neuronType.NEURON, neuronPlace.HIDDEN);
        }

        t.linksIn.push(new Link(start, target, weight));

        this.neurons[start]=s;
        this.neurons[target]=t;
    }

    private propagate(index: number): number{ //Calculates and returns the value of a neuron.
        if(this.neurons[index].place==neuronPlace.INPUT || this.neurons[index].frame==this.frame){
            return this.neurons[index].value;
        }
        else{
            let sum=0;
            this.neurons[index].frame=this.frame;
            for(let val of this.neurons[index].linksIn){
                sum+=val.weight*this.propagate(val.start);
            }
            this.neurons[index].value=sum;

            return this.neurons[index].activation();
        }
    }

    run(inputs: Array<number>): Array<number>{
        this.frame++;

        if(inputs.length!=nInputs){
            console.log("Invalid number of inputs given during network execution.");
            return ;
        }

        for(let i=1; i<=nInputs; i++){
            this.neurons[i].value=inputs[i-1];
        }

        let outputs=new Array<number>();
        for(let o=1; o<=nOutputs; o++){
            let current=nInputs+nMaxHidden+o;
            outputs.push(this.propagate(current));
        }

        return outputs;
    }
}

class Gene{
    innovation: number;
    start: number;
    target: number;
    weight: number;
    enabled: boolean;

    constructor(s: number, t: number, w: number, e: boolean){
        this.start=s;
        this.target=t;
        this.weight=w;
        this.enabled=e;
        this.innovation=innovationCheck(this);
    }

    perturb(){
        if(Math.random()<cfg.hyperparameters.pPerturbUniform){
            this.weight*=Math.random();
        }
        else{
            this.weight=newWeight();
        }
    }
}

class Organism{
    genome: Array<Gene>=[];
    maxNeuron: number=0;
    innovationMin: number=Infinity;
    innovationMax: number=-Infinity;
    fitness: number;
    adjFitness: number;
    phenome: Network;

    sort(){
        function compare(a,b){
            return a.innovation-b.innovation;
        }
        this.genome.sort(compare);
    }

    pushGene(gene: Gene){
        this.innovationMin=Math.min(this.innovationMin, gene.innovation);
        this.innovationMax=Math.max(this.innovationMax, gene.innovation);
        this.genome.push(gene);
    }

    crossover(other: Organism): Organism{
        if(this.fitness>other.fitness){
            var p1: Organism=this;
            var p2: Organism=other;
        }
        else{
            var p1: Organism=other;
            var p2: Organism=this;
        }

        let child=new Organism();

        let match=new Array<Gene>();
        for(let val of p2.genome){
            match[val.innovation]=val;
        }

        for(let val of p1.genome){
            let push: Gene=val;
            if(!varundefined(match[val.innovation])){
                if(Math.random()<cfg.hyperparameters.pKeepNotFit){
                    push=match[val.innovation];
                }
                push.enabled=!((!val.enabled || !match[val.innovation].enabled)&&Math.random()<cfg.hyperparameters.pDisable);
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

    compatibility(other: Organism): number{
        let dis=0;
        let exc=0;
        let mat=0;
        let wDif=0;

        let exists=new Array<number>();
        let matching=new Array<boolean>();

        for(let val of other.genome){
            exists[val.innovation]=val.weight;
        }

        for(let val of this.genome){
            if(val.innovation<other.innovationMin || val.innovation>other.innovationMax){
                exc++;
            }
            else{
                if(varundefined(exists[val.innovation])){
                    dis++;
                }
                else{
                    wDif+=Math.abs(val.weight-exists[val.innovation]);
                    mat++;
                    matching[val.innovation]=true;
                }
            }
        }
        for(let val of other.genome){
            if(val.innovation<this.innovationMin || val.innovation>this.innovationMax){
                exc++;
            }
            else if(matching[val.innovation]!=true){
                dis++;
            }
        }

        let maxlen=Math.max(this.genome.length, other.genome.length);
        let N=(maxlen>cfg.hyperparameters.cSmallGenome)? maxlen : 1;
        return (cfg.hyperparameters.cDisjoint*dis/N)+(cfg.hyperparameters.cExcess*exc/N)+(cfg.hyperparameters.cMatching*wDif/mat);
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

    private addLink(s: number, t: number, weight){
        let gene=new Gene(s, t, weight, true);
        this.pushGene(gene);
    }

    /* Insertion sort addLink for the alternate crossover method.
    private addLink(s: number, t: number){
        let gen=new Gene(s, t, newWeight(), true);
        let i=this.genome.length-1;
        while(i>0 && this.genome[i]<this.genome[i-1]){
            swap(this.genome[i],this.genome[i-1]); //Check if swap actually changes anything in the array
            i--;
        }
    }
    */

    private randomNeuron(notInput: boolean): number{
        let count=0;
        let exists=new Array<boolean>();

        if(!notInput){
            for(let i=0; i<nInputs; i++){
                exists[i]=true;
                count++;
            }
        }

        for(let o=1; o<nOutputs; o++){
            exists[nMaxHidden+o]=true;
            count++;
        }

        for(let val of this.genome){
            if(!(val.start<=nInputs && notInput)){
                if(!exists[val.start]) count++;
                exists[val.start]=true;
            }

            if(!(val.target<=nInputs && notInput)){
                if(!exists[val.target]) count++;
                exists[val.target]=true;
            }
        }

        let index=randInt(0, count);
        for(let val in exists){
            index--;
            if(index==0){
                return parseInt(val);
            }
        }
    }

    private addNeuron(index: number){
        this.genome[index].enabled=false;
        this.maxNeuron++;
        this.addLink(this.genome[index].start,this.maxNeuron,this.genome[index].weight);
        this.addLink(this.maxNeuron,this.genome[index].target,1);
    }

    private perturbLinks(){
        for(let val of this.genome){
            val.perturb();
        }
    }

    mutate(){
        if(Math.random()<cfg.hyperparameters.pPerturb){
            this.perturbLinks();
        }

        if(Math.random()<cfg.hyperparameters.pLink){
            let n2=this.randomNeuron(true);
            let n1=this.randomNeuron(false);
            this.addLink(n1, n2, newWeight);
        }

        if(Math.random()<cfg.hyperparameters.pNeuron){
            this.addNeuron(randInt(0,this.genome.length-1));
        }
    }

    generate(){
        this.phenome=new Network;

        for(let val of this.genome){
            if(val.enabled){
                this.phenome.pushLink(val.start,val.target,val.weight);
            }
        }
    }

    getFitness(){
        if(varundefined(this.fitness)){
            if(varundefined(this.phenome)){
                this.generate();
            }
            this.evaluate();
        }

        return this.fitness;
    }

    evaluate(){
        let outputsConnected=false;

        for(let o=1; o<=nOutputs; o++){
            if(this.phenome.neurons[nMaxHidden+nInputs+o].linksIn.length>0){
                outputsConnected=true;
                break;
            }
        }

        if(outputsConnected){

        }
        else{
            this.fitness=0;
        }

        delete this.phenome;
    }
}

class Species{
    members: Array<Organism>;
    sumFitness: number;

    cull(){
        function compare(a,b){
            return a.fitness-b.fitness;
        }
        this.members.sort(compare);
        let len=this.members.length;
        while(this.members.length>cfg.hyperparameters.cCull*len){
            this.members.pop();
        }
    }

    breed(){
        let child: Organism;
        if(Math.random()<cfg.hyperparameters.pCrossover){
            let p1=this.members[randInt(0,this.members.length-1)];
            let p2=this.members[randInt(0,this.members.length-1)];
            if(p1==p2){
                child=p1;
            }
            else{
                child=p1.crossover(p2);
            }
        }
        else{
            child=this.members[randInt(0,this.members.length-1)];
        }

        child.mutate();
        return child;
    }
}


class Pool{
    species: Array<Species>=[];
    generation: number;

    constructor(inputs: number, maxHidden: number, outputs: number){
        nInputs=inputs;
        nMaxHidden=maxHidden;
        nOutputs=outputs;
    }
}
