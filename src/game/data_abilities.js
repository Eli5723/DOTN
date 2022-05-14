let i=0;
const BEHAVIOR = {
    POINT : 1 << i++,
    UNIT : 1 << i++,
    INSTANT : 1 << i++,
    PASSIVE : 1 << i++
};

const SECONDS = 1000;

let Abilities = {};
Abilities.Meat_Hook = {
    name : "Meat Hook",
    iconName : "Meat_Hook_icon",
    cooldown : 2 * SECONDS,
    cost: 25,
    id : 0, 
    range : 400,
    speed : 600,
    behavior : 0,

    active : function active(unit){
        let direction = Math.atan2(unit.y - y, unit.x - x) + Math.PI;
    }
};


Abilities.Long_Raze = {
    iconName : "raze_long",
    cooldown : 2 * SECONDS,
    cost: 25,
    id : 0, 
    range : 250,
    speed : 600,
    behavior : BEHAVIOR.INSTANT,

    active : function active(unit){
        let x = unit.pos.x + Math.cos(unit.dir) * this.range;
        let y = unit.pos.y + Math.sin(unit.dir) * this.range;

        unit.instance.point_effect_create(x, y, "raze");

        let hit = unit.instance.collect_radius(x,y, 64);

        hit.forEach((unitHit)=>{
            if (unitHit.team != unit.team)
                unitHit.magic_damage(250);
        });

        unit.mana -= this.cost;
    }
};

Abilities.Medium_Raze = {
    iconName : "raze_medium",
    cooldown : 2 * SECONDS,
    cost: 25,
    id : 0, 
    range : 150,
    speed : 600,
    behavior : BEHAVIOR.INSTANT,

    active : function active(unit){
        let x = unit.pos.x + Math.cos(unit.dir) * this.range;
        let y = unit.pos.y + Math.sin(unit.dir) * this.range;

        unit.instance.point_effect_create(x, y, "raze");

        let hit = unit.instance.collect_radius(x,y, 64);

        hit.forEach((unitHit)=>{
            if (unitHit.team != unit.team)
                unitHit.magic_damage(250);
        });

        unit.mana -= this.cost;
    }
};

Abilities.Short_Raze = {
    iconName : "raze_short",
    cooldown : 2 * SECONDS,
    cost: 25,
    id : 0, 
    range : 50,
    speed : 600,
    behavior : BEHAVIOR.INSTANT,

    active : function active(unit){
        let x = unit.pos.x + Math.cos(unit.dir) * this.range;
        let y = unit.pos.y + Math.sin(unit.dir) * this.range;

        unit.instance.point_effect_create(x, y, "raze");

        let hit = unit.instance.collect_radius(x,y, 64);

        hit.forEach((unitHit)=>{
            if (unitHit.team != unit.team)
                unitHit.magic_damage(250);
        });

        unit.mana -= this.cost;
    }
};

Abilities.Necromastery = {
    iconName : "necromastery",
    cooldown : .5* SECONDS,
    cost: 25,
    id : 0, 
    range : 400,
    speed : 600,
    behavior : BEHAVIOR.PASSIVE,
};

Abilities.Presence = {
    iconName : "presence",
    cooldown : 2 * SECONDS,
    cost: 25,
    id : 0, 
    range : 400,
    speed : 600,
    behavior : BEHAVIOR.PASSIVE,

    active : function active(unit){

    }
};

Abilities.Requiem = {
    iconName : "requiem",
    cooldown : 2 * SECONDS,
    cost: 25,
    id : 0, 
    range : 400,
    speed : 600,
    behavior : BEHAVIOR.INSTANT,


    effect(unit){
        unit.magic_damage(80);
    },

    active : function active(unit){
        let lines = 20;
        let diff = Math.PI*2 / lines;

        
        for (let i=0; i < lines; i++){
            unit.instance.linearProjectile_add(unit, diff*i, 128, 2, this.effect);
        }

        console.log(unit.pos.x);
    }
};

export {Abilities, BEHAVIOR};