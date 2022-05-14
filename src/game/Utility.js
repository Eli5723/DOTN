export function boundingBox(ent1,ent2){
    if (ent1.x < ent2.x + ent2.width &&
        ent1.x + ent1.width > ent2.x &&
        ent1.y < ent2.y + ent2.height &&
        ent1.y + ent1.height > ent2.y)
    return true;

    return false;
} 

export function sumOfSquares(x,y){
    return x*x + y*y;
}

export function distance(ent1,ent2){
    return Math.sqrt(sumOfSquares(ent1.x-ent2.x,ent1.y-ent2.y));
}

export function angleBetween(ent1,ent2){
    return Math.atan2(ent1.y-ent2.y, ent1.x-ent2.x) + Math.PI;
}

export function angleDifference(firstAngle, targetAngle){
    let diff = targetAngle - firstAngle;
    diff = (diff + Math.PI) % (Math.PI*2) - Math.PI;
    return diff;
}

export function within(ent, x, y){
    if (x >= ent.x && x <= ent.x+ent.width && y >= ent.y && y <= ent.y+ent.height)
        return true;
}

export function pointDist(ent,x1,y1,radius){
    let dx = (ent.x + ent.width/2) - x1;
    let dy = (ent.y + ent.height/2) - y1;

    let dist = Math.sqrt(dx*dx + dy*dy);

    if (dist < (radius + ent.width))
        return true;
    else
        return false;
}

const ISO_WIDTH = 64;
const ISO_HEIGHT = 32;

const ISO_XOFF = ISO_WIDTH/2;
const ISO_YOFF = ISO_HEIGHT/2;

//let tx = Math.floor((x / ISO_XOFF + y / ISO_YOFF) /2);
//let ty = Math.floor((y / ISO_YOFF - (x / ISO_XOFF)) /2);

export function Project(x,y){
    return {
        x: ((x / ISO_XOFF + y / ISO_YOFF) /2) * 32,
        y : ((y / ISO_YOFF - (x / ISO_XOFF)) /2) * 32
    }
}

// Utility Classes
export function Vec2(x,y){
    this.x = x;
    this.y = y;
};

export function BoundingBox(x,y,width,height) {
    this.pos = Vec2(x,y);
    this.size = Vec2(width,height);
};