var Species = (function () {
    function Species() {
    }
    Species.prototype.cull = function () {
        function compare(a, b) {
            return a.fitness - b.fitness;
        }
        this.members.sort(compare);
        var len = this.members.length;
        while (this.members.length > cCull * len) {
            this.members.pop();
        }
    };
    Species.prototype.breed = function () {
        var child;
        if (Math.random() < pCrossover) {
            var p1 = this.members[randInt(0, this.members.length - 1)];
            var p2 = this.members[randInt(0, this.members.length - 1)];
            if (p1 == p2) {
                child = p1;
            }
            else {
                child = p1.crossover(p2);
            }
        }
        else {
            child = this.members[randInt(0, this.members.length - 1)];
        }
        child.mutate();
        return child;
    };
    return Species;
}());
