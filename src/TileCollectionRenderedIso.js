import TileCollection from './TileCollection.js'
import * as PIXI from 'pixi.js'

import * as Assets from './client/Assets.js'

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

let tilesetTexture;
let textures;

const ISO_WIDTH = 64;
const ISO_HEIGHT = 32;

const ISO_XOFF = ISO_WIDTH/2;
const ISO_YOFF = ISO_HEIGHT/2;


class TileCollectionRenderedIso extends TileCollection {

    constructor(){
        super();
        this.container = new PIXI.Container();
        this.container.x -= ISO_WIDTH/2;
        this.spriteColumns = {};
        this.tilesetTexture = Assets.getTexture("grass_tiles");
        this.textures = split(this.tilesetTexture,ISO_WIDTH);
    }

    getTileSprite(x,y){
        let column = this.spriteColumns[x];
        if (column){
            return column[y];
        }
    }

    getTileIso(x,y){
        let tx = Math.floor((x / ISO_XOFF + y / ISO_YOFF) /2);
        let ty = Math.floor((y / ISO_YOFF - (x / ISO_XOFF)) /2);

        return this.getTile(tx,ty);
    }

    setTile(x,y,type){
        let spriteColumn = this.spriteColumns[x];
        if (!spriteColumn){
            this.spriteColumns[x] = {};
        }

        //let sprite = ;
        if (this.spriteColumns[x][y] !== undefined) {
            this.spriteColumns[x][y].texture = this.textures[type];
        } else {
            let newSprite = new PIXI.Sprite(this.textures[type]);
            newSprite.x = (x - y) * ISO_XOFF;
            newSprite.y = (x + y) * ISO_YOFF;

            this.spriteColumns[x][y] = newSprite;
            this.container.addChild(newSprite);
        }

        return super.setTile(x,y,type);
    }

    static From(data){
        let newTileCollection = new TileCollectionRenderedIso();

        let columnCount = data.readByte(); // Number of columns
        for (let i = 0; i < columnCount; i++){
            let x = data.readByte(); // Column X position
            let rowCount = data.readByte();  // Number of items in column
            for (let j = 0; j < rowCount; j++){
                let y = data.readByte(); // Y position 
                let type = data.readByte(); // Item
                newTileCollection.setTile(x,y,type);        
            }
        }

        return newTileCollection;
    }

    load(data){
        let columnCount = data.readByte(); // Number of columns
        for (let i = 0; i < columnCount; i++){
            let x = data.readByte(); // Column X position
            let rowCount = data.readByte();  // Number of items in column
            for (let j = 0; j < rowCount; j++){
                let y = data.readByte(); // Y position 
                let type = data.readByte(); // Item
                this.setTile(x,y,type);        
            }
        }
    }

    removeTile(x,y,type){
        let tileSprite = this.getTileSprite(x,y);
        if (tileSprite)
            tileSprite.texture = PIXI.Texture.EMPTY;

        return super.removeTile(x,y,type);
    }
}

export default TileCollectionRenderedIso;