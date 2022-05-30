# DOTN
Web Based Dota Game.  
Demo: https://youtu.be/9vw0K2W1O8c  

## Installation

Run the following Commands:

```
npm install
```

## Development Server

Run the following commands in parallel

```
npm run server
```

```
npx webpack serve
```
And navigate to localhost:8080. Warning: The game's sounds are exceptionally loud.

## Controls
The Camera is controlled via the arrow keys.  
You can input actions for your unit by pressing the "Ability" keys (q w e f)  

Pressing the "Stop" key, s, causes your unit to stop performing actions.  
Left Clicking a position on the ground causes your unit to move to that position.  
Left Clicking an allied unit causes your unit to follow that allied unit.  
Left Clicking an enemy unit causese your unit to begin attacking that unit.  
  
Inputting an action without holding shift overrides the unit's action queue.  
Inputting an action while holding shift causes the action to be be sent to the end of the unit's action queue.  
