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
/// <reference path="modules/experiment.ts" />

//import { Experiment } from './modules/experiment';
var experiment = new Experiment(1,2,3,3);
