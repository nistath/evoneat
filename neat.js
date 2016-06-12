var cExcess = 10;
var cDisjoint = 10;
var cMatching = 10;
var deltaThreshold = 10;
function swap(a, b) {
    var temp = a;
    a = b;
    b = a;
}
function binarySearch(l, r, key, query) {
    if (l > r) {
        return null;
    }
    var m = Math.floor(l + (r - l) / 2);
    var q = query(m);
    if (key == q) {
        return m;
    }
    else if (key < q) {
        return binarySearch(l, m - 1, key, query);
    }
    else {
        return binarySearch(m + 1, r, key, query);
    }
}
var nodePlace;
(function (nodePlace) {
    nodePlace[nodePlace["INPUT"] = 1] = "INPUT";
    nodePlace[nodePlace["HIDDEN"] = 2] = "HIDDEN";
    nodePlace[nodePlace["OUTPUT"] = 3] = "OUTPUT";
})(nodePlace || (nodePlace = {}));
var nodeType;
(function (nodeType) {
    nodeType[nodeType["NULL"] = 0] = "NULL";
    nodeType[nodeType["SENSOR"] = 1] = "SENSOR";
    nodeType[nodeType["NEURON"] = 2] = "NEURON";
})(nodeType || (nodeType = {}));
var node = (function () {
    function node(what, where) {
        this.value = 0;
        this.type = what;
        this.place = where;
        this.nodesIn = new Array();
    }
    node.prototype.sigmoid = function (x) {
        return 2 / (1 + Math.exp(-4.9 * x)) - 1;
    };
    return node;
}());
var link = (function () {
    function link(i, o, w) {
        this.in = i;
        this.out = o;
        this.weight = w;
    }
    return link;
}());
var network = (function () {
    function network(inputs, maxhidden, outputs) {
        this.input = Array(inputs);
        this.hidden = Array(maxhidden);
        this.output = Array(outputs);
    }
    network.prototype.nodeRead = function (id) {
        var inlen = this.input.length;
        var hidlen = this.hidden.length;
        console.log("read");
        if (id < inlen) {
            return this.input[id];
        }
        else if (id < inlen + hidlen) {
            return this.hidden[id - inlen];
        }
        else {
            return this.output[id - (inlen + hidlen)];
        }
    };
    network.prototype.nodeWrite = function (node, id) {
        var inlen = this.input.length;
        var hidlen = this.hidden.length;
        console.log("write");
        node.id = id;
        if (id < inlen) {
            this.input[id] = node;
            return node;
        }
        else if (id < inlen + hidlen) {
            this.hidden[id - inlen] = node;
            return node;
        }
        else {
            this.output[id - (inlen + hidlen)] = node;
            return node;
        }
    };
    return network;
}());
var gene = (function () {
    function gene(i, st, en, we, n) {
        this.innovation = i;
        this.start = st;
        this.end = en;
        this.weight = we;
        this.enabled = n;
    }
    return gene;
}());
var organism = (function () {
    function organism() {
        this.genome = [];
        this.fitness = 0;
        this.adjFitness = 0;
    }
    organism.prototype.generate = function (inputs, maxhidden, outputs) {
        this.phenome = new network(inputs, maxhidden, outputs);
        var net = this.phenome;
        var seq = this.genome;
        for (var i = 0; i < inputs; i++) {
            net.nodeWrite(new node(nodeType.SENSOR, nodePlace.INPUT), i);
        }
        for (var i = 0; i < seq.length; i++) {
            if (seq[i].enabled) {
                var s = net.nodeRead(seq[i].start);
                var e = net.nodeRead(seq[i].end);
                var w = seq[i].weight;
                if (s == undefined) {
                    s = new node(nodeType.NEURON, nodePlace.HIDDEN);
                }
                if (e == undefined) {
                    e = new node(nodeType.NEURON, nodePlace.HIDDEN);
                }
                var lnk = new link(s, e, w);
                e.nodesIn.push(lnk);
                s = net.nodeWrite(s, seq[i].start);
                e = net.nodeWrite(e, seq[i].end);
                console.log(s);
                console.log(e);
                console.log(w);
            }
        }
    };
    organism.prototype.evaluate = function () {
    };
    return organism;
}());
var species = (function () {
    function species() {
    }
    return species;
}());
var generation = (function () {
    function generation() {
    }
    generation.prototype.innovationLookup = function (gene) {
        var len = this.innovations.length;
        var start = gene.start;
        var end = gene.end;
        function query(n) {
            return this.innovations[start][n].end;
        }
        var search = binarySearch(0, this.innovations[start].length, end, query);
        if (search == null) {
            return len + 1;
        }
        else {
            return this.innovations[start][search].innovation;
        }
    };
    return generation;
}());
