let nInputs=1;
let nMaxHidden=4;
let nOutputs=2;

let cExcess=1.0;
let cDisjoint=1.0;
let cMatching=0.4;
let cSmallGenome=20;
let cCull=0.2;
let cCrossover=0.75;
let deltaThreshold=10;
let pDisable=0.75;
let pPerturb=0.8;
let pPerturbUniform=0.9; //If a weight is to be perturbed, it will either be uniformly perturbed or set to a new value.
let pLink=0.2;
let pneuron=0.1;
let pKeepNotFit=0.5; //Keep the matching Gene from the least fit Organism during crossover.

let inputs=5;

function newWeight(){
    return Math.random()*4-2;
}

let innovations=new Array<Array<number>>();
let innovationCount: number=0;

function innovationCheck(Gene: Gene): number{
    let start=Gene.start;
    let target=Gene.target;

    function newInnovation(){
        innovationCount++;
        innovations[start][target]=innovationCount;
    }

    if(innovations[start]===null || innovations[start]===undefined){
        innovations[start]=new Array<number>();
        newInnovation();
    }
    else if(innovations[start][target]===null || innovations[start][target]===undefined){
        newInnovation();
    }
    return innovations[start][target];
}

function randInt(min: number, max: number){
    return Math.floor(Math.random() * (max - min +1)) + min;
}

function binarySearch(l: number, r: number, key:number, query: (n:number)=> number){
    if(l>r){
        return [l,r];
    }

    let m=Math.floor(l+(r-l)/2);
    let q=query(m);

    if(key==q){
        return m;
    }
    else if(key<q){
        return binarySearch(l,m-1,key,query);
    }
    else{
        return binarySearch(m+1,r,key,query);
    }
}

function insertionSort(){

}

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
        if(Math.random()<pPerturb){
            if(Math.random()<pPerturbUniform){
                this.weight*=Math.random();
            }
            else{
                this.weight=newWeight();
            }
        }
    }
}

class Organism{
    genome: Array<Gene>=[];
    innovationMin: number=Infinity;
    innovationMax: number=-Infinity;
    fitness: number=0;
    adjFitness: number=0;
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
            if(match[val.innovation]!==undefined){
                if(Math.random()<pKeepNotFit){
                    push=match[val.innovation];
                }
                push.enabled=!((!val.enabled || !match[val.innovation].enabled)&&Math.random()<pDisable);
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
                if(exists[val.innovation]===undefined){
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
        let N=(maxlen>cSmallGenome)? maxlen : 1;
        return (cDisjoint*dis/N)+(cExcess*exc/N)+(cMatching*wDif/mat);
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
        let exists=new Array<boolean>();
        let count=0;

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
        let newneuron=this.randomNeuron(true);
        this.addLink(this.genome[index].start,newneuron,this.genome[index].weight);
        this.addLink(newneuron,this.genome[index].target,1);
    }

    private perturbLinks(){
        for(let val of this.genome){
            val.perturb();
        }
    }

    mutate(){//TODO
        this.perturbLinks();
    }

    generate(){
        this.phenome=new Network;

        for(let val of this.genome){
            if(val.enabled){
                let s=this.phenome.neurons[val.start];
                let t=this.phenome.neurons[val.target];
                let w=val.weight;

                if(s===undefined){
                    s=new Neuron(neuronType.NEURON, neuronPlace.HIDDEN);
                }
                if(t===undefined){
                    t=new Neuron(neuronType.NEURON, neuronPlace.HIDDEN);
                }

                t.linksIn.push(new Link(val.start, val.target, w));

                this.phenome.neurons[val.start]=s;
                this.phenome.neurons[val.target]=t;
            }
        }
    }

    evaluate(){//TODO

    }
}

class species{
    members: Array<Organism>;
    sumFitness: number;

    cull(){
        function compare(a,b){
            return a.fitness-b.fitness;
        }
        this.members.sort(compare);
        let len=this.members.length;
        while(this.members.length>cCull*len){
            this.members.pop();
        }
    }

    breed(){
        let child: Organism;
        if(Math.random()<cCrossover){
            let p1=this.members[randInt(0,this.members.length-1)];
            let p2=this.members[randInt(0,this.members.length-1)];

            child=p1.crossover(p2);
        }
        else{
            child=this.members[randInt(0,this.members.length-1)];
        }

        child.mutate();
        return child;
    }
}

class Generation{

}

let a=new Organism;
var k=new Gene(1,3,0.5,true);
a.genome.push(k);
var k=new Gene(3,4,0.5,true);
a.genome.push(k);
var k=new Gene(4,2,0.5,true);
a.genome.push(k);
var k=new Gene(2,3,0.5,true);
a.genome.push(k);
var k=new Gene(4,6,0.5,true);
a.genome.push(k);

a.generate();
console.log(a.phenome.run([2]));
for(let val in a.phenome.neurons){
    console.log(val);
    console.log(a.phenome.neurons[val]);
}
console.log(a.phenome.run([2]));
for(let val in a.phenome.neurons){
    console.log(val);
    console.log(a.phenome.neurons[val]);
}
console.log(a.phenome.run([2]));
console.log(a.phenome.run([2]));
console.log(a.phenome.run([2]));
