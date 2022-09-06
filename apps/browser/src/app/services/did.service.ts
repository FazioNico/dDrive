import { EthereumAuthProvider, ThreeIdConnect } from '@3id/connect'
import { Injectable } from '@angular/core';
import { DID } from 'dids';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class DIDService {

  private readonly _threeID = new ThreeIdConnect();
  public did!: DID;
  public readonly accountId$ = new BehaviorSubject(null as any);
  public readonly chainId$ = new BehaviorSubject(null as any);

  async init(ethereumProvider: any) {    
    if (this.did) {
      console.log('[INFO] already authenticated');      
      return this.did;
    }
    // Request accounts from the Ethereum provider
    // if (ethereumProvider.send) {
    if (!ethereumProvider.request) {
      throw 'No request function found';
    }
    const accounts = await ethereumProvider.request({ method: 'eth_requestAccounts' })
      .catch((err: any) => {
        throw `Error during Web3 Authetication: ${err?.message||'Unknown error'}`;
      });
    if (ethereumProvider.isMetaMask) {
      (ethereumProvider as any).on('connect',(connectInfo: any) => {
        // console.log('connectInfo', connectInfo);
      });
      (ethereumProvider as any).on('chainChanged', (newNetwork: string) => {
        // When a Provider makes its initial connection, it emits a "network"
        // event with a null oldNetwork along with the newNetwork. So, if the
        // oldNetwork exists, it represents a changing network
        if (newNetwork) {
            window.location.href = '/login';
        }
      });
      (ethereumProvider as any).on('accountsChanged', (e:string[]) => {
        // Handle the new accounts, or lack thereof.
        // "accounts" will always be an array, but it can be empty.
        if (e) {
          window.location.href = '/login';
        }
      });
    }
    if ((accounts?.length||0) === 0) {
      throw 'No accounts found. Please unlock your Ethereum account, refresh the page and try again.';
    }
    this.chainId$.next(ethereumProvider?.chainId);
    // Create an EthereumAuthProvider using the Ethereum provider and requested account
    const account: string = accounts[0];
    const authProvider = new EthereumAuthProvider(ethereumProvider, account);
    // Connect the created EthereumAuthProvider to the 3ID Connect instance so it can be used to
    // generate the authentication secret
    await this._threeID.connect(authProvider);
    this.accountId$.next(account);
    // console.log('[INFO] create DID');      
    this.did = new DID({
      // Get the DID provider from the 3ID Connect instance
      provider: this._threeID.getDidProvider(),
    });
    return this.did;
  }
}