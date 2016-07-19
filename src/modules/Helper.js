"use strict";
function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
exports.randInt = randInt;
function randEntry(arr) {
    return arr[randInt(0, arr.length - 1)];
}
exports.randEntry = randEntry;
function varundefined(val) {
    return val === undefined || val === null;
}
exports.varundefined = varundefined;
function shufflearr(a) {
    let j, x, i;
    for (i = a.length; i; i--) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
}
exports.shufflearr = shufflearr;
