export class Profile {
    constructor(name, id){
        this.name = name;
        this.id = id;
    }

    static decode(data){
        let name = data.readAscii();
        let id = data.readBigUInt64();
        return new Profile(name);
    }

    encode(buffer){
        buffer.writeAscii(this.name);
        buffer.writeBigUInt64(this.id);
    }
}