import * as neural from "./modules/Network";
import * as help from "./modules/Helper";

interface gene{
    innovation: number;
    start: number;
    target: number;
    weight: number;
    enabled: boolean;
};

let net: neural.Network;

module.exports = function(genome: Array<gene>, inputs: number, maxHidden: number, outputs: number, callback){
    net = new neural.Network(inputs, maxHidden, outputs);
    net.generate(genome);

    let outputsConnected = false;
    for (let o = 1; o <= outputs; o++) {
        if (net.neurons[inputs + maxHidden + o].linksIn.length > 0) {
            outputsConnected = true;
            break;
        }
    }

    if(outputsConnected){
        callback(go());
    }
    else{
        callback(-Infinity);
    }

    return;
};

function go(): number{
    let out = net.run([2]);
    let fitness = 5/Math.abs(out[0]-4);
    return out[0];
}
