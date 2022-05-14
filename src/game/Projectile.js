import { angleBetween, distance } from "./Utility.js";

export class HomingProjectile {
    constructor(){
        this.instance = null;

        this.id = -1;
        this.x = 0;
        this.y = 0;
        
        this.creator = null;
        this.target = null;
        this.speed = 100;

        this.damage = 0;
    }

    set(creator, target, damage, speed){
        this.creator = creator;
        this.target = target;
        this.damage = damage;
        this.speed = speed;

        this.x = creator.pos.x;
        this.y = creator.pos.y;
    }

    update(dt){
        let dir = angleBetween(this, this.target.pos);
        let dist = distance(this, this.target.pos);
        let toMove = this.speed * dt;
        
        // HIT
        if (dist <= toMove){
            this.target.physical_damage(this.damage);
            this.instance.projectile_destroy(this);
            return;
        }

        this.x += Math.cos(dir) * toMove;
        this.y += Math.sin(dir) * toMove;
    }

    encode_initial(buffer){
        buffer.writeUInt16(this.id);
        buffer.writeUInt16(this.creator.id);
        buffer.writeUInt16(this.target.id);
    }

    encode_state(buffer){
        buffer.writeUInt16(this.id);
        buffer.writeInt32(this.x);
        buffer.writeInt32(this.y);
    }
}

export class LinearProjectile {
    constructor(){
        this.instance = null;

        this.id = -1;
        this.x = 0;
        this.y = 0;
        this.xsp = 0;
        this.ysp = 0;
        
        this.direction = 0;
        this.duration = 0;

        this.creator = null;
        this.hit = {};
        this.effect = ()=>{};
    }

    set(creator, direction, speed, duration, effect){
        this.creator = creator;

        this.direction = direction;
        this.xsp = Math.cos(direction) * speed;
        this.ysp = Math.sin(direction) * speed;
        this.duration = duration;
        this.effect = effect;

        this.x = creator.pos.x;
        this.y = creator.pos.y;
        this.hit = {};
    }

    update(dt){
        // Move Projectile
        this.x += this.xsp*dt;
        this.y += this.ysp*dt;

        // Check for Hits
        let hits = this.instance.collect_radius(this.x, this.y, 24);

        for (let i=0; i < hits.length; i++){
            let unit = hits[i]; 
            if (unit.team == this.creator.team || this.hit[unit.id])
                continue;

            this.hit[unit.id] = true;
            this.effect(unit);
        }


        // Check Duration
        this.duration-= dt;
        if (this.duration < 0) {
            this.instance.projectile_destroy(this);
        }
    }

    encode_initial(buffer){
        buffer.writeUInt16(this.id);
        buffer.writeUInt16(this.creator.id);
        buffer.writeUInt16(this.creator.id);
    }

    encode_state(buffer){
        buffer.writeUInt16(this.id);
        buffer.writeInt32(this.x);
        buffer.writeInt32(this.y);
    }
}
