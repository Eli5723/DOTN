export class ObjectPool {
    constructor(type, count){
        this.type = type;
        this.items = [];
        this.idGen = 0;

        while (count--) {
            let n = new type();
            n.pool = this;
            this.items.push(n);
        }
    }   

    get(){
        if (this.items.length == 0) {
            let n = new this.type(); 
            n.pool = this;
            return n;
        }

        return this.items.pop();
    }

    retire(object){
        this.items.push(object);
    }
}