"use strict";
const neural = require("./modules/Network");
;
let net;
module.exports = function (genome, inputs, maxHidden, outputs, callback) {
    net = new neural.Network(inputs, maxHidden, outputs);
    net.generate(genome);
    let outputsConnected = false;
    for (let o = 1; o <= outputs; o++) {
        if (net.neurons[inputs + maxHidden + o].linksIn.length > 0) {
            outputsConnected = true;
            break;
        }
    }
    if (outputsConnected) {
        callback(go());
    }
    else {
        callback(-Infinity);
    }
    return;
};
function go() {
    let out = net.run([2]);
    let fitness = 5 / Math.abs(out[0] - 4);
    return out[0];
}
