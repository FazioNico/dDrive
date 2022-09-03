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
    
    // Request accounts from the Ethereum provider
    const accounts = await ethereumProvider.request({
      method: 'eth_requestAccounts',
    })
    .catch((err: any) => {
      throw `Error during Web3 Authetication: ${err?.message||'Unknown error'}`;
    });
    if ((accounts?.length||0) === 0) {
      throw 'No accounts found. Please unlock your Ethereum account, refresh the page and try again.';
    }
    this.chainId$.next(ethereumProvider.chainId);
    // Create an EthereumAuthProvider using the Ethereum provider and requested account
    const account: string = accounts[0];
    const authProvider = new EthereumAuthProvider(ethereumProvider, account)
    // Connect the created EthereumAuthProvider to the 3ID Connect instance so it can be used to
    // generate the authentication secret
    await this._threeID.connect(authProvider);
    this.accountId$.next(account);
    console.log('[INFO] create DID');      
    this.did = new DID({
      // Get the DID provider from the 3ID Connect instance
      provider: this._threeID.getDidProvider(),
    });
    return this.did;
  }
}