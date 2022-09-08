import { Injectable } from "@angular/core";
import { CeramicClient, CeramicClientConfig } from '@ceramicnetwork/http-client'
import { TileDocument } from '@ceramicnetwork/stream-tile'
import { getResolver as get3IDResolver } from '@ceramicnetwork/3id-did-resolver'
import { EthereumAuthProvider, ThreeIdConnect } from '@3id/connect'
import { DID } from 'dids'
import { DIDDataStore } from '@glazed/did-datastore';
import { IUserProfil } from "../interfaces/user-profil.interface";


@Injectable()
export class CeramicService {

    private readonly _db: CeramicClient = new CeramicClient('https://ceramic-clay.3boxlabs.com');
    private readonly _datastore: DIDDataStore = new DIDDataStore({ ceramic: this._db, model: this._getAliases() });
    private _mainDocuumentId!: string;

    get docId() {
      return this._mainDocuumentId;
    }

    async getAll() {
      if (!this._db?.did) {
        throw 'No DID found';
      }
      const {dDrive: {documentID = null} = {}} = await this._getProfileFromCeramic()||{};
      if (!documentID) {
        throw new Error('No documentID found');
      }
      this._mainDocuumentId = documentID;
      const datas = await this.getData(documentID);
      return datas;
    }

    async saveData(data: {
      [key: string|number]: any;
    }) {
      if (!this._db?.did) {
        throw 'No DID found';
      }
      console.log('authenticated');
      // The following call will fail if the Ceramic instance does not have an authenticated DID
      const doc = await TileDocument.create(this._db, data);
      const _id = doc.id.toString();
      // The stream ID of the created document can then be accessed as the `id` property
      return {_id};
    }

    async updateData(data: {
      [key: string|number]: any;
    }, docId?: string) {
      if (!data?.['_id'] && !docId) {
        throw new Error('No _id found');
      }
      if (!this._db?.did) {
        throw 'No DID found';
      }
      data['lastModifiedIsoDateTime'] =  new Date().toISOString();
      const doc = await TileDocument.load(this._db, docId||data['_id']);
      await doc.update(data);
      return {
        ...doc.content as any,
      };
    }

    async getData(key: string) {
      if (!this._db?.did) {
        throw 'No DID found';
      }
      const doc = await TileDocument.load(this._db, key);
      return {
        ...doc.content as any,
        _id: doc.id.toString()
      };
    }

    async deleteData(key: string) {
      if (!this._db?.did) {
        throw 'No DID found';
      }
      throw new Error('Not implemented');
      // return {hash};
    }
    
    async authWithDID(did: DID): Promise<{dDrive: IUserProfil}> {
      // set DID resolver with Ceramic 3ID resolver
      did.setResolver({
        ...get3IDResolver(this._db)
      });
      console.log('[INFO] Authenticate with DID provider');
      // Authenticate the DID using the 3ID provider from 3ID Connect, this will trigger the
      // authentication flow using 3ID Connect and the Ethereum provider
      await did.authenticate();
      this._db.did = did;
      // get user profil data
      let {dDrive = null} = await this._getProfileFromCeramic()||{};
      // create it not exists
      if (!dDrive) {
        dDrive = await this._setupProfile();
      } else {
        // update last connection date if exist
        await this.updateUserProfil({
          latestConnectionISODatetime: new Date().toISOString()
        });
      }
      // return user profil data without update `latestConnectionISODatetime`
      return {dDrive};
    }

    async updateUserProfil(value: Partial<IUserProfil>) {
      if (!this._db?.did) {
        throw 'No DID found';
      }
      const {dDrive: {documentID = null, ...previousProfilData} = {}} = await this._getProfileFromCeramic()||{};
      if (!documentID) {
        throw new Error('No documentID found');
      }
      // save the document `id` to the profile data
      const dDrive: IUserProfil = {
        ...previousProfilData,
        ...value,
        latestConnectionISODatetime: new Date().toISOString(),
        documentID,
      } as IUserProfil;
      const updatedProfil = { dDrive };
      await this._datastore.merge('BasicProfile', updatedProfil);
      return updatedProfil;
    }

    private async _getProfileFromCeramic() {
      try {
        //use the DIDDatastore to get profile data from Ceramic
        const profile: {dDrive: IUserProfil}|null = await this._datastore.get('BasicProfile')
        //render profile data to the DOM (not written yet)
        return profile;
      } catch (error) {
        console.error(error)
        return null;
      }
    }
   
    private async _setupProfile() {
      // create Document to store all files data
      const doc = await TileDocument.create(this._db, {
        files: [],
        lastModifiedIsoDateTime: new Date().toISOString()
      });
      // save the document `id` to the profile data
      const dDrive: IUserProfil = {
        latestConnectionISODatetime: new Date().toISOString(),
        creationISODatetime: new Date().toISOString(),
        documentID: doc.id.toString(),
      };
      await this._datastore.merge('BasicProfile', { dDrive });
      return dDrive;
    }

    private _getAliases() {
      return {
        schemas: {
            basicProfile: 'ceramic://k3y52l7qbv1frxt706gqfzmq6cbqdkptzk8uudaryhlkf6ly9vx21hqu4r6k1jqio',
        },
        definitions: {
            BasicProfile: 'kjzl6cwe1jw145cjbeko9kil8g9bxszjhyde21ob8epxuxkaon1izyqsu8wgcic',
        },
        tiles: {},
      }
    }
}