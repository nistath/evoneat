import config from "../data/config.ts";

class Pool{
    species: Array<Species>;
    generation: number;

    innovations=new Array<Array<number>>();
    innovationCount: number=0;

    nInputs: number;
    nMaxHidden: number;
    nOutputs: number;

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


    constructor(inputs: number, maxHidden: number, outputs: number){
        this.nInputs=inputs;
        this.nMaxHidden=maxHidden;
        this.nOutputs=outputs;

        var hyperparams=config.hyperparameters;
    }

    newWeight(){
        return Math.random()*4-2;
    }

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
