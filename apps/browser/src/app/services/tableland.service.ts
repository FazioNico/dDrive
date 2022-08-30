import { Injectable } from "@angular/core";
import { connect, Connection, ConnectOptions, resultsToObjects } from '@tableland/sdk';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TablelandService {
    private _db!: Connection;

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
      // INSERT data into table
      const insertRes = await this._db.write(
        `INSERT INTO ${collection} (${keys.toString()}) VALUES (${values.toString()});`
      );
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
    
}