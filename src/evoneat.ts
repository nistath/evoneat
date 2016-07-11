let nInputs=1;
let nMaxHidden=4;
let nOutputs=2;

let cExcess=1.0;
let cDisjoint=1.0;
let cMatching=0.4;
let cSmallGenome=20;
let cCull=0.2;
let deltaThreshold=10;
let pCrossover=0.75;
let pDisable=0.75;
let pPerturb=0.8;
let pPerturbUniform=0.9; //If a weight is to be perturbed, it will either be uniformly perturbed or set to a new value.
let pLink=0.2;
let pNeuron=0.1;
let pKeepNotFit=0.5; //Keep the matching Gene from the least fit Organism during crossover.

let inputs=5;

function newWeight(){
    return Math.random()*4-2;
}


class Pool{
    species: Array<Species>;
    generation: number;

    innovations=new Array<Array<number>>();
    innovationCount: number=0;

    innovationCheck(Gene: Gene): number{
        let start=Gene.start;
        let target=Gene.target;

        function newInnovation(){
            this.innovationCount++;
            this.innovations[start][target]=this.innovationCount;
        }

        if(this.innovations[start]===null || this.innovations[start]===undefined){
            this.innovations[start]=new Array<number>();
            newInnovation();
        }
        else if(this.innovations[start][target]===null || this.innovations[start][target]===undefined){
            newInnovation();
        }
        return this.innovations[start][target];
    }
}
