// Used to split textures
import * as PIXI from "pixi.js"


function split(atlas,size){
    var i;
    var textures=[];

    let tex = atlas.baseTexture;
    let w = tex.width/size,
        h = tex.height/size;
    let count = w*h;

    let x,y;
    for (i=0;i<count;i++){
        x = (i%w)*size;
        y = Math.floor(i/w)*size;
        textures.push(new PIXI.Texture(atlas, new PIXI.Rectangle(x,y,size,size)));
    }

    return textures;
}

function split_rect(atlas,width,height){
    var i;
    var textures=[];

    let tex = atlas.baseTexture;
    let w = tex.width/width,
        h = tex.height/height;
    let count = w*h;

    let x,y;
    for (i=0;i<count;i++){
        x = (i%w)*width;
        y = Math.floor(i/w)*height;
        textures.push(new PIXI.Texture(atlas, new PIXI.Rectangle(x,y,width,height)));
    }

    return textures;
}

export {
    split,
    split_rect
};