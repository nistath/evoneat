import { isundef } from './helper';
import { Experiment } from './experiment';

let neuronActivation: (x: number) => number;

export class Network {
	private neurons: Array<Neuron>;
	private frame: number = 0;

	constructor(private experiment: Experiment) {
		this.neurons = Array<Neuron>();
		this.neurons[0] = new Neuron(neuronType.BIAS, neuronPlace.INPUT);
		this.neurons[0].value = 1;
		neuronActivation = this.experiment.config.neuronActivation;

		for (let i = 1; i <= this.experiment.nInputs; i++) {
			this.neurons[i] = new Neuron(neuronType.SENSOR, neuronPlace.INPUT);
		}

		for (let o = 0; o <= this.experiment.nOutputs; o++) {
			this.neurons[this.experiment.nInputs + this.experiment.nMaxHidden + 1 + o] = new Neuron(neuronType.NEURON, neuronPlace.OUTPUT);
		}
	}

	addLink(start, target, weight) {
		let s = this.neurons[start];
		let t = this.neurons[target];

		if (isundef(s)) {
			s = new Neuron(neuronType.NEURON, neuronPlace.HIDDEN);
		}
		if (isundef(t)) {
			t = new Neuron(neuronType.NEURON, neuronPlace.HIDDEN);
		}

		t.linksIn.push(new Link(start, target, weight));

		this.neurons[start] = s;
		this.neurons[target] = t;
	}

	outputsConnected(): boolean {
		for (let o = 1; o <= this.experiment.nOutputs; o++) {
			if (this.neurons[this.experiment.nMaxHidden + this.experiment.nInputs + o].linksIn.length > 0) {
				return true;
			}
		}

		return false;
	}

	private propagate(index: number): number { //Calculates and returns the value of a neuron.
		if (this.neurons[index].place == neuronPlace.INPUT || this.neurons[index].frame == this.frame) {
			return this.neurons[index].value;
		}
		else {
			let sum = 0;
			this.neurons[index].frame = this.frame;
			for (let val of this.neurons[index].linksIn) {
				sum += val.weight * this.propagate(val.start);
			}
			this.neurons[index].value = sum;

			if (this.neurons[index].place == neuronPlace.OUTPUT) {
				return this.neurons[index].value;
			}
			else {
				return this.neurons[index].activation();
			}
		}
	}

	run(inputs: Array<number>): Array<number> {
		this.frame++;

		if (inputs.length != this.experiment.nInputs) {
			throw new Error("Invalid number of this.experiment.nInputs given during network execution.");
		}

		for (let i = 1; i <= this.experiment.nInputs; i++) {
			this.neurons[i].value = this.experiment.nInputs[i - 1];
		}

		let outputs = new Array<number>();
		for (let o = 1; o <= this.experiment.nOutputs; o++) {
			let current = this.experiment.nInputs + this.experiment.nMaxHidden + o;
			outputs.push(this.propagate(current));
		}

		return outputs;
	}
}

enum neuronPlace {
	INPUT = 1,
	HIDDEN = 2,
	OUTPUT = 3
}

enum neuronType {
	BIAS = -1,
	NULL = 0,
	SENSOR = 1,
	NEURON = 2
}

class Neuron {
	id: number;
	type: neuronType;
	place: neuronPlace;
	value: number = 0;
	frame: number = 0;
	linksIn: Array<Link> = [];

	constructor(what: neuronType, where: neuronPlace) {
		this.type = what;
		this.place = where;
	}

	activation() {
		return this.value = neuronActivation(this.value);
	}
}

class Link {
	start: number;
	target: number;
	weight: number;

	constructor(s, t, w) {
		this.start = s;
		this.target = t;
		this.weight = w;
	}
}
