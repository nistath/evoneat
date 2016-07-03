let nInputs=5;
let nMaxHidden=40;
let nOutputs=4;

let cExcess=1.0;
let cDisjoint=1.0;
let cMatching=0.4;
let cSmallGenome=20;
let cCull=0.2;
let cCrossover=0.75;
let deltaThreshold=10;
let pDisable=0.75;
let pPerturb=0.8;
let pPerturbUniform=0.9; //If a weight is to be perturbed, it will either be uniformly perturbed or set to a new value.
let pLink=0.2;
let pNode=0.1;
let pKeepNotFit=0.5; //Keep the matching gene from the leasdt fit organism during crossover.

let inputs=5;

function newWeight(){
    return Math.random()*4-2;
}

let innovations=new Array<Array<number>>();
let innovationCount: number=0;

function innovationCheck(gene: gene): number{
    let start=gene.start;
    let end=gene.end;

    if(this.innovations[start][end]===null || this.innovations[start][end]===undefined){
        this.innovationCount++;
        this.innovations[start][end]=this.innovationCount;
    }
    return this.innovations[start][end];
}

function randInt(min: number, max: number){
    return Math.floor(Math.random() * (max - min +1)) + min;
}

function swap(a: any, b: any): void{
    let temp: any=a;
    a=b;
    b=a;
}

function binarySearch(l: number, r: number, key:number, query: (n:number)=> number){
    if(l>r){
        return [l,r];
    }

    let m=Math.floor(l+(r-l)/2);
    let q=query(m);

    if(key==q){
        return m;
    }
    else if(key<q){
        return binarySearch(l,m-1,key,query);
    }
    else{
        return binarySearch(m+1,r,key,query);
    }
}

function insertionSort(){

}

enum nodePlace{
    INPUT=1,
    HIDDEN=2,
    OUTPUT=3
}

enum nodeType{
    BIAS=-1,
    NULL=0,
    SENSOR=1,
    NEURON=2
}

class node{
    id: number;
    type: nodeType;
    place: nodePlace;
    value: number=0;
    nodesIn: Array<link>;

    constructor(what: nodeType, where: nodePlace){
        this.type=what;
        this.place=where;
        this.nodesIn=new Array<link>();
    }

    sigmoid(x: number){
        return 2/(1+Math.exp(-4.9*x))-1;
    }
}

class link{
    in: node;
    out: node;
    weight: number;

    constructor(i, o, w){
        this.in=i;
        this.out=o;
        this.weight=w;
    }
}

class network{
    nodes: Array<node>;

    constructor(){
        this.nodes=Array<node>();
        this.nodes[0]=new node(nodeType.BIAS,nodePlace.INPUT);

        for(let i=1; i<nInputs; i++){
            this.nodes[i]=new node(nodeType.SENSOR,nodePlace.INPUT);
        }

        for(let o=1; o<nOutputs; o++){
            this.nodes[nMaxHidden+o]=new node(nodeType.NEURON,nodePlace.OUTPUT);
        }
    }
}

class gene{
    innovation: number;
    start: number;
    end: number;
    weight: number;
    enabled: boolean;

    constructor(s: number, t: number, w: number, e: boolean){
        this.start=s;
        this.end=t;
        this.weight=w;
        this.enabled=e;
        this.innovation=innovationCheck(this);
    }

    perturb(){
        if(Math.random()<pPerturb){
            if(Math.random()<pPerturbUniform){
                this.weight*=Math.random();
            }
            else{
                this.weight=newWeight();
            }
        }
    }
}

class organism{
    genome: Array<gene>=[];
    innovationMin: number;
    innovationMax: number;
    fitness: number=0;
    adjFitness: number=0;
    phenome: network;

    sort(){
        function compare(a,b){
            return a.innovation-b.innovation;
        }
        this.genome.sort(compare);
    }

    crossover(other: organism): organism{
        let p1=this;
        let p2=other;

        if(p1.fitness<p2.fitness){
            swap(p1,p2);
        }

        let child=new organism();
        child.innovationMin=Math.min(p1.innovationMin, p2.innovationMin);
        child.innovationMax=Math.max(p1.innovationMax, p2.innovationMax);

        let match=new Array<gene>();
        for(let val of p2.genome){
            match[val.innovation]=val;
        }

        for(let val of p1.genome){
            let push: gene=val;
            if(match[val.innovation]!=undefined){
                if(Math.random()<pKeepNotFit){
                    push=match[val.innovation];
                }

                push.enabled=!((!val.enabled || !match[val.innovation].enabled)&&Math.random()<pDisable);
            }

            child.innovationMin=Math.min(child.innovationMin,push.innovation);
            child.innovationMax=Math.max(child.innovationMin,push.innovation);
            child.genome.push(push);
        }

        return child;
    }

    /* Alternate crossover method. Requires sorted by innovation genomes.
    crossover(other: organism): organism{
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
                if(!q.b.enabled && Math.random()<pDisable){//If the b gene is disabled and at a pDisable chance.
                    child.genome.push(q.b);
                }
                else{
                    child.genome.push(q.a);
                }
                i++;
                j++;
            }
            else if((q.a.innovation<q.b.innovation && !q.goa) || q.gob){
                child.genome.push(q.a);
                i++;
            }
            else if((q.a.innovation>q.b.innovation && !q.gob) || q.goa){
                child.genome.push(q.b);
                j++;
            }
        }

        return child;
    }
    */

    compatibility(other: organism): number{
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
                if(exists[val.innovation]==undefined){
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
    compatibility(other: organism){
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
        let gen=new gene(s, t, weight, true);
        this.genome.push(gen);
    }

    /* Insertion sort addLink for the alternate crossover method.
    private addLink(s: number, t: number){
        let gen=new gene(s, t, newWeight(), true);
        let i=this.genome.length-1;
        while(i>0 && this.genome[i]<this.genome[i-1]){
            swap(this.genome[i],this.genome[i-1]); //Check if swap actually changes anything in the array
            i--;
        }
    }
    */

    private randomNode(notInput: boolean): number{
        let exists=new Array<boolean>();
        let count=0;

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

            if(!(val.end<=nInputs && notInput)){
                if(!exists[val.end]) count++;
                exists[val.end]=true;
            }
        }

        let index=randInt(0,count);
        for(let val in exists){
            index--;
            if(index==0){
                return parseInt(val);
            }
        }
    }

    private addNode(index: number){
        this.genome[index].enabled=false;
        let newNode=this.randomNode(true);
        this.addLink(this.genome[index].start,newNode,this.genome[index].weight);
        this.addLink(newNode,this.genome[index].end,newWeight);
    }

    private perturbLinks(){
        for(let val of this.genome){
            val.perturb();
        }
    }

    mutate(){//TODO
        this.perturbLinks();
    }

    generate(){
        this.phenome=new network;

        for(let i=0; i<this.genome.length; i++){
            if(this.genome[i].enabled){
                let s=this.phenome.nodes[this.genome[i].start];
                let e=this.phenome.nodes[this.genome[i].end];
                let w=this.genome[i].weight;

                if(s===undefined){
                    s=new node(nodeType.NEURON, nodePlace.HIDDEN);
                }
                if(e===undefined){
                    e=new node(nodeType.NEURON, nodePlace.HIDDEN);
                }

                let lnk=new link(s, e, w);
                e.nodesIn.push(lnk);

                this.phenome.nodes[this.genome[i].start]=s;
                this.phenome.nodes[this.genome[i].end]=e;
            }
        }
    }

    evaluate(){//TODO

    }
}

class species{
    representation: organism;
    members: Array<organism>;
    sumFitness: number;

    cull(){
        function compare(a,b){
            return a.fitness-b.fitness;
        }
        this.members.sort(compare);
        let len=this.members.length;
        while(this.members.length>cCull*len){
            this.members.pop();
        }
    }

    breed(){
        let child: organism;
        if(Math.random()<cCrossover){
            let p1=this.members[randInt(0,this.members.length-1)];
            let p2=this.members[randInt(0,this.members.length-1)];

            child=p1.crossover(p2);
        }
        else{
            child=this.members[randInt(0,this.members.length-1)];
        }

        child.mutate();
        return child;
    }
}

class generation{

}
