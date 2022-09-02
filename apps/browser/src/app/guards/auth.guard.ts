import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { providers } from 'ethers';
import { DIDService } from '../services/did.service';
import { CeramicService } from '../services/ceramic.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private _router: Router,
    private _did: DIDService,
    private _ceramic: CeramicService
  ) {}

  async canActivate(): Promise<boolean> {
    const ethereum: providers.ExternalProvider = (window as any)?.ethereum;
    const did = await this._did.init(ethereum);
    if (!did) {
      this._router.navigate(['login']);
      return false;
    }
    const profile = await this._ceramic.authWithDID(did);
    if (!profile) {
      this._router.navigate(['login']);
      return false;
    }
    return true;
  }

}
