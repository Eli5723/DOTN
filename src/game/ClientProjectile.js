import * as PIXI from 'pixi.js'

export class ClientProjectile extends PIXI.Sprite {
    constructor(){
        super();

        this.id = -1;
        this.x = 0;
        this.y = 0;
        
        this.creator = null;
        this.target = null;

        this.damage = 0;
        this.anchor.x = .5;
        this.anchor.y = .5;
    }
    
    decode_initial(data){
        this.id = data.readUInt16();
        this.creator = data.readUInt16();
        this.target = data.readUInt16(); 
    }

    decode_state(data){
        let x = data.readInt32();
        let y = data.readInt32();

        let ox = this.x;
        let oy = this.y;

        this.x = (x - y);
        this.y = (x + y)*.5;
        
        this.rotation = Math.atan2(this.y - oy,this.x - ox); 
    }
}
