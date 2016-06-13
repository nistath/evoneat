let cExcess=10;
let cDisjoint=10;
let cMatching=10;
let deltaThreshold=10;

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

enum nodePlace{
    INPUT=1,
    HIDDEN=2,
    OUTPUT=3
}

enum nodeType{
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
    input: Array<node>;
    hidden: Array<node>;
    output: Array<node>;

    constructor(inputs: number, maxhidden: number, outputs: number){
        this.input=Array<node>(inputs);
        this.hidden=Array<node>(maxhidden);
        this.output=Array<node>(outputs);
    }

    nodeRead(id: number): node{
        let inlen=this.input.length;
        let hidlen=this.hidden.length;

        if(id<inlen){
            return this.input[id];
        }
        else if(id<inlen+hidlen){
            return this.hidden[id-inlen];
        }
        else{
            return this.output[id-(inlen+hidlen)];
        }
    }

    nodeWrite(node: node, id: number): node{
        let inlen=this.input.length;
        let hidlen=this.hidden.length;
        node.id=id;

        if(id<inlen){
            this.input[id]=node;
            return node;
        }
        else if(id<inlen+hidlen){
            this.hidden[id-inlen]=node;
            return node;
        }
        else{
            this.output[id-(inlen+hidlen)]=node;
            return node;
        }
    }
}

class gene{
    innovation: number;
    start: number;
    end: number;
    weight: number;
    enabled: boolean;

    constructor(i: number, st: number, en: number, we: number, n: boolean){
        this.innovation=i;
        this.start=st;
        this.end=en;
        this.weight=we;
        this.enabled=n;
    }
}

class organism{
    genome: Array<gene>=[];
    maxNeuron: number=0;
    fitness: number=0;
    adjFitness: number=0;
    phenome: network;

    sort(){
        function compare(a,b){
            return a.innovation-b.innovation;
        }
        this.genome.sort(compare);
    }

    breed(other: organism): organism{
        let p1=this;
        let p2=other;

        if(p1.fitness<p2.fitness){
            swap(p1,p2);
        }

        let child=new organism();
        let i=0;
        let j=0;

        while(i<p1.genome.length && j<p2.genome.length){//when ended
            while(i<p1.genome.length && j<p2.genome.length && p1.genome[i].innovation==p2.genome[j].innovation){
                console.log("a "+i+" "+j);
                if(!p2.genome[j].enabled){
                    child.genome.push(p2.genome[j]);
                }
                else{
                    child.genome.push(p1.genome[i]);
                }
                i++;j++;
            }

            while(i<p1.genome.length && p1.genome[i].innovation<p2.genome[j].innovation){
                console.log("b "+i+" "+j);
                child.genome.push(p1.genome[i]);
                i++;
            }

            while(j<p2.genome.length && p1.genome[i].innovation>p2.genome[j].innovation){
                console.log("c "+i+" "+j);
                child.genome.push(p2.genome[j]);
                j++;
            }
        }

        return child;
    }

    generate(inputs: number, maxhidden: number, outputs: number){
        this.phenome=new network(inputs, maxhidden, outputs);
        let net=this.phenome;
        let seq=this.genome;

        for(let i=0; i<inputs; i++){
            net.nodeWrite(new node(nodeType.SENSOR, nodePlace.INPUT), i);
        }

        for(let i=0; i<seq.length; i++){
            if(seq[i].enabled){
                let s=net.nodeRead(seq[i].start);
                let e=net.nodeRead(seq[i].end);
                let w=seq[i].weight;

                if(s===undefined){
                    s=new node(nodeType.NEURON, nodePlace.HIDDEN);
                }
                if(e===undefined){
                    e=new node(nodeType.NEURON, nodePlace.HIDDEN);//but it could be out?
                }

                let lnk=new link(s, e, w);
                e.nodesIn.push(lnk);

                s=net.nodeWrite(s, seq[i].start);
                e=net.nodeWrite(e, seq[i].end);
            }
        }
    }

    evaluate(){

    }
}

class species{
    members: Array<organism>;
}

class generation{
    innovations: Array<Array<number>>;
    innovationCount: number=0;

    innovationCheck(gene: gene): number{
        let start=gene.start;
        let end=gene.end;

        if(this.innovations[start][end]===null || this.innovations[start][end]===undefined){
            this.innovationCount++;
            this.innovations[start][end]=this.innovationCount;
            return this.innovationCount;
        }
        else{
            return this.innovations[start][end];
        }
    }
}


var gn=new organism();
var a=new gene(0,0,1,9,false);
var b=new gene(2,0,2,3,true);
var c=new gene(8,1,2,4,true);
var d=new gene(10,2,3,5,true);
gn.genome=[a,b,c,d];

var gn2=new organism();
gn2.fitness=1;
var a=new gene(0,0,1,8,true);
var b=new gene(1,0,2,3,true);
var c=new gene(2,1,2,92,true);
var d=new gene(11,2,3,5,true);
gn2.genome=[a,b,c,d];

var gnc=gn.breed(gn2); //Akoma kai an den isxuei to i<length sts 162 kai meta, mpainei mesa sth while kai tinazetai sto innovation mesa sth while()
console.log(gnc);
