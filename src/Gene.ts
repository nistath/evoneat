export default class Gene{
    innovation: number;
    start: number;
    target: number;
    weight: number;
    enabled: boolean;

    constructor(s: number, t: number, w: number, e: boolean){
        this.start=s;
        this.target=t;
        this.weight=w;
        this.enabled=e;
        this.innovation=innovationCheck(this);
    }

    perturb(){
        if(Math.random()<pPerturbUniform){
            this.weight*=Math.random();
        }
        else{
            this.weight=newWeight();
        }
    }
}
