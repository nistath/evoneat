var nInputs = 1;
var nMaxHidden = 4;
var nOutputs = 2;
var cExcess = 1.0;
var cDisjoint = 1.0;
var cMatching = 0.4;
var cSmallGenome = 20;
var cCull = 0.2;
var deltaThreshold = 10;
var pCrossover = 0.75;
var pDisable = 0.75;
var pPerturb = 0.8;
var pPerturbUniform = 0.9;
var pLink = 0.2;
var pNeuron = 0.1;
var pKeepNotFit = 0.5;
var inputs = 5;
function newWeight() {
    return Math.random() * 4 - 2;
}
var Pool = (function () {
    function Pool() {
        this.innovations = new Array();
        this.innovationCount = 0;
    }
    Pool.prototype.innovationCheck = function (Gene) {
        var start = Gene.start;
        var target = Gene.target;
        function newInnovation() {
            this.innovationCount++;
            this.innovations[start][target] = this.innovationCount;
        }
        if (this.innovations[start] === null || this.innovations[start] === undefined) {
            this.innovations[start] = new Array();
            newInnovation();
        }
        else if (this.innovations[start][target] === null || this.innovations[start][target] === undefined) {
            newInnovation();
        }
        return this.innovations[start][target];
    };
    return Pool;
}());
