module.exports={
    evaluatorPath: "./evaluate.js",
    cExcess: 1.0 , //The compatibility constant for excess genes.
    cDisjoint: 1.0, //The compatibility constant for disjoint genes.
    cMatching: 0.4, //The compatibility constant for matching genes.
    deltaThreshold: 0.4, //The compatibility threshold.
    cSmallGenome: 20, //The maximum number of genes a genome can have to be considered small.
    cSmallSpecies: 5, //The number of members a species has in order to be considered small.
    cStagnantSpecies: 15, //The number of generations a species must remain static, in order to become stagnant.
    cCull: 0.2, //The fraction of its population a species will be culled to.
    pCrossover: 0.75, //The probability that two parents will crossover before mutating.
    pDisable: 0.75, //The probability a gene will be disabled if it's disabled in either parent.
    pPerturb: 0.8, //The probability a genome will have its connection weights perturbed.
    pPerturbUniform: 0.9, //If a weight is to be perturbed, it will either be uniformly perturbed or set to a new value.
    pLink: 0.05, //The probability of adding a new link during mutation.
    pNeuron: 0.03, //The probability of adding a new neuron during mutation.
    pKeepNotFit: 0.5, //Keep the matching Gene from the least fit Organism during crossover.
    newWeight: function(){return 4*Math.random()-2;}, //The weight a new gene will spawn with.
    neuronActivation: function(x){return 2/(1+Math.exp(-4.9*x))-1;} //The default activation function for all neurons.
}
