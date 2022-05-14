import * as PIXI from 'pixi.js'
import * as Assets from '../client/Assets.js'

const margin = 2;

const HEROBAR_SIZE_X = 78;
const HEROBAR_SIZE_Y = 16;

const HEROBAR_COLOR_ALLY = "0xacf663";
const HEROBAR_COLOR_ENEMY = "0xd73801";

export class HeroBar extends PIXI.Graphics {
    constructor(){
        super();
        this.color = HEROBAR_COLOR_ALLY;
        this.x = HEROBAR_SIZE_X * -.5;
        this.y = -64;
        this.value = 0;
        this.max = 0;
    }

    enemy(){
        this.color = HEROBAR_COLOR_ENEMY;
        this.update(this.value,this.max);
    }

    ally(){
        this.color = HEROBAR_COLOR_ALLY;
        this.update(this.value,this.max);
    }

    update(value,max){
        value = Math.max(0,value);

        this.value = value;
        this.max = max;

        this.clear();
        this.beginFill(0);
        this.drawRect(-margin, -margin, HEROBAR_SIZE_X + margin * 2, HEROBAR_SIZE_Y + margin * 2);
        this.beginFill(this.color);
        this.drawRect(0, 0, HEROBAR_SIZE_X * (value / max), HEROBAR_SIZE_Y);

		// Draw Ticks
		this.beginFill(0);
		let tickSize = (1000/max) * HEROBAR_SIZE_X;

		let i;
		for (i=1; i < value / 1000; i++){
			this.drawRect(i * tickSize, 0, 2, HEROBAR_SIZE_Y);
		}
		
		tickSize *= .25;
		for (i=1; i < value / 250; i++){
			this.drawRect(i*tickSize, 0, 1, HEROBAR_SIZE_Y);
		}
    }
}

class SpellIcon extends PIXI.Sprite {
    constructor(texture){
        super(texture);
        this.tint = 0xFFFFFF;
        this.text = new PIXI.Text('',{fontFamily : 'Arial', fontSize: 36, fill : 0xFFFFFF, align : 'center'});
        this.text.x = 32;
        this.text.y = 16;
        this.text.anchor.x =.5;
        this.addChild(this.text);
    }

    update(instance, unit){
        let time = unit.instance.time;
        this.tint = 0xFFFFFF;

        if (instance.definition.cost > unit.mana){
            this.tint += 0x003300;
        }

        if (instance.cooldownEnd < time){
            this.text.visible = false;
        } else {
            this.text.visible = true;
            this.tint -= 0x949494;
            this.text.text = Math.ceil((instance.cooldownEnd - time) / 1000);
        }
    }
}

export class Bar extends PIXI.Graphics {
    constructor(sizeX,sizeY, color){
        super();
        this.sizeX = sizeX;
        this.sizeY = sizeY;
        this.color = color;
        this.text = new PIXI.Text('?/?',{fontFamily : 'Arial', fontSize: 16, fill : 0xFFFFFF, align : 'center'});
        this.addChild(this.text);

        this.textRegen = new PIXI.Text('+?',{fontFamily : 'Arial', fontSize: 16, fill : 0xFFFFFF, align : 'right'});
        this.addChild(this.textRegen);
    }

    update(value,max,regenValue){
        this.clear();
        this.beginFill(this.color - 0x1F1F1F);
        this.drawRect(0, 0, this.sizeX, this.sizeY);
        this.beginFill(this.color);
        this.drawRect(0, 0, this.sizeX * (value / max), this.sizeY);

        this.text.text = `${Math.floor(value)}/${max}`;
        this.text.x = this.sizeX/2 - this.text.width/2;

        this.textRegen.text = `${regenValue >= 0 ? '+' : '-'}${regenValue}`;
        this.textRegen.x = this.sizeX - this.textRegen.width;
    }
}

export class UnitUI {
    constructor(){
        this.container = new PIXI.Container();
        
        this.abilityContainer = new PIXI.Container();
        this.container.addChild(this.abilityContainer);
        this.abilityContainer.y = 44;
        
        this.lifebar = new Bar(500,16,0x478D2D);
        this.manaBar = new Bar(500,16,0x3e62bd);
        this.container.addChild(this.lifebar);
        this.container.addChild(this.manaBar);
        this.manaBar.y = 20;

        this.abilityIcons = [];

        this.unit = false;

        for (let i =0; i<6;i++){
            let icon = new SpellIcon(Assets.getTexture["Meat_Hook_icon"]);

            icon.x = i * (64+4); 
            this.abilityIcons.push(icon);
            this.abilityContainer.addChild(icon);
        }
    }

    setUnit(unit){
        this.unit = unit;

        let i=0;
        for (; i < unit.abilities.length; i++){
            this.abilityIcons[i].visible = true;
            this.abilityIcons[i].texture = Assets.getTexture(unit.abilities[i].definition.iconName);
        }
        for (; i < 6; i++){
            this.abilityIcons[i].visible = false;
        }
    }

    update(){
        if (!this.unit)
            this.container.visible = false;
        else 
            this.container.visible = true;

        if (this.unit){
            for (let i=0; i < 6; i++){
                if (this.unit.abilities[i]){
                    this.abilityIcons[i].update(this.unit.abilities[i], this.unit);
                }
            }

            this.lifebar.update(this.unit.hp,this.unit.maxHP,this.unit.hpRegen);
            this.manaBar.update(this.unit.mana,this.unit.maxMana,this.unit.manaRegen);
        }
        
        this.container.x = (window.innerWidth/2 - this.container.width/2)
        this.container.y = (window.innerHeight - this.container.height-4);
    }
}
