import { defaultConfig } from '../defaultConfig';
import { Config, Gene } from '../interfaces';
import { isundef } from './helper';

export class Experiment {
  private innovations = new Array<Array<number>>();
  private innovationCount: number = 0;
  public config: Config;
  public maxFit: number;

  constructor(public nInputs: number, public nMaxHidden: number, public nOutputs: number, public nPopulation: number, suppliedConfig: Config) {
    for(let id in defaultConfig) this.config[id] = suppliedConfig[id] || defaultConfig[id];
  }

  public getInnovation(gene: Gene): number {
  	if (isundef(this.innovations[gene.start])) {
  		this.innovations[gene.start] = new Array<number>();
  	}
  	else if (isundef(this.innovations[gene.start][gene.target])) {}
    else {
      return this.innovations[gene.start][gene.target]
    }

    this.innovationCount++;
  	return this.innovations[gene.start][gene.target] = this.innovationCount;
  }
}
