var Gene = (function () {
    function Gene(s, t, w, e) {
        this.start = s;
        this.target = t;
        this.weight = w;
        this.enabled = e;
        this.innovation = innovationCheck(this);
    }
    Gene.prototype.perturb = function () {
        if (Math.random() < pPerturbUniform) {
            this.weight *= Math.random();
        }
        else {
            this.weight = newWeight();
        }
    };
    return Gene;
}());
