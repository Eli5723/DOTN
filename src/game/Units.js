import {Abilities, BEHAVIOR} from "./data_abilities.js";

import {distance, angleBetween } from './Utility.js'

import {ACTION_FAIL} from './Enum.js'

// Utility Classes
function Vec2(x,y){
    this.x = x;
    this.y = y;
};

function BoundingBox(x,y,width,height) {
    this.pos = Vec2(x,y);
    this.size = Vec2(width,height);
};

// Enumerations
let i = 0;

export const COMMANDS = {
    MOVE: 0,
    INSTANT_CAST: 1,
    POINT_CAST: 2,
    UNIT_CAST: 3,
    STOP: 4,
    ATTACK: 5,
    FOLLOW: 6
};

export const STATUS = {
    NONE : 0,
    DEAD : 1 << i++,
    STUN : 1 << i++,
    SILENCE : 1 << i++,
    MUTE : 1 << i++,
    BREAK : 1 << i++,
    ROOT : 1 << i++,
    TAUNT : 1 << i++,
    ETHEREAL : 1 << i++,
    BLIND : 1 << i++,
    HIDE : 1 << i++,
    DISARM : 1 << i++,
    MOVING : 1 << i++,
};
export const STATUS_DISABLE = STATUS.STUN | STATUS.HIDDEN | STATUS.TAUNT;

// Command Types
export function MovementCommand(x,y){
    this.type = COMMANDS.MOVE;
    this.x = x;
    this.y = y;
}

export function InstantCastCommand(slot) {
    this.type = COMMANDS.INSTANT_CAST;
    this.slot = slot;
}

export function PointCastCommand(ability, x,y){
    this.type = COMMANDS.POINT_CAST;
    this.x = x;
    this.y = y;
    this.ability = ability;
}

export function UnitCastCommand(ability, unit){
    this.type = COMMANDS.UNIT_CAST;
    this.unit = unit;
    this.ability = ability;
}

export function AttackCommand(unit){
    this.type = COMMANDS.ATTACK;
    this.unit = unit;
}

export function FollowCommand(unit){
    this.type = COMMANDS.FOLLOW;
    this.unit = unit;
}


// Abiltiy Defintions
function AbilityInstance(abilityDefinition){
    this.cooldownEnd = 0;
    this.definition = abilityDefinition;
}
AbilityInstance.prototype.tryCast = function tryCast(unit, ...parameters){

}

// Unit Definitions
export class Unit {
        constructor(definition,x,y){
            this.id = -1;
            this.team = -1;
            this.definition = definition;
            
            this.name = definition.NAME;

            this.pos = new Vec2(x,y);
            this.size = new Vec2(10,10);
            this.clickBox = new Vec2(0,0,10,10);

            this.commands = [];
            this.maxHP = definition.HP;
            this.hp = definition.HP;
            this.hpRegen = definition.REGEN;

            this.baseHealth = 0;

            this.maxMana = definition.MANA;
            this.mana = definition.MANA;
            this.manaRegen = definition.MANAREGEN;

            this.int = definition.INT;
            this.str = definition.STR;
            this.agi = definition.AGI;

            this.melee = definition.MELEE;
            this.range = definition.RANGE;

            this.attackSpeed = definition.ATTACKSPEED;

            this.respawn_time = 0;

            this.damage = definition.DAMAGE;
            this.attackrate = 1;
            this.attacking = false;
            this.animation = 0;

            this.dir = 0; // East
            this.turnRate = definition.TURNRATE; //Radians per .03 seconds
            
            this.movespeed = definition.MOVESPEED;

            this.texture = definition.TEXTURE;
            this.projectile = definition.PROJECTILE;

            this.type = definition.TYPE;
            this.status = 0;

            this.abilities = [];
            //0 - 5 Main Inventory
            //6-8 Backpack
            //9 TP scrolls
            //10 Neutral Item
            this.items = [null, null, null, null, null, null, null, null, null, null, null];

            for (let i=0; i < definition.ABILITIES.length; i++){
                let name = definition.ABILITIES[i];

                if (!Abilities[name])
                    throw `Attempted to use nonexistant Ability: '${name}''`;

                this.abilities[i] = new AbilityInstance(Abilities[name]);
                this.abilities[i].slot = i;
            }

            // Commands
            this.commands = [];
        }

        state_encode(buffer){
            buffer.writeInt32(this.pos.x);
            buffer.writeInt32(this.pos.y);

            buffer.writeInt32(this.hp);
            buffer.writeInt32(this.mana);
            buffer.writeUInt32(this.status);

            buffer.writeFloat32(this.dir);
        }

        stats_encode(buffer){
            
        }

        state_decode(data){
            this.pos.x = data.readInt32();
            this.pos.y = data.readInt32();
            this.hp = data.readInt32();
            this.mana = data.readInt32();

            this.status = data.readUInt32();

            this.dir = data.readFloat32();
        }

        // Execute commands and apply buffs
        update(dt){
            if (this.status & STATUS.DEAD){
                this.respawn_time -= dt;
                if (this.respawn_time < 0){
                    this.respawn();
                } else {
                    return;
                }
            }

            this.hp = Math.min(this.maxHP, this.hpRegen*dt + this.hp);
            this.mana = Math.min(this.maxMana, this.manaRegen*dt + this.mana);

            // Execute commands
            if (this.commands.length == 0 || this.status & (STATUS_DISABLE)){
                return;
            }

            switch (this.commands[0].type){
                case COMMANDS.MOVE:
                    this.execute_move(dt, this.commands[0]);
                    break;

                case COMMANDS.INSTANT_CAST:
                    this.execute_instant_cast(this.commands[0]);
                    break;

                case COMMANDS.ATTACK:
                    this.execute_attack(dt, this.commands[0]);
                    break;

                case COMMANDS.FOLLOW:
                    this.execute_follow(dt, this.commands[0]);
                    break;
            }
        }

        respawn(){
            this.status = STATUS.NONE;
            this.hp = this.maxHP;
            this.mana = this.maxMana;
            this.command_clear();
        }

        attributes_calculate(){
            
        }

        stats_caclulate(){

        }

        magic_damage(amount){
            this.hp -= amount;

            if (this.hp < 0){
                this.die();
            }
        }

        physical_damage(amount){
            this.hp -= amount;

            if (this.hp < 0){
                this.die();
            }
        }

        die(){
            this.hp = 0;
            this.status = STATUS.DEAD;
            this.instance.unit_death(this);
        }

        set_cooldown(slot, time){
            this.abilities[slot].cooldownEnd = time + this.instance.time;
            this.instance.cooldown_report(unit.id, slot, unit.instance.time + this.cooldown);
        }

        // Item Management
        item_open_slot(){
            // Check Inventory and Backpack for an Open Space 
            for (let i=0; i < 9; i++){
                if (this.items[i] === null)
                    return i;
            }

            // No Open Slot
            return -1;
        }

        // Command Execution
        execute_move(dt, command){
            let dir = angleBetween(this.pos, command);
            let dist = distance(this.pos, command);
            let toMove = this.movespeed * dt;

            if (dist < toMove){
                this.pos.x += Math.cos(dir) * dist;
                this.pos.y += Math.sin(dir) * dist;
                this.dir = dir;
                this.command_finish();
                return;
            }

            this.pos.x += Math.cos(dir) * toMove;
            this.pos.y += Math.sin(dir) * toMove;
            this.dir = dir;
        }

        execute_attack(dt, command){
            // TODO: Move Into Position
            
            // Turn Towards
            this.dir = angleBetween(this.pos, command);
            
            // Begin Attack
            if (!this.attacking){
                this.animation = this.attackrate;
                this.attacking = true;
            }
            
            this.animation -= dt;
            
            if (this.animation <= 0){
                this.animation += this.attackrate;
                this.fire_attack(command.unit);
            }
        }

        execute_follow(dt, command){
            let dir = angleBetween(this.pos, command.unit.pos);
            let dist = distance(this.pos, command.unit.pos) - 32;
            let toMove = this.movespeed * dt;

            if (dist < toMove){
                this.pos.x += Math.cos(dir) * dist;
                this.pos.y += Math.sin(dir) * dist;
                this.dir = dir;
                return;
            }

            this.pos.x += Math.cos(dir) * toMove;
            this.pos.y += Math.sin(dir) * toMove;
            this.dir = dir;
        }

        execute_instant_cast(command){
            let ability = this.abilities[command.slot];
            if (!ability || !(ability.definition.behavior & BEHAVIOR.INSTANT)) {
                this.command_error(ACTION_FAIL.INACTIVE); // TODO: Report Invalid Command
                return;
            }

            if (ability.definition.cost > this.mana) {
                this.command_error(ACTION_FAIL.MANA); // TODO: Report Not Enough Mana
                return;
            }

            if (this.instance.time < ability.cooldownEnd){
                this.command_error(ACTION_FAIL.COOLDOWN);
                return
            }

            ability.definition.active(this);

            ability.cooldownEnd = this.instance.time + ability.definition.cooldown;
            this.instance.cooldown_report(this.id, ability.slot, ability.cooldownEnd);
            this.command_finish();  
        }

        command_finish(){
            this.attacking = false;
            this.commands.shift();
        }

        command_error(type){
            this.instance.command_error(this, type);
            this.commands.shift();
        }

        command_set(command) {
            this.attacking = false;
            this.commands = [command]; 
        }

        command_add(command) {
            this.commands.push(command);
        }

        command_clear(){
            this.attacking = false;
            this.commands = [];
        }

        command_stop(){
            this.commands = [];
        }

        fire_attack(unit){
            if (this.melee){
                unit.physical_damage(this.damage);
            } else {
                this.instance.projectile_add(this, unit, this.damage, 400);
            }
        }
};

