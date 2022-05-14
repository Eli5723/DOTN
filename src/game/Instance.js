import IdGenerator from "../common/IdGenerator.js";
import SocketGroup from "../SocketGroup.js";
import TypedBuffer from "../common/TypedBuffer.js";
import EntityDictionary from "../common/EntityDictionary.js"

import MSG from "../MSG.js"

import { Unit, MovementCommand, InstantCastCommand, AttackCommand, COMMANDS, FollowCommand} from "./Units.js";

import {Team} from "./data_teams.js";

import {unit_definitions, UNIT_TYPE} from "./data_units.js";
import {item_definitions, } from "./data_items.js";


import TileCollection from '../TileCollection.js'
import EntityRecord from "../common/EntityRecord.js";
import { ACTION_FAIL } from "./Enum.js";
import { ObjectPool } from "./ObjectPool.js";

import { NetMap } from "./NetMap.js";

import {HomingProjectile, LinearProjectile} from './Projectile.js'

let InstanceIdGenerator = new IdGenerator();

let packet = TypedBuffer.getInstance();


class ItemInstance {
    constructor(itemDefinition){
        this.id = -1;
        this.player = -1;
        this.holder = -1;

        this.definition = itemDefinition;
        this.cooldownEnd = 0;
    }

    encode(buffer){
        buffer.writeUInt16(id);
        buffer.writeAscii(this.definition.name);
    }

    static From(data){
        let id = data.readUInt32();
        let name = data.readAscii();
        let itemInstance = new ItemInstance(itemDefinition);
        itemInstance.id = id;
        return itemInstance;
    }
}

export default class GameInstance {
    constructor(){
        this.id = InstanceIdGenerator.getId();
        
        this.idGenerator = new IdGenerator();
        this.teams = [
            new Team({
                name:"Neutral Creeps",
                color:"0xFFFFFF"
            }),
        
            new Team({
                name:"Radiant",
                color:"0x00FF00"
            }),
        
            new Team({
                name:"Dire",
                color:"0xFF0000"
            }),
        ];
        this.time = 0;

        this.units = new Map();
        this.authority = {};
        this.tileCollection = new TileCollection();
        this.players = new SocketGroup();
        this.edict = new EntityDictionary();

        this.items = new Map();
        this.itemIdGen = new IdGenerator();

        this.projectiles = new NetMap();
        this.projectilePool = new ObjectPool(HomingProjectile, 10);
        this.linearProjectilePool = new ObjectPool(LinearProjectile, 15);
        this.projectileIdGen = new IdGenerator();

        // Report new Units / Projectiles at the beginning of state update
        this.newEntities = [];
        this.deadEntities = [];

        this.newItems = [];
        this.destroyedItems = [];

        this.players.on(MSG.UNIT_COMMAND, this.net_unit_command.bind(this));
        this.item_add("blink");
    }

    // Networking
    player_add(socket, teamId){
        console.log(`Added player ${socket.id} to instance ${this.id}`);
        this.players.add(socket);
        socket.teamId = teamId;

        // Send Full State Update

        packet.writeByte(MSG.FULL_STATE); 
        packet.writeByte(teamId);

        this.tileCollection.serialize(packet);
        this.edict.serialize(packet);
        this.projectiles.encode_full(packet);

        // Team
        socket.send(packet.flush());

        let u = this.unit_add_owner(socket, teamId, "shadow_fiend",0,0);
        this.item_grant(u, "blink");
    }

    player_remove(socket){
        console.log(`Removed player ${socket.id} from instance ${this.id}`);
        this.players.remove(socket);
    }

    player_state(socket, data){
        
    }

    // Gameplay
    update(dt){
        this.time += dt;

        // Update Units
        this.units.forEach((unit, id)=>{
            unit.update(dt/1000);
        });

        // Move Projectiles
        this.projectiles.forEach((projectile)=>{
            projectile.update(dt/1000);
        });

        // Send State to players
        this.state_out(packet);
        let state = packet.flush();
        this.players.forEach((socket)=>{
            socket.send(state);
        });
    }

    state_out(packet){
        packet.writeByte(MSG.TICK_STATE);

        // World State
        packet.writeUInt32(this.time);

        // Report Dead Projectiles
        // packet.writeByte(this.deadProjectiles.length);
        // for (let i=0; i < this.deadProjectiles.length; i++){
        //     packet.writeUInt16(this.deadProjectiles[i].id);
        // }
        // this.deadProjectiles.length = 0;

        // Report New Projectiles
        // packet.writeByte(this.newProjectiles.length);
        // for (let i=0; i < this.newProjectiles.length; i++){
        //     this.newProjectiles[i].initialState(packet);
        // }
        // this.newProjectiles.length = 0;

        this.projectiles.encode_removed(packet);
        this.projectiles.encode_new(packet);
        this.projectiles.encode_state(packet);


        // Unit State
        packet.writeUInt16(this.units.size);
        this.units.forEach((unit, id)=>{
            packet.writeUInt16(id)
            unit.state_encode(packet);
        });

        this.projectiles.encode_state(packet);

        // packet.writeByte(this.projectiles.size);
        // this.projectiles.forEach((projectile, id)=>{
        //     packet.writeUInt16(id)
        //     projectile.state(packet);
        // });
    }

    unit_add(type, x, y){
        let definition = unit_definitions[type];
        if (!definition)
            throw `Attempted to load nonexistant unit type "${type}"`;
        
        let id = this.idGenerator.getId();
        let unit = new Unit(definition, x, y);

        unit.id = id;

        this.units.set(id, unit);
        this.edict.set(id, new EntityRecord(type,x,y));

        unit.instance = this;
        
        return unit;
    }

    unit_add_owner(owner, teamId, type, x, y){
        let definition = unit_definitions[type];
        if (!definition)
            throw `Attempted to load nonexistant unit type "${type}"`;
        
        let id = this.idGenerator.getId();
        let unit = new Unit(definition, x, y);

        unit.owner = owner;
        unit.id = id;
        unit.instance = this;
        this.units.set(id, unit);

        unit.team = teamId;

        let record = new EntityRecord(teamId, type,x,y);

        this.edict.set(id, record);

        this.authority[id] = owner;

        // Inform Players
        packet.writeByte(MSG.UNIT_ADD_GRANT);
        packet.writeUInt16(id);
        record.serialize(packet);
        owner.send(packet.getData());
        
        packet.overwriteHeader(MSG.UNIT_ADD);
        this.players.broadcastExclude(packet.flush(),owner);

        return unit;
    }

    unit_remove(id){
        let unit = this.units.get(id);
        this.units.delete(id);
        this.edict.delete(id);

        // Send to clients
        packet.writeByte(MSG.UNIT_REMOVE);
        packet.writeUInt16(id);

        this.players.broadcast(packet.flush());

    }

    // Unit Death
    unit_death(unit){
        if (unit.type == UNIT_TYPE.HERO){
            unit.respawn_time = 4;
        }
    }

    // Item Addition and removal
    item_grant(unit, type){
        let slot = unit.item_open_slot();
        let item = this.item_add(type);

        if (slot != -1){
            unit.items[slot] = item;
        } else {
            console.log("Couldn't find an open slot for items");
        }
    }

    item_add(type){
        let definition = item_definitions[type];
        if (!definition)
            throw `Attempted to load nonexistant item type "${type}"`;

        let item = new ItemInstance(definition);
        let id = this.itemIdGen.getId();

        item.id = id;
        
        this.items.set(id, item);

        return item;
    }

    item_remove(item){
        let id = item.id;
        this.items.delete(id);
    }

    item_drop(item, x, y){

    }

    // Homing Projectiles
    projectile_add(creator, target, damage, speed){
        let p = this.projectilePool.get();
        p.set(creator, target, damage, speed);
        p.instance = this;
        p.id = this.projectileIdGen.getId();

        this.projectiles.set(p.id, p);
    }

    projectile_destroy(p){
        this.projectiles.delete(p.id);
        p.pool.retire(p);
    }

    linearProjectile_add(creator, direction, speed, duration, effect){
        let p = this.linearProjectilePool.get();
        p.set(creator, direction, speed, duration, effect);
        p.instance = this;
        p.id = this.projectileIdGen.getId();
        
        this.projectiles.set(p.id, p);
    }

    // Utility
    collect_radius(x,y, radius){
        let units = [];

        this.units.forEach((unit)=>{

            let xx = unit.pos.x - x;
            let yy = unit.pos.y - y;

            let dist = Math.sqrt(xx*xx + yy*yy);


            if (dist <= radius)
                units.push(unit);

        });

        return units;
    }

    // Client Messages
    net_unit_command(socket, data){
        let unitId = data.readUInt16();
        let type = data.readByte();

        let unit = this.units.get(unitId);

        // Check if unit exists and can be controlled by the player
        if (!unit)
            return;

        switch(type){
            case COMMANDS.MOVE:  {
                let x = data.readInt32();
                let y = data.readInt32();
                unit.command_set(new MovementCommand(x,y));
            } break;

            case COMMANDS.STOP:{
                unit.command_stop();
            } break;
            
            case COMMANDS.INSTANT_CAST:{
                let slot = data.readByte();
                unit.command_set(new InstantCastCommand(slot));
            } break;

            case COMMANDS.ATTACK:{
                let toAttack = data.readUInt16();
                let unitAttacked = this.units.get(toAttack);
                if (!unitAttacked){
                    this.command_error(unit, ACTION_FAIL.INVALID);
                    return;
                }

                unit.command_set(new AttackCommand(unitAttacked));
            } break;

            case COMMANDS.FOLLOW:{
                let toFollow = data.readUInt16();
                let unitFollowed = this.units.get(toFollow);
                if (!unitFollowed){
                    this.command_error(unit, ACTION_FAIL.INVALID);
                    return;
                }
                unit.command_set(new FollowCommand(unitFollowed));
            } break;
        }
    }

    // Client Messages

    command_error(unit, type){
        packet.writeByte(MSG.COMMAND_ERROR);
        packet.writeUInt16(unit.id);
        packet.writeByte(type);

        unit.owner.send(packet.flush());
    }

    // TODO: Add to State Update
    cooldown_report(unitId, slot, cooldownEnd){
        packet.writeByte(MSG.REPORT_COOLDOWN);
        packet.writeUInt16(unitId);
        packet.writeByte(slot);
        packet.writeUInt32(cooldownEnd);
        this.players.broadcast(packet.flush())
    }

    // Effects
    point_effect_create(x,y,type){
        packet.writeByte(MSG.EFFECT_POINT);
        
        packet.writeInt32(x);
        packet.writeInt32(y);
        packet.writeAscii(type);

        this.players.broadcast(packet.flush());
    }
}

// Cooldown Report Format
// unit - UInt16
// slot - Byte
// cooldownEnd - UInt32'

