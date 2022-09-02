import { Injectable } from "@angular/core";
import { connect, Connection, ConnectOptions, resultsToObjects, SUPPORTED_CHAINS } from '@tableland/sdk';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TablelandService {
    private _db!: Connection;

    constructor() {
      // this.connect()
      //     .then(async () => {
      //       const tables = await this._db.list();
      //       console.log('[INFO] Existing Tableland Tables: ', tables);
      //     });
    }

    async connect(options: ConnectOptions = { network: "testnet", chain: "polygon-mumbai" }) {
      try {
        this._db = await connect(options);
      } catch (error: any) {
        throw error?.message|| 'Tableland connection failed';
      }
    }

    async saveData(collection: string, data: {
      [key: string|number]: any;
    }) {
      if (!this._db) {
        await this.connect();
      }
      // formating collection name
      collection = collection.toLowerCase().replace(/ /g, '_').replace(/-/g, '_');
      const { _id = uuidv4()} = data;
      const keys = Object.keys(data);
      const values = Object.values(data).map(v => String(v));
      // add the _id if not present
      if (!keys.includes('_id')) {
        keys.push('_id');
        values.push(_id);
      }
      // request db
      const tables = await this._db.list();
      console.log('[INFO] tables', tables); 
      let collectionTable = Object.values(tables).find(t => t.name.includes(collection));
      console.log('[INFO] collectionTable', collectionTable);      
      if (!collectionTable) {
        const q = `${keys.map((key) => `${key} text`).join(', ')}, _id text`;
        console.log('[INFO] Creating table:', collection, q);        
        const result = await this._db.create(q, {prefix: collection});
        console.log('[INFO] Table created:', result);  
        collectionTable = {
          name: result.name||collection,
          controller: 'current_user_address',
          structure: result.txnHash,
          createdAt: new Date().toISOString(),
        }     
      }
      // INSERT data into table
      const q = `INSERT INTO ${collectionTable.name} (${keys.toString()}) VALUES (${values.map(v => (`'${v}'`)).toString()})`;
      console.log('[INFO] Inserting data:', q);      
      const insertRes = await this._db.write(q);
      // extract the `hash` from the result
      const { hash } = insertRes;
      // return the `hash` with `_id`
      return {hash, _id};
    }

    async updateData(collection: string, data: {
      [key: string|number]: any;
    }) {
      if (!this._db) {
        await this.connect();
      }
      // formating collection name
      collection = collection.toLowerCase().replace(/ /g, '_').replace(/-/g, '_');
      // request db
      const tables = await this._db.list();
      const collectionTable = tables.find(t => t.name === collection);
      if (!collectionTable) {
        throw new Error(`Collection ${collection} not found`);
      }
      const { _id } = data||uuidv4();
      const keys = Object.keys(data);
      const values = Object.values(data);
      // add the _id if not present
      if (!keys.includes('_id')) {
        keys.push('_id');
        values.push(_id);
      }
      // UPDATE data into table
      const query = `UPDATE ${collection} SET ${keys.map((key, index) => `${key} = '${values[index]}'`).join(', ')} WHERE _id = '${_id}';`;
      const insertRes = await this._db.write(query);
      // extract the `hash` from the result
      const { hash } = insertRes;
      // return the `hash` with `_id`
      return {hash, _id};
    }

    async getData(collection: string, key: string) {
      if (!this._db) {
        await this.connect();
      }
      // formating collection name
      collection = collection.toLowerCase().replace(/ /g, '_').replace(/-/g, '_');
      // request db
      const tables = await this._db.list();
      const collectionTable = tables.find(t => t.name === collection);
      if (!collectionTable) {
        throw new Error(`Collection ${collection} not found`);
      }
      const results = await this._db.read(
        `SELECT * FROM ${collection} WHERE _id = '${key}';`
      );
      const entries = resultsToObjects(results);
      return entries;
    }

    async deleteData(collection: string, key: string) {
      if (!this._db) {
        await this.connect();
      }
      // formating collection name
      collection = collection.toLowerCase().replace(/ /g, '_').replace(/-/g, '_');
      // request db
      const tables = await this._db.list();
      const collectionTable = tables.find(t => t.name === collection);
      if (!collectionTable) {
        throw new Error(`Collection ${collection} not found`);
      }
      const results = await this._db.write(
        `DELETE FROM ${collection} WHERE _id = '${key}';`
      );
      console.log(results)
      const { hash } = results;
      return {hash};
    }
    
    private _getValueType(values: any[],i: number){
      const e = values[i];
      const valuueType =  typeof e;
      if (valuueType === 'string') {
        return 'text';
      } else if (valuueType === 'number') {
        return 'integer';
      } else if (valuueType === 'boolean') {
        return 'text';
      } else {
        return 'text';
      }
    }
}