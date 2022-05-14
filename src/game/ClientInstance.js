import * as PIXI from 'pixi.js'

import TileCollectionRenderedIso from "../TileCollectionRenderedIso.js"

import IdGenerator  from '../common/IdGenerator.js';
import EntityDictionary from '../common/EntityDictionary.js';
import EntityRecord from '../common/EntityRecord.js';

import * as Assets from '../client/Assets.js'

import {unit_definitions, UNIT_TYPE} from "./data_units.js";

import { STATUS, Unit } from "./Units.js";

import {Team} from "./data_teams.js";

import { HeroBar } from './GameUI.js';
import { ObjectPool } from './ObjectPool.js';

import { Effect } from './Effect.js';

import {ClientProjectile} from "./ClientProjectile.js"

import {angleBetween} from "./Utility.js"

import {ClientNetMap} from "./NetMap.js"

let heroBarPool = new ObjectPool(HeroBar, 15);
let effectPool = new ObjectPool(Effect,100);

export default class ClientGameInstance {
    constructor(){
        this.id = -1;
        
        this.time = 0;

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
        
        this.effects = {};
        this.effectIdGenerator = new IdGenerator(); 

        this.units = new Map();
        this.projectiles = new ClientNetMap(new ObjectPool(ClientProjectile,30));

        this.tileCollection = new TileCollectionRenderedIso();

        this.alliedTeam = 0;

        this.container = new PIXI.Container();
        this.container.addChild(this.tileCollection.container);

        this.edict = new EntityDictionary();
    }

    static From(data){
        let instance = new ClientGameInstance();
        
        instance.alliedTeam = data.readByte();

        // Load Map
        instance.tileCollection.load(data);

        // Edict (Initial Unit State)
        instance.edict.decode(data);

        instance.edict.forEach((record,id)=>{
            instance.unit_add(id, record[0], record[1], record[2], record[3]);
        });

        // Recieve New Projectiles 
        let newProjectiles = instance.projectiles.decode_full(data);
        if (newProjectiles){
            for (let i=0; i < newProjectiles.length; i++){
                let p = newProjectiles[i];
                let tex = instance.units.get(p.creator).projectile;
    
                p.texture = Assets.getTexture(tex);
                instance.container.addChild(p);
            }
        }

        // let count = data.readByte();
        // while (count--){
        //     let id = data.readUInt16();
        //     let creator = data.readUInt16();
        //     let target = data.readUInt16();

        //     let tex = instance.units.get(creator).projectile;

        //     let p = new ClientProjectile();
        //     p.id = id;
        //     p.creator = creator;
        //     p.target = instance.units.get(target);
        //     p.texture = Assets.getTexture(tex);
        //     instance.container.addChild(p);

        //     instance.projectiles.set(id, p);
        // }

        return instance;
    }

    // Unit Management
    unit_add(id, teamId, type, x, y){
        let definition = unit_definitions[type];
        if (!definition)
            throw `Attempted to load nonexistant unit type "${type}"`;
        
        let unit = new Unit(definition, x, y);

        unit.id = id;
        this.units[id] = unit;
        unit.instance = this;

        unit.team = teamId;

        this.edict.set(id, new EntityRecord(teamId, type, x, y));

        unit.sprite = new PIXI.Sprite(Assets.getTexture(unit.texture));
        unit.sprite.anchor.x = .5;
        unit.sprite.anchor.y = 1;

        unit.arrow = new PIXI.Sprite(Assets.getTexture("caret"));
        unit.sprite.addChild(unit.arrow);
        unit.arrow.rotation = unit.dir;


        unit.arrow.anchor.y = .5;
        unit.arrow.alpha = .5;

        // Add unit sprite
        this.container.addChild(unit.sprite);

        // Add unit healthbar
        switch (unit.type){
            case UNIT_TYPE.HERO:
                unit.healthbar = heroBarPool.get();
                unit.sprite.addChild(unit.healthbar);
                break;
        }

        if (unit.team == this.alliedTeam)
            unit.healthbar.ally();
        else
            unit.healthbar.enemy();

        unit.healthbar.update(unit.hp, unit.maxHP)

        this.units.set(id, unit);
        return unit;
    }

    unit_remove(id){
        let unit = this.units.get(id);
        this.units.delete(id);
        this.edict.delete(id);
        
        if (unit) {
            this.container.removeChild(unit.sprite);
            return unit;
        }
    }

    point_effect_add(data){
        // Position
        // Time
        
        let x = data.readInt32();
        let y = data.readInt32();
        let type = data.readAscii();

        let effect = effectPool.get();

        effect.set(Assets.animation[type]);

        effect.x = x - y;
        effect.y = (x + y)*.5;

        effect.instance = this;
        effect.id = this.effectIdGenerator.getId();

        this.effects[effect.id] = effect;
        this.container.addChild(effect);

        let sound = Assets.animation[type].sound;
        Assets.sounds["shadowraze"].play();
    }

    // Gameplay
    click_test(x,y){
        let unitIter = this.units.values();

        for (const unit of unitIter){
            if (unit.sprite.x - unit.sprite.width*.5 <= x && x <= unit.sprite.x + unit.sprite.width*.5 && unit.sprite.y - unit.sprite.height <= y && y <= unit.sprite.y)
                return unit;
        }

        return false;
    }

    state_in(data){
        let newTime = data.readUInt32();
        let dt = newTime - this.time;
        this.time = newTime;
        let count;

        // Remove Dead Projectiles
        // count = data.readByte();
        // while (count--){
        //     let id = data.readUInt16();
           
        //     let p = this.projectiles.get(id);
        //     this.projectiles.delete(id);

        //     if (p){
        //         this.container.removeChild(p);
        //     }
        // }
        let removed = this.projectiles.decode_removed(data);
        if (removed){
            removed.forEach((p)=>{
                p.parent.removeChild(p);
            })
        }

        let newProjectiles = this.projectiles.decode_new(data);
        if (newProjectiles){
            for (let i=0; i < newProjectiles.length; i++){
                let p = newProjectiles[i];
      
                let tex = this.units.get(p.creator).projectile;
    
                p.texture = Assets.getTexture(tex);
                this.container.addChild(p);
            }
        }

        this.projectiles.decode_state(data);

        // Units
        count = data.readUInt16();
        while (count--){
            let id = data.readUInt16();
            let unit = this.units.get(id);

            if (!unit)
                continue;

            unit.state_decode(data);

            unit.sprite.visible = !(unit.status & (STATUS.DEAD | STATUS.HIDE));
            if (!unit.sprite.visible)
                continue;

            unit.sprite.x = unit.pos.x - unit.pos.y;
            unit.sprite.y = (unit.pos.x + unit.pos.y) * .5;

            unit.healthbar.update(unit.hp, unit.maxHP);
            // unit.arrow.rotation = unit.dir;

            let xx = Math.cos(unit.dir);
            let yy = Math.sin(unit.dir);
    
            unit.arrow.rotation = Math.atan2((xx + yy) * .5, xx-yy) + Math.PI*2;
    
        }

        // // Update Projectile Locations
        // count = data.readByte();
        // while (count--){
        //     let id = data.readUInt16();
        //     let projectile = this.projectiles.get(id);

        //     let x = data.readInt32();
        //     let y = data.readInt32();

        //     projectile.x = x - y;
        //     projectile.y = (x + y)*.5;
        // }

        this.update(dt);
    }

    update(dt){
        for (let id in this.effects){
            this.effects[id].update(dt);
        }
    }

    team_set(teamId){
        console.log("Changed Allied Team to", teamId);
        this.alliedTeam = teamId;
        this.units.forEach((unit, id)=>{
            if (unit.team == teamId){
                unit.healthbar.ally();
            } else { 
                console.log("flipped")
                unit.healthbar.enemy();
            }
        });
    }


}