import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { DIDService } from '../services/did.service';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(
    private _router: Router,
    private _did: DIDService,
  ) {}

  async canActivate(
  ): Promise<boolean> {
    const isAuthenticate = this._did?.did?.authenticated;
    if (!isAuthenticate) {
      await this._router.navigate(['/login']);
      return false;
    }
    return true;
  }

}
