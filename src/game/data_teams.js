export class Team {
    constructor(definition){
        this.name = definition.name;
        this.color = definition.color;

        this.players = new Map();
        this.units = new Map();
    }
}