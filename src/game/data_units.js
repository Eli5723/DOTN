// Unit Defintions

let i=0;
export const UNIT_TYPE = {
    NONE : 0,
    CREEP : 1 << i++,
    HERO : 1 << i++,
    BUILDING : 1 << i++,
    ANCIENT : 1 << i++,
};

export let unit_definitions = {};

unit_definitions.pudge = {
    NAME : "Pudge",
    
    HP : 1380,
    MANA : 100,
    REGEN : 25,
    TURNRATE : .03,
    MOVESPEED : 1000,

    RANGE : 32,

    DAMAGE : 100,
    ATTACKSPEED : 40,

    INT : 10,
    STR : 10,
    AGI : 10,

    MELEE : true,

    TYPE : UNIT_TYPE.HERO,

    TEXTURE : "pudge",
    
    ABILITIES : ["Meat_Hook"]
};

unit_definitions.shadow_fiend = {
    NAME : "Shadow Fiend",
    
    HP : 1380,
    MANA : 100,
    REGEN : 5,
    MANAREGEN : 10,
    TURNRATE : .03,
    MOVESPEED : 300,

    RANGE : 300,

    DAMAGE : 100,
    ATTACKSPEED : 40,
    BAT : .5,

    INT : 10,
    STR : 10,
    AGI : 10,

    MELEE : false,

    TYPE : UNIT_TYPE.HERO,

    TEXTURE : "shadow_fiend",
    PROJECTILE : "ghost",
    
    ABILITIES : ["Short_Raze","Medium_Raze","Long_Raze","Necromastery","Presence","Requiem"]
};