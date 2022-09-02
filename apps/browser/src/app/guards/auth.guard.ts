import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterOutletContract, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { providers } from 'ethers';
import { DIDService } from '../services/did.service';
import { CeramicService } from '../services/ceramic.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    // private _authProvider: ethers.providers.ExternalProvider,
    private _router: Router,
    private _did: DIDService,
    private _ceramic: CeramicService
  ) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot):  Promise<boolean> {

    const ethereum: providers.ExternalProvider = (window as any)?.ethereum;
    const did = await this._did.init(ethereum);
    const {profile, ...error} = await this._ceramic.authWithDID(did);
    if (!profile) {
      console.log('[ERROR]', error);
      this._router.navigate(['/login']);
      return false;
    }
    console.log('>>>', profile);
    return true;
  }
  
  private async _isAuthenticated(): Promise<boolean> {
    const ethereum: providers.ExternalProvider = (window as any)?.ethereum;
    const p = new providers.Web3Provider(ethereum);
    const [a] = await  p.listAccounts();
    
//     if (ethereum.request) {
//       ethereum.request({ method: "eth_disconnect" });
//       // const accounts = await ethereum.request({
//       //   method: "wallet_requestPermissions",
//       //   params: [{
//       //       eth_accounts: {}
//       //   }]
//       // }).then(()=> (ethereum as any).request({
//       //   method: 'eth_requestAccounts'
//       // }));
//       // console.log('>>>', accounts);
      
// ;
    
//       // const account = accounts[0]
//       // const permissions = await ethereum.request({
//       //   method: 'wallet_requestPermissions',
//       //   params: [{
//       //     eth_accounts: {},
//       //   }]
//       // });
//       // console.log('permissions', permissions);
      
//     }
    return true;
  }

  private async isAnonymous(): Promise<boolean> {
    return true;
  }

}
