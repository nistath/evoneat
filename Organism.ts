class Organism{
    genome: Array<Gene>=[];
    maxNeuron: number=0;
    innovationMin: number=Infinity;
    innovationMax: number=-Infinity;
    fitness: number;
    adjFitness: number=0;
    phenome: Network;

    sort(){
        function compare(a,b){
            return a.innovation-b.innovation;
        }
        this.genome.sort(compare);
    }

    pushGene(gene: Gene){
        this.innovationMin=Math.min(this.innovationMin, gene.innovation);
        this.innovationMax=Math.max(this.innovationMax, gene.innovation);
        this.genome.push(gene);
    }

    crossover(other: Organism): Organism{
        if(this.fitness>other.fitness){
            var p1: Organism=this;
            var p2: Organism=other;
        }
        else{
            var p1: Organism=other;
            var p2: Organism=this;
        }

        let child=new Organism();

        let match=new Array<Gene>();
        for(let val of p2.genome){
            match[val.innovation]=val;
        }

        for(let val of p1.genome){
            let push: Gene=val;
            if(match[val.innovation]!==undefined){
                if(Math.random()<pKeepNotFit){
                    push=match[val.innovation];
                }
                push.enabled=!((!val.enabled || !match[val.innovation].enabled)&&Math.random()<pDisable);
            }
            child.pushGene(push);
        }

        return child;
    }

    /* Alternate crossover method. Requires sorted, by innovation, genomes.
    crossover(other: Organism): Organism{
        let i=0;
        let j=0;

        for(;;){
            let l=false;
            let k=false;
            if(i>=p1.genome.length){
                i=p1.genome.length-1;
                l=true;
            }
            if(j>=p2.genome.length){
                j=p2.genome.length-1;
                k=true;
            }
            let q={a: p1.genome[i], b: p2.genome[j], goa: l, gob: k};

            if(q.goa && q.gob) break;
            if(q.a.innovation==q.b.innovation){
                if(!q.b.enabled && Math.random()<pDisable){//If the b Gene is disabled and at a pDisable chance.
                    child.pushGene(q.b);
                }
                else{
                    child.pushGene(q.a);
                }
                i++;
                j++;
            }
            else if((q.a.innovation<q.b.innovation && !q.goa) || q.gob){
                child.pushGene(q.a);
                i++;
            }
            else if((q.a.innovation>q.b.innovation && !q.gob) || q.goa){
                child.pushGene(q.b);
                j++;
            }
        }

        return child;
    }
    */

    compatibility(other: Organism): number{
        let dis=0;
        let exc=0;
        let mat=0;
        let wDif=0;

        let exists=new Array<number>();
        let matching=new Array<boolean>();

        for(let val of other.genome){
            exists[val.innovation]=val.weight;
        }

        for(let val of this.genome){
            if(val.innovation<other.innovationMin || val.innovation>other.innovationMax){
                exc++;
            }
            else{
                if(exists[val.innovation]===undefined){
                    dis++;
                }
                else{
                    wDif+=Math.abs(val.weight-exists[val.innovation]);
                    mat++;
                    matching[val.innovation]=true;
                }
            }
        }
        for(let val of other.genome){
            if(val.innovation<this.innovationMin || val.innovation>this.innovationMax){
                exc++;
            }
            else if(matching[val.innovation]!=true){
                dis++;
            }
        }

        let maxlen=Math.max(this.genome.length, other.genome.length);
        let N=(maxlen>cSmallGenome)? maxlen : 1;
        return (cDisjoint*dis/N)+(cExcess*exc/N)+(cMatching*wDif/mat);
    }

    /*Compatibility function for alternate method.
    compatibility(other: Organism){
        let i=0;
        let j=0;
        let dis=0;
        let exc=0;
        let mat=0;
        let wDif=0;

        let excuntilnow=true;
        for(;;){
            if(i>=this.genome.length-1 || j>=other.genome.length-1) break;
            if(this.genome[i].innovation==other.genome[j].innovation){
                excuntilnow=false;
                i++;
                j++;
                mat++;
                wDif+=Math.abs(this.genome[i].weight-other.genome[j].weight);
            }
            else if(this.genome[i].innovation<other.genome[j].innovation){
                i++;
                if(excuntilnow){
                    exc++;
                }
                else{
                    dis++;
                }
            }
            else if(this.genome[i].innovation>other.genome[j].innovation){
                j++;
                if(excuntilnow){
                    exc++;
                }
                else{
                    dis++;
                }
            }
        }
        exc+=(i>=this.genome.length)? other.genome.length-j+1 : this.genome.length-i+1;

        let maxlen=Math.max(this.genome.length, other.genome.length);
        let N=(maxlen>cSmallGenome)? maxlen : 1;
        return (cDisjoint*dis/N)+(cExcess*exc/N)+(cMatching*wDif/mat);
    }
    */

    private addLink(s: number, t: number, weight){
        let gene=new Gene(s, t, weight, true);
        this.pushGene(gene);
    }

    /* Insertion sort addLink for the alternate crossover method.
    private addLink(s: number, t: number){
        let gen=new Gene(s, t, newWeight(), true);
        let i=this.genome.length-1;
        while(i>0 && this.genome[i]<this.genome[i-1]){
            swap(this.genome[i],this.genome[i-1]); //Check if swap actually changes anything in the array
            i--;
        }
    }
    */

    private randomNeuron(notInput: boolean): number{
        let count=0;
        let exists=new Array<boolean>();

        if(!notInput){
            for(let i=0; i<nInputs; i++){
                exists[i]=true;
                count++;
            }
        }

        for(let o=1; o<nOutputs; o++){
            exists[nMaxHidden+o]=true;
            count++;
        }

        for(let val of this.genome){
            if(!(val.start<=nInputs && notInput)){
                if(!exists[val.start]) count++;
                exists[val.start]=true;
            }

            if(!(val.target<=nInputs && notInput)){
                if(!exists[val.target]) count++;
                exists[val.target]=true;
            }
        }

        let index=randInt(0, count);
        for(let val in exists){
            index--;
            if(index==0){
                return parseInt(val);
            }
        }
    }

    private addNeuron(index: number){
        this.genome[index].enabled=false;
        this.maxNeuron++;
        this.addLink(this.genome[index].start,this.maxNeuron,this.genome[index].weight);
        this.addLink(this.maxNeuron,this.genome[index].target,1);
    }

    private perturbLinks(){
        for(let val of this.genome){
            val.perturb();
        }
    }

    mutate(){
        if(Math.random()<pPerturb){
            this.perturbLinks();
        }

        if(Math.random()<pLink){
            let n2=this.randomNeuron(true);
            let n1=this.randomNeuron(false);
            this.addLink(n1, n2, newWeight);
        }

        if(Math.random()<pNeuron){
            this.addNeuron(randInt(0,this.genome.length-1));
        }
    }

    generate(){
        this.phenome=new Network;

        for(let val of this.genome){
            if(val.enabled){
                let s=this.phenome.neurons[val.start];
                let t=this.phenome.neurons[val.target];
                let w=val.weight;

                if(s===undefined){
                    s=new Neuron(neuronType.NEURON, neuronPlace.HIDDEN);
                }
                if(t===undefined){
                    t=new Neuron(neuronType.NEURON, neuronPlace.HIDDEN);
                }

                t.linksIn.push(new Link(val.start, val.target, w));

                this.phenome.neurons[val.start]=s;
                this.phenome.neurons[val.target]=t;
            }
        }
    }

    getFitness(){
        if(this.fitness===undefined || this.fitness===null){
            if(this.phenome===undefined || this.phenome===null){
                this.generate();
            }
            this.evaluate();
        }

        return this.fitness;
    }

    evaluate(){
        let outputsConnected=false;

        for(let o=1; o<=nOutputs; o++){
            if(this.phenome.neurons[nMaxHidden+nInputs+o].linksIn.length>0){
                outputsConnected=true;
                break;
            }
        }

        if(outputsConnected){

        }

        delete this.phenome;
    }
}
