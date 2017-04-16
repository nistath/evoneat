import { Experiment } from './experiment';

export class Gene {
	innovation: number;

	constructor(private experiment: Experiment, public start: number,	public target: number, public weight: number, public enabled: boolean) {
		this.innovation = this.experiment.getInnovation(this);
	}

	clone() {
		let clone = new Gene(this.experiment, this.start, this.target, this.weight, this.enabled);
		clone.innovation = this.innovation;

		return clone;
	}

	perturb() {
		if (Math.random() < this.experiment.config.pPerturbUniform) {
			this.weight *= Math.random();
		}
		else {
			this.weight = this.experiment.config.newWeight();
		}
	}
}
