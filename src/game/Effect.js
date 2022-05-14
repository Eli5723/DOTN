import * as PIXI from 'pixi.js'

export class Effect extends PIXI.Sprite {
    constructor(){
        super();
        this.frames = -1;
        this.duration = -1;
        this.frame_length = -1;

        this.texture = PIXI.Texture.EMPTY;
        this.time = 0;
        this.frame = 0;
        this.anchor.x = .5;
        this.anchor.y = .5;   
    }

    set(def){
        this.frames = def.frames;
        this.duration = def.duration;
        this.frame_length = def.frame_length;

        this.texture = this.frames[0];
        this.time = 0;
        this.frame = 0;        
    }

    update(dt){
        if (!this.parent)
            return;

        this.time += dt;
        this.texture = this.frames[Math.floor((this.time / this.frame_length)) % this.frames.length];
        if (this.time > this.duration){
            this.parent.removeChild(this);
        }
    }
}