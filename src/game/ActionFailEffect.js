
import * as PIXI from "pixi.js"

import { ACTION_FAIL } from "./Enum.js";


const ACTION_FAIL_STRINGS = [
    "Out of Mana",
    "Recharging...",
    "Ability Not Active",
    "Silenced!",
    "Cannot Act"
];

export const ACTION_FAIL_SOUNDS = [
    "deny_mana",
    "deny_cooldown",
    "deny_general",
    "deny_silence",
    "deny_general"
];

export class ActionFailEffect extends PIXI.Text {
    constructor(){
        super("", {fontFamily : 'Arial', fontSize: 36, fill : 0xFF0000, align : 'center'});
    }

    set(reason) {
        this.text = ACTION_FAIL_STRINGS[reason];
        this.alpha = 1;
    }

    update(dt){
        this.alpha -= dt;
        if (this.alpha < 0)
            this.parent.removeChild(this.text);
    }

}