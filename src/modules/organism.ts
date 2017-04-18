class Organism {
	genome: Array<Gene> = [];
	geneList: Array<boolean> = [];
	maxNeuron: number;
	innovationMin: number = Infinity;
	innovationMax: number = -Infinity;
	fitness: number = 0;
	phenome: Network;

	constructor() {
		this.maxNeuron = experiment.nInputs + experiment.nOutputs;
	}

	clone() {
		let clone = new Organism();
		clone.maxNeuron = this.maxNeuron;
		clone.innovationMin = this.innovationMin;
		clone.innovationMax = this.innovationMax;
		clone.fitness = this.fitness;
		clone.phenome = this.phenome;

		for (let i in this.geneList) {
			clone.geneList[i] = this.geneList[i];
		}

		for (let i in this.genome) {
			clone.genome[i] = this.genome[i].clone();
		}

		return clone;
	}
	sortGenome() {
		this.genome.sort((a, b) => a.innovation - b.innovation);
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
		let p1: Organism = this;
		let p2: Organism = other;
		if (this.getFitness() > other.getFitness()) {
			p1 = this;
			p2 = other;
		}
		else {
			p1 = other;
			p2 = this;
		}

		let child = new Organism();

		let match = new Array<Gene>();
		for (let val of p2.genome) {
			match[val.innovation] = val;
		}

		for (let val of p1.genome) {
			let push: Gene = val;
			if (!isundef(match[val.innovation])) {
				if (Math.random() < experiment.config.pKeepNotFit) {
					push = match[val.innovation];
				}
				push.enabled = !((!val.enabled || !match[val.innovation].enabled) && Math.random() < experiment.config.pDisable);
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
				if (isundef(exists[val.innovation])) {
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
		let N = (maxlen > experiment.config.cSmallGenome) ? maxlen : 1;
		return (experiment.config.cDisjoint * dis / N) + (experiment.config.cExcess * exc / N) + (experiment.config.cMatching * wDif / mat);
	}

	compatible(other: Organism) {
		return this.compatibility(other) < experiment.config.deltaThreshold
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
		let gen=new Gene(s, t, experiment.config.newWeight(), true);
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
			for (let i = 0; i <= experiment.nInputs; i++) {
				exists[i] = true;
				count++;
			}
		}

		for (let o = 0; o < experiment.nOutputs; o++) {
			exists[experiment.nInputs + experiment.nMaxHidden + 1 + o] = true;
			count++;
		}

		for (let val of this.genome) {
			if (!(val.start <= experiment.nInputs && notInput) && val.start < experiment.nInputs + experiment.nMaxHidden + experiment.nOutputs) {
				if (!exists[val.start]) count++;
				exists[val.start] = true;
			}

			if (!(val.target <= experiment.nInputs && notInput) && val.target < experiment.nInputs + experiment.nMaxHidden + experiment.nOutputs) {
				if (!exists[val.target]) count++;
				exists[val.target] = true;
			}
		}

		let index = randInt(1, count);
		for (let val in exists) {
			index--;
			if (index == 0) {
				return parseInt(val);
			}
		}
		return 0; //Failsafe...
	}

	private addNeuron(index: number) {
		if (!isundef(this.genome[index]) && this.maxNeuron < experiment.nInputs + experiment.nOutputs + experiment.nMaxHidden) {
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

		if (n1 <= experiment.nInputs + experiment.nMaxHidden + experiment.nOutputs && n2 <= experiment.nInputs + experiment.nMaxHidden + experiment.nOutputs)
			this.addLink(n1, n2, experiment.config.newWeight());
	}

	mutate() {
		if (Math.random() < experiment.config.pPerturb)
			this.perturbLinks();

		if (Math.random() < experiment.config.pLink)
			this.addRandomLink();

		if (Math.random() < experiment.config.pNeuron) {
			this.addNeuron(randInt(0, this.genome.length - 1));
		}
	}

	operate(callback) { // TODO
		this.generate();
		this.evaluate(callback);
	}

	generate() {
		this.phenome = new Network();

		for (let gene of this.genome) {
			if (gene.enabled) {
				this.phenome.addLink(gene.start, gene.target, gene.weight);
			}
		}
	}

	getFitness() {
		return this.fitness;
	}

	evaluate(callback) {
		if (this.phenome.outputsConnected()) {
			//Run evaluator.
			let res = this.phenome.run([1]);
			let res2 = this.phenome.run([-1]);
			let res3 = this.phenome.run([0]);
			this.fitness = 3 / (Math.pow(res[0] + 0.25, 2) + Math.pow(res2[0] - 0.5, 2) + Math.pow(res3[0], 2));

			if (this.fitness > experiment.maxFit) {
				console.log("fit" + this.fitness);
				experiment.maxFit = this.fitness;
				console.log(res[0]);
				console.log(res2[0]);
				console.log(res3[0]);
			}
		}
		else {
			this.fitness = 1;
		}

		delete this.phenome;

		callback();
	}
}
