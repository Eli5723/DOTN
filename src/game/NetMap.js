// Defines a map used to sync entities across the client and server
// Requires the following interface:
// encode_initial
// deocde_initial
// encode_state
// id - uint16

class NetMap extends Map {
    constructor(){
        super();
        this.newEntries = [];
        this.removedEntries = [];
    }

    delete(key){
        super.delete(key);
        this.removedEntries.push(key);
    }

    set(key, val){
        super.set(key, val);
        this.newEntries.push(val);
    }

    // Encode Entire State
    encode_full(buffer){
        buffer.writeUInt16(this.size);
        this.forEach((item)=>{
            item.encode_initial(buffer);
        });
    }

    // Encode New Entries
    encode_new(buffer){    
        buffer.writeByte(this.newEntries.length);
        for (let i=0; i < this.newEntries.length; i++){
            let ent = this.newEntries[i];
            ent.encode_initial(buffer);
        }
        this.newEntries.length = 0;
    }

    // Encode Removals
    encode_removed(buffer){
        buffer.writeByte(this.removedEntries.length);
        for (let i=0; i < this.removedEntries.length; i++){
            buffer.writeUInt16(this.removedEntries[i]);
        }
        this.removedEntries.length = 0;
    }

    encode_state(buffer){
        buffer.writeUInt16(this.size);
        this.forEach((item, id)=>{
            item.encode_state(buffer);
        });
    }
};

class ClientNetMap extends Map {
    constructor(pool){
        super();
        this.pool = pool;
    }

    decode_full(data){
        let count = data.readUInt16();
 
        if (!count)
            return;
        
        let newItems = [];
        while (count--){
            let item = this.pool.get();
            item.decode_initial(data);
            this.set(item.id, item);
            newItems.push(item);
        }

        return newItems;
    }

    decode_new(data){
        let count = data.readByte();
 
        if (!count)
            return;

        let newItems = [];
        while (count--){
            let item = this.pool.get();

            item.decode_initial(data);
            this.set(item.id, item);
            newItems.push(item);
        }
        return newItems;
    }

    decode_removed(data){
        let count = data.readByte();
        if (!count)
            return;

        let removed = [];
        while (count--){
            let id = data.readUInt16();
            let item = this.get(id);
            this.delete(id);

            if (item){
                this.pool.retire(item);
                removed.push(item);
            }
        }
        return removed;
    }

    decode_state(data){
        let count = data.readUInt16();

        while (count--){
            let id = data.readUInt16();
            let item = this.get(id);

            if (item) {
                item.decode_state(data);
            }
        }
    }
}

export {NetMap, ClientNetMap}