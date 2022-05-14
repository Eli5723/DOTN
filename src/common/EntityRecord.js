class EntityRecord extends Array {
    serialize(buffer){
        buffer.writeByte(this[0]); // Team
        buffer.writeAscii(this[1]); // Type
        buffer.writeByte(this.length-2); // Prop count
        for (let i = 2; i < this.length; i++){
            buffer.encodeTyped(this[i]); // Properties
        }
    }

    static From(data){
        let record = new EntityRecord();

        let teamId = data.readByte();
        record.push(teamId);

        let type = data.readAscii(); // Type
        record.push(type);
        
        let propCount = data.readByte(); // Prop Count

        for (let i= 0 ;i < propCount; i++) {
            record.push(data.decodeTyped()); // Properties
        }
        return record;
    }
}

export default EntityRecord;