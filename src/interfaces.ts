export interface config {
	backup: number,
	evaluatorPath: string,
	cExcess: number, //The compatibility constant for excess genes.
	cDisjoint: number, //The compatibility constant for disjoint genes.
	cMatching: number, //The compatibility constant for matching genes.
	deltaThreshold: number, //The compatibility threshold.
	cSmallGenome: number, //The maximum number of genes a genome can have to be considered small.
	cSmallSpecies: number, //The number of members a species has in order to be considered small.
	cStagnantSpecies: number, //The number of generations a species must remain static, in order to become stagnant.
	cTopSpecies: number, //The minimum number of species (cannot be killed by being stagnant).
	cCull: number, //The fraction of its population a species will be culled to.
	pCrossover: number, //The probability that two parents will crossover before mutating.
	pDisable: number, //The probability a gene will be disabled if it's disabled in either parent.
	pPerturb: number, //The probability a genome will have its connection weights perturbed.
	pPerturbUniform: number, //If a weight is to be perturbed, it will either be uniformly perturbed or set to a new value.
	pLink: number, //The probability of adding a new link during mutation.
	pNeuron: number, //The probability of adding a new neuron during mutation.
	pKeepNotFit: number, //Keep the matching Gene from the least fit Organism during crossover.
	newWeight: () => number, //The weight a new gene will spawn with.
	neuronActivation: (number) => number //The default activation function for all neurons.
}
