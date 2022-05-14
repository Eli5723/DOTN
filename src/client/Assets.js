import * as PIXI from "pixi.js";
import {Howl} from "howler";

import {split, split_rect} from "./Split.js"

let contentBase = "./";

let images = {};

let texIdGen = 0;
let textures = {};
let textureArray = [];

let sounds = {};

let animation = {};

function setContentBase(path){
    contentBase = path;
}

async function load({base, images, sounds, animations}){

    contentBase = base;

    await Promise.all([

        ...images.map((path,index)=>loadImage(path,index)),
        ...sounds.map((path)=>loadSound(path))

    ]).then(()=>{
        for (let name in animations){
            let def = animations[name];
            let baseTexture = textures[def.texture];
            
            let frames = split_rect(baseTexture, def.width, def.height);
           
            animation[name] = {
                frames: frames,
                duration: def.duration,
                frame_length: def.frame_length,
            };
        }
        
    });
}

function baseName(path){
    return path.substring(path.lastIndexOf('/')+1,path.lastIndexOf('.'));
}

function loadImage(name,id){
    return new Promise((res,rej)=>{
        let path = contentBase + "tex/" + name;
        let baseName = name.substring(0,name.lastIndexOf('.'));

        let image = new Image();
        image.onload = ()=>{
            images[baseName] = image;
            image.width = image.naturalWidth;
            image.height = image.naturalHeight;

            let texture = PIXI.Texture.from(image);
            
            textures[baseName] = texture;


            textureArray[id] = texture;
            texture.id = id;
            
            res("Loaded Image");
        };
        image.onerror = ()=>{
            rej("Failed to load image: " + baseName);
        }
        image.src = path;
    })
}

function loadSound(name){
    let path = contentBase + 'sfx/' + name;
    let baseName = name.substring(0,name.lastIndexOf('.'));

    return new Promise((res,rej)=>{
        let sound = new Howl({
            src:[path]
        });

        sounds[baseName] = sound;
        sound.on('load',()=>{
            res("Loaded Sound");
        });
        sound.onloaderror = ()=>{
            rej("Failed to load sound: " + baseName);
        };
    });
}

function getTexture(url){
    return textures[url];
}

function getTextureId(id) {
    return textureArray[id];
}

export {images, sounds, animation,  load, getTexture, getTextureId, setContentBase};