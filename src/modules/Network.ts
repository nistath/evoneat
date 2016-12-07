import * as hlp from "./Helper";

let neuronActivation = (x) => 2 / (1 + Math.exp(-4.9 * x)) - 1;

export class Network {
	private neurons: Array<Neuron>;
	private frame: number = 0;
	inputs: number;
	private maxHidden: number;
	outputs: number;

	constructor(inputs: number, maxHidden: number, outputs: number) {
		this.neurons = Array<Neuron>();
		this.neurons[0] = new Neuron(neuronType.BIAS, neuronPlace.INPUT);
		this.neurons[0].value = 1;
		this.inputs = inputs;
		this.maxHidden = maxHidden;
		this.outputs = outputs;

		for (let i = 1; i <= this.inputs; i++) {
			this.neurons[i] = new Neuron(neuronType.SENSOR, neuronPlace.INPUT);
		}

		for (let o = 0; o <= this.outputs; o++) {
			this.neurons[this.inputs + this.maxHidden + 1 + o] = new Neuron(neuronType.NEURON, neuronPlace.OUTPUT);
		}
	}

	addLink(start, target, weight) {
		let s = this.neurons[start];
		let t = this.neurons[target];

		if (hlp.isundef(s)) {
			s = new Neuron(neuronType.NEURON, neuronPlace.HIDDEN);
		}
		if (hlp.isundef(t)) {
			t = new Neuron(neuronType.NEURON, neuronPlace.HIDDEN);
		}

		t.linksIn.push(new Link(start, target, weight));

		this.neurons[start] = s;
		this.neurons[target] = t;
	}

	outputsConnected(): boolean {
		for (let o = 1; o <= this.outputs; o++) {
			if (this.neurons[this.maxHidden + this.inputs + o].linksIn.length > 0) {
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

		if (inputs.length != this.inputs) {
			console.log("Invalid number of inputs given during network execution.");
			return;
		}

		for (let i = 1; i <= this.inputs; i++) {
			this.neurons[i].value = inputs[i - 1];
		}

		let outputs = new Array<number>();
		for (let o = 1; o <= this.outputs; o++) {
			let current = this.inputs + this.maxHidden + o;
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
		this.value = 2 / (1 + Math.exp(-4.9 * this.value)) - 1;
		return this.value;
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
