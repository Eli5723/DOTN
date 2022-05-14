import Net from './client/Net.js';
import MSG from './MSG.js'
import TypedBuffer from './common/TypedBuffer.js'

import Application from './client/Application.js'
import Keyboard from './client/Keyboard.js'
import Mouse from './client/Mouse.js'

import * as Assets from './client/Assets.js'
import ClientGameInstance from './game/ClientInstance.js';

import {Project} from './game/Utility.js'

import * as PIXI from 'pixi.js'

// Networking
let packet = TypedBuffer.getInstance();
let profile = "";

Application.onInit = async function(){
    const keyCode = (char)=>char.toUpperCase().charCodeAt(0);
    Keyboard.addControl("ability1", keyCode('Q'));
    Keyboard.addControl("ability2", keyCode('W'));
    Keyboard.addControl("ability3", keyCode('E'));
    Keyboard.addControl("ability4", keyCode('R'));
    
    Keyboard.addControl("ability5", keyCode('D'));
    Keyboard.addControl("ability6", keyCode('F'));
    
    Keyboard.addControl("stop", keyCode('S'));
    Keyboard.addControl("attack", keyCode('A'));

    Keyboard.addControl("cameraLeft", Keyboard.codes.LEFT_ARROW);
    Keyboard.addControl("cameraUp", Keyboard.codes.UP_ARROW);
    Keyboard.addControl("cameraDown", Keyboard.codes.DOWN_ARROW);
    Keyboard.addControl("cameraRight", Keyboard.codes.RIGHT_ARROW);

    await Assets.load({
        base: 'arts/',
        images:[    
            "caret.png",
            "pudge.png",
            "ghost.png",
            "hand.png",

            "shadow_fiend.png",
            "shadowraze.png",
            "raze_short.png",
            "raze_medium.png",
            "raze_long.png",
            "necromastery.png",
            "presence.png",
            "requiem.png",


            "grass_tiles.png",
            "meat_hook.png",
            "meat_chain.png",
            "Meat_Hook_icon.png",
            "Rearm_icon.png",
            "Phase_Shift_icon.png",
            "Earthbind_icon.png",
            "MoveCommand.png",
            "cursor.png",

            "items/blink.png"
        ],
        sounds: [
            "deny_cooldown.ogg",
            "deny_mana.ogg",
            "deny_general.wav",
            "deny_silence.mp3",
            "hook_impact.mp3",
            "shadowraze.mp3"

        ],
        animations: {
            raze:{
                texture: "shadowraze",        
                width:64,
                height:64,
                duration: 1000,
                frame_length: 100,
                sound: "shadowraze"
            },
        }
    });
    
    Net.connect(`ws://${GAME_ADDRESS}:${GAME_PORT}`);
    Application.ready();
}
Application.onInit();
let uiEffects = new PIXI.Container();
Application.ui.addChild(uiEffects);

Application.onLoop = (time, dt) => {
    if (!instance)
        return;
    // Camera Movement
    const CAMERA_SPEED = 1000;
    const EDGE_PAN_WIDTH = 20;
    
    if (Keyboard.keys.cameraDown.down)
        Application.world.pivot.y += CAMERA_SPEED * dt;
    else if (Keyboard.keys.cameraUp.down)
        Application.world.pivot.y -= CAMERA_SPEED * dt;
    if (Keyboard.keys.cameraRight.down)
        Application.world.pivot.x += CAMERA_SPEED * dt;
    else if (Keyboard.keys.cameraLeft.down)  
        Application.world.pivot.x -= CAMERA_SPEED * dt; 

    let hero = instance.units.get(main_unit);

    if (Mouse.pressed){
        // Check if a unit was clicked
        let clicked = instance.click_test(Mouse.x, Mouse.y);

        if (clicked) {
            if (clicked.team != hero.team)
               Command_Attack(clicked);
            else if (clicked.id != selected_unit)
                Command_Follow(clicked);
        } else {
            Command_Move(Mouse.x, Mouse.y);
        }    
    }
    
    if (Keyboard.keys.stop.pressed)
        Command_Stop();

    if (Keyboard.keys.ability1.pressed)
        Command_Cast_Instant(0);

    if (Keyboard.keys.ability2.pressed)
        Command_Cast_Instant(1);

    if (Keyboard.keys.ability3.pressed)
        Command_Cast_Instant(2);

    if (Keyboard.keys.ability4.pressed)
        Command_Cast_Instant(3);

    if (Keyboard.keys.ability5.pressed)
        Command_Cast_Instant(4);

    if (Keyboard.keys.ability6.pressed)
        Command_Cast_Instant(5);


    uiEffects.children.forEach((e)=>{
        e.update(dt);
    });
};

Net.on(MSG.LOGIN_REQUEST, (data)=>{
    //let name = window.prompt("Name");
    let name = "Test" + String.fromCharCode(Math.random()*26 + 'A'.charCodeAt(0));

    packet.writeByte(MSG.LOGIN_REQUEST);
    packet.writeAscii(name);
    Net.send(packet.flush());
});


let instance;
Net.on(MSG.FULL_STATE, (data)=>{
    // Unload existing map
    if (instance){
        Application.world.removeChild(instance.container);
    }

    instance = ClientGameInstance.From(data);

    Application.world.addChild(instance.container)
});

Net.on(MSG.TICK_STATE, (data)=>{
    // Unload existing map
    if (instance)
        instance.state_in(data);

    unitUI.update();
});



import { UnitUI } from './game/GameUI.js';
let unitUI = new UnitUI();
Application.ui.addChild(unitUI.container);


// Controls
const NOTHING = -1;
import { COMMANDS, Unit,  } from './game/Units.js';
import EntityDictionary from './common/EntityDictionary.js';
import EntityRecord from './common/EntityRecord.js';
import { ObjectPool } from './game/ObjectPool.js';

let selected_unit = NOTHING;
let main_unit = NOTHING;


// Server Messages
Net.on(MSG.UNIT_SET_MAIN, (data)=>{
    let id = data.readUInt16();
    main_unit = id;
    selected_unit = id;
});

Net.on(MSG.UNIT_ADD_GRANT, (data)=>{
    let id = data.readUInt16();
    let record = EntityRecord.From(data);
    instance.unit_add(id, record[0], record[1], record[2], record[3]);
    main_unit = id;
    selected_unit = id;


    unitUI.setUnit(instance.units.get(id));
});

Net.on(MSG.UNIT_ADD, (data)=>{
    let id = data.readUInt16();
    let record = EntityRecord.From(data);
    instance.unit_add(id, record[0], record[1], record[2], record[3]);
});

Net.on(MSG.UNIT_REMOVE, (data)=>{
    let id = data.readUInt16();
    instance.unit_remove(id);
});

Net.on(MSG.SET_TEAM, (data)=>{
    let teamId = data.readByte();
    instance.team_set(teamId);
})

Net.on(MSG.EFFECT_POINT, (data)=>{
    instance.point_effect_add(data);
});

Net.on(MSG.REPORT_COOLDOWN, (data)=>{
    let unitId = data.readUInt16();
    let slot = data.readByte();
    let time = data.readUInt32();

    let unit = instance.units.get(unitId);
    unit.abilities[slot].cooldownEnd = time;
})

Net.on(MSG.COMMAND_ERROR, (data)=>{
    let unitId = data.readUInt16();
    let type = data.readByte();
    createActionFailEffect(type);
});

// UI Effects
import {ActionFailEffect, ACTION_FAIL_SOUNDS} from './game/ActionFailEffect.js'
let failPool = new ObjectPool(ActionFailEffect, 5);

function createActionFailEffect(reason){
    let e = failPool.get();
    e.set(reason);
    e.x = unitUI.container.x; 
    e.y = unitUI.container.y - 50;

    uiEffects.addChild(e);

    Assets.sounds[ACTION_FAIL_SOUNDS[reason]].play();
}


/// Commands
function Command_Move(x,y){
    if (selected_unit == NOTHING)
        return; 

    let projected = Project(x,y);

    // Send Command
    packet.writeByte(MSG.UNIT_COMMAND);
    packet.writeUInt16(selected_unit);
    
    packet.writeByte(COMMANDS.MOVE);
    packet.writeInt32(projected.x);
    packet.writeInt32(projected.y);
    Net.send(packet.flush());
}

function Command_Stop(x,y){
    if (selected_unit == NOTHING)
        return; 

    let projected = Project(x,y);

    // Send Command
    packet.writeByte(MSG.UNIT_COMMAND);
    packet.writeUInt16(selected_unit);
    packet.writeByte(COMMANDS.STOP);

    Net.send(packet.flush());
}

function Command_Cast_Instant(slot){
    if (selected_unit == NOTHING)
        return; 


    // Send Command
    packet.writeByte(MSG.UNIT_COMMAND);
    packet.writeUInt16(selected_unit);
    packet.writeByte(COMMANDS.INSTANT_CAST);
    
    packet.writeByte(slot);
    Net.send(packet.flush());
}


function Command_Attack(toAttack){
    if (selected_unit == NOTHING)
        return; 

    packet.writeByte(MSG.UNIT_COMMAND);
    packet.writeUInt16(selected_unit);
    packet.writeByte(COMMANDS.ATTACK);
    
    packet.writeUInt16(toAttack.id);
    Net.send(packet.flush());
}

function Command_Follow(toFollow){
    if (selected_unit == NOTHING)
        return; 

    packet.writeByte(MSG.UNIT_COMMAND);
    packet.writeUInt16(selected_unit);
    packet.writeByte(COMMANDS.FOLLOW);
    
    packet.writeUInt16(toFollow.id);
    Net.send(packet.flush());
}