import WebSocket, {WebSocketServer} from 'ws';
import Connections from './Connections.js';
import SocketGroup from './SocketGroup.js'
import TypedBuffer from './common/TypedBuffer.js';

import MSG from './MSG.js';

import Instance from './game/Instance.js';
import EntityRecord from './common/EntityRecord.js';


const packet = TypedBuffer.getInstance();

// Game Coordinator
var wss = new WebSocketServer({
    host:"127.0.0.1",
    port: 8000
});

wss.on('listening',function(){
    let details = wss.address();
    console.log(`SERVER |  Listening on "${details.address}:${details.port}"`);
});

wss.on('connection',function(ws){
    console.log("Incoming Connection ", ws._socket.remoteAddress);
    Connections.register(ws);
    incoming.add(ws);
});

let incoming = new SocketGroup();
incoming.onAdd = (socket)=>{
    packet.writeByte(MSG.LOGIN_REQUEST);
    socket.send(packet.flush());
};

incoming.on(MSG.LOGIN_REQUEST, (socket, data)=>{
    let name = data.readAscii();
    socket.user = name;
    console.log(`Added player ${socket.user} to searching list`);
    searching.add(socket);
});


let flipper = 0;
let searching = new SocketGroup();
searching.onAdd = (socket)=>{
    let team = ((flipper++)%2 + 1);
    instances[0].player_add(socket, team);
};


// Game Servers
const TICKRATE = 64;
const DT = 1000/TICKRATE;

let instances = {};

instances[0] = new Instance();
let pudgewarsMap = [0,1,0,1,3,0,1,0,1,3,0,3,0,0,1,2,2,2,3,2,
    2,0,2,0,0,2,1,1,1,2,0,0,1,1,0,1,2,0,2,0,
    0,0,0,0,3,3,1,1,3,0,0,3,3,0,2,0,3,3,1,2,
    3,2,0,1,3,1,2,3,3,0,0,3,1,1,3,0,3,3,0,3,
    1,1,2,3,2,2,2,2,0,2,2,2,2,2,1,2,0,3,1,0,
    3,2,0,1,3,1,0,0,0,2,3,3,1,3,0,3,2,1,0,0,
    2,0,2,3,0,1,1,2,3,3,2,3,2,0,3,0,1,3,0,3,
    16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,
    22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,
    22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,
    22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,
    22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,
    14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,
    3,2,0,3,1,2,3,1,0,3,0,1,0,3,3,3,1,2,3,0,
    3,0,1,3,0,2,2,0,3,3,1,2,1,2,3,3,1,2,2,0,
    0,0,3,0,3,1,3,2,3,0,3,2,2,1,2,1,0,2,0,0,
    0,2,1,2,2,2,2,3,2,1,2,2,1,0,2,1,0,0,2,0,
    1,2,2,1,1,0,2,1,1,2,2,3,0,0,1,1,1,0,1,0,
    2,2,3,1,0,0,3,1,0,1,2,3,3,2,3,0,1,2,2,0,
    3,3,2,2,3,1,1,0,3,1,0,1,1,1,0,1,2,0,1,0];

pudgewarsMap.forEach((value,index)=>{
    let x = index %20;
    let y = Math.floor(index / 20);
    instances[0].tileCollection.setTile(x,y,value); 
});

let next_tick = Date.now() + DT;
function instance_run(){
    next_tick = Date.now() + DT;
    
    for (let id in instances){
        let instance = instances[id];
        instance.update(DT);

    }

    setTimeout(instance_run, next_tick - Date.now());
}

instance_run();