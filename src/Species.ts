class Species{
    members: Array<Organism>;
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
        let child: Organism;
        if(Math.random()<pCrossover){
            let p1=this.members[randInt(0,this.members.length-1)];
            let p2=this.members[randInt(0,this.members.length-1)];
            if(p1==p2){
                child=p1;
            }
            else{
                child=p1.crossover(p2);
            }
        }
        else{
            child=this.members[randInt(0,this.members.length-1)];
        }

        child.mutate();
        return child;
    }
}
