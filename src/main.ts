//const worker = require("worker-farm");

/*
interface os {
  cpus: () => Array<any>
}

const FARM_OPTIONS = {
  maxConcurrentWorkers: <os>require('os').cpus().length, //Fix?
  maxCallsPerWorker: Infinity,
  maxConcurrentCallsPerWorker: 1
};
*/
import { Experiment } from "./modules/experiment";

let p = new Experiment(2,10,1, 20);

p.pool.loop(10);
