import * as PIXI from 'pixi.js'

import Keyboard from './Keyboard.js'
import Mouse from './Mouse.js'

PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
let renderer = new PIXI.Renderer();
renderer.backgroundColor = "0xaddfe8";
let view = renderer.view;
let root = new PIXI.Container();

let world = new PIXI.Container();
let ui = new PIXI.Container();

root.addChild(world);
root.addChild(ui);

Mouse.setRenderer(renderer);
Mouse.setContainer(world);
Mouse.setView(view);

let attach = document.getElementById("attach");
let HTMLUI = document.createElement("div");
HTMLUI.style.width = "0px";
HTMLUI.style.height = "0px";
HTMLUI.style.position = "absolute";
HTMLUI.style.zIndex = "1000";
// HTMLUI.style.overflow = "hidden";
attach.appendChild(HTMLUI);

view.setAttribute('tabindex', -1);
view.onclick = function() {view.focus()};
view.onfocus = OnFocus;
view.onblur = OnBlur;
view.style.width = "100%";
view.style.height = "100%";
view.style.imageRender = "pixelated";
view.style.zIndex = "-1";
attach.appendChild(view);
view.focus();

attach.oncontextmenu = (e)=>{e.preventDefault();}

function OnFocus(){
    Keyboard.enable();
    Mouse.enable();
    Mouse.clear();
    console.log("Gained Focus");
    // attach.style.cursor = "none";
    // view.requestPointerLock();
}

function OnBlur(){
    Keyboard.clear();
    Keyboard.disable();
    Mouse.clear();
    Mouse.disable();
    console.log("Lost Focus");
    attach.style.cursor = "default";
}

new ResizeObserver(onResize).observe(view);
function onResize(){
    renderer.resize(view.offsetWidth,view.offsetHeight);
}

let Application = {
    onInit: ()=>{},
    ready: ()=>{loop();},
    onLoop: (time,dt)=>{},
    view,
    world,
    ui,
    HTMLUI
};

let time = Date.now(), dt = 0;
function loop(){
    // Time
    let newTime =  Date.now();
    dt = (newTime - time) / 1000;
    dt = Math.min(dt, 33/1000)
    time = Date.now();

    // Input
    Mouse.update();

    Application.onLoop(time, dt);

    // Finish Frame
    renderer.render(root);
    Keyboard.frameEnd();
    window.requestAnimationFrame(loop);
}

export default Application;