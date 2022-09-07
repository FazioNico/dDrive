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

    private readonly _threeID = new ThreeIdConnect();
    private readonly _db: CeramicClient = new CeramicClient('https://ceramic-clay.3boxlabs.com');
    private readonly _datastore: DIDDataStore = new DIDDataStore({ ceramic: this._db, model: this._getAliases() });
    private _mainDocuumentId!: string;

    get docId() {
      return this._mainDocuumentId;
    }

    async connect() {
      this._auth();
    }

    async getAll() {
      if (!this._db?.did) {
        await this._auth();
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
        await this._auth();
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
        await this._auth();
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
        await this._auth();
      }
      const doc = await TileDocument.load(this._db, key);
      return {
        ...doc.content as any,
        _id: doc.id.toString()
      };
    }

    async deleteData(key: string) {
      if (!this._db?.did) {
        await this._auth();
      }
      throw new Error('Not implemented');
      // return {hash};
    }
    
    async authWithDID(did: DID) {
      // set DID resolver with Ceramic 3ID resolver
      did.setResolver({
        ...get3IDResolver(this._db)
      });
      console.log('[INFO] Authenticate with DID provider');
      // Authenticate the DID using the 3ID provider from 3ID Connect, this will trigger the
      // authentication flow using 3ID Connect and the Ethereum provider
      await did.authenticate();
      this._db.did = did;
      await this._setupProfile();
      const profile = await this._getProfileFromCeramic();
      return profile;
    }

    async updateUserProfil(value: {latestConnectionISODatetime: string}) {
      if (!this._db?.did) {
        await this._auth();
      }
      const {dDrive: {documentID = null} = {}} = await this._getProfileFromCeramic()||{};
      if (!documentID) {
        throw new Error('No documentID found');
      }
      // save the document `id` to the profile data
      const dDrive: IUserProfil = {
        documentID,
        ...value
      };
      const updatedProfil = {  dDrive };
      await this._datastore.merge('BasicProfile', updatedProfil);
      const profile = await this._getProfileFromCeramic();
      return profile;
    }

    private async _auth() {
      if ((window as any)['ethereum'] == null) {
      throw new Error('No injected Ethereum provider found')
      }
      await this._authenticateWithEthereum((window as any)['ethereum']);
    } 

    private async _authenticateWithEthereum(ethereumProvider: any) {
      // Request accounts from the Ethereum provider
      const accounts = await ethereumProvider.request({
        method: 'eth_requestAccounts',
      })
      // Create an EthereumAuthProvider using the Ethereum provider and requested account
      const account = accounts[0];
      const authProvider = new EthereumAuthProvider(ethereumProvider, account)
      // Connect the created EthereumAuthProvider to the 3ID Connect instance so it can be used to
      // generate the authentication secret
      await this._threeID.connect(authProvider);
      console.log('[INFO] create CeramicClient');      
      const did = new DID({
        // Get the DID provider from the 3ID Connect instance
        provider: this._threeID.getDidProvider(),
        resolver: {
          ...get3IDResolver(this._db)
        },
      });
      console.log('[INFO] Authenticate with DID provider');
      // Authenticate the DID using the 3ID provider from 3ID Connect, this will trigger the
      // authentication flow using 3ID Connect and the Ethereum provider
      await did.authenticate();
      console.log('[INFO] Authenticated with DID provider with DID: ', did.id);      
      // The Ceramic client can create and update streams using the authenticated DID
      this._db.did = did;
      await this._setupProfile();
      const profile = await this._getProfileFromCeramic();
      console.log('>>>', profile);
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
      const {dDrive = null} = await this._getProfileFromCeramic()||{};
      if (!dDrive?.documentID) {
        // create Document to store all files data
        const doc = await TileDocument.create(this._db, {
          files: [],
          lastModifiedIsoDateTime: new Date().toISOString()
        });
        // save the document `id` to the profile data
        const updatedProfil = {
          dDrive: {
            documentID: doc.id.toString(),
          }
        }
        await this._datastore.merge('BasicProfile', updatedProfil);
      }
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