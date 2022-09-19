import { EthereumAuthProvider, ThreeIdConnect } from '@3id/connect'
import { Injectable } from '@angular/core';
import { DID } from 'dids';
import { BehaviorSubject } from 'rxjs';
import { ethers } from 'ethers';
import { environment } from '../../environments/environment';

@Injectable()
export class DIDService {

  // private readonly _threeID!: ThreeIdConnect;
  public did!: DID;
  public readonly accountId$ = new BehaviorSubject(null as any);
  public readonly chainId$ = new BehaviorSubject(null as any);
  public web3Provider!: ethers.providers.Web3Provider;
  public readonly availableChainsId = environment.availableChainsId;


  async init(ethereumProvider: any) { 
    if (this.did) {
      console.log('[INFO] already authenticated');      
      return this.did;
    }
    this.web3Provider = new ethers.providers.Web3Provider(ethereumProvider, 'any');
    // Request accounts from the Ethereum provider
    const accounts = await this.web3Provider
      .send('eth_requestAccounts', [])
      .catch((err: any) => {
        throw `Error during Web3 Authetication: ${err?.message||'Unknown error'}`;
      });
    if ((accounts?.length||0) === 0) {
      throw 'No accounts found. Please unlock your Ethereum account, refresh the page and try again.';
    }
    // console.log('[INFO] getNetwork(): ', await web3Povider.getNetwork());
    // listen event from provider
    this._listenEvent(this.web3Provider);
    const { chainId =  (await this.web3Provider?.getNetwork())?.chainId} = (this.web3Provider.provider as any);
    if (!chainId) {
      throw 'No chainId found. Please unlock your Ethereum account, refresh the page and try again.';
    }
    console.log('[INFO] chainId: ', chainId);    
    this.chainId$.next(chainId.replace('0x', ''));
    // Create an EthereumAuthProvider using the Ethereum provider and requested account
    const account: string = accounts[0];
    this.accountId$.next(account);
    // console.log('[INFO] create DID');      
    this.did = new DID();
    return this.did;
  }

  async connect() {
    const authProvider = new EthereumAuthProvider(this.web3Provider.provider, this.accountId$.value);
    // Connect the created EthereumAuthProvider to the 3ID Connect instance so it can be used to
    // generate the authentication secret
    const threeID = new ThreeIdConnect()
    await threeID.connect(authProvider);
    // Set the DID provider from the 3ID Connect instance
    this.did.setProvider(threeID.getDidProvider());
  }

  async disconnect() {
    if (!this.did) {
      return;
    }
    this.did = undefined as any;
  }

  private _listenEvent(web3Provider: ethers.providers.Web3Provider) {
    const {provider: defaultPprovider} = web3Provider;
    if (defaultPprovider && defaultPprovider.isMetaMask && (defaultPprovider as any).on) {
      (defaultPprovider as any).on('accountsChanged',  (accounts: string[]) => {
        window.location.reload(); 
      });
    }
    web3Provider.on('accountsChanged',  (accounts: string[]) => {
      window.location.reload();   
    });
    web3Provider.on("network", (newNetwork, oldNetwork) => {
      // When a Provider makes its initial connection, it emits a "network"
      // event with a null oldNetwork along with the newNetwork. So, if the
      // oldNetwork exists, it represents a changing network
      if (oldNetwork) {
          this.chainId$.next(newNetwork.replace('0x', ''));
          const isUnautorizzed = this._isUnauthorizedChain();
          if (isUnautorizzed) {
            window.location.reload(); 
          }
      }      
    });
  }

  private _isUnauthorizedChain(){
      const provider = this.web3Provider;
      const chainId = this.chainId$.value;
      if (!provider.send||!chainId) {
        throw 'No provider found';
      }
      // check if the user is connected to available network
      if (!(this.availableChainsId as any)[chainId]) {
       return true
      } else {
        return false;
      }
  }
}