class Gene {
	innovation: number;

	constructor(public start: number,	public target: number, public weight: number, public enabled: boolean) {
		this.innovation = experiment.getInnovation(this);
	}

	clone() {
		let clone = new Gene(this.start, this.target, this.weight, this.enabled);
		clone.innovation = this.innovation;

		return clone;
	}

	perturb() {
		if (Math.random() < experiment.config.pPerturbUniform) {
			this.weight *= Math.random();
		}
		else {
			this.weight = experiment.config.newWeight();
		}
	}
}
