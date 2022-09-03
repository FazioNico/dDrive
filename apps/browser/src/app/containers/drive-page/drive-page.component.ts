import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';
import { DIDService } from '../../services/did.service';

@Component({
  selector: 'd-drive-drive-page',
  templateUrl: './drive-page.component.html',
  styleUrls: ['./drive-page.component.scss'],
})
export class DrivePageComponent {
  public readonly isProduction: boolean = environment.production;
  public readonly accountId$ = this._didService.accountId$.asObservable();
  public readonly chainId$ = this._didService.chainId$.asObservable();
  constructor(
    private readonly _didService: DIDService
  ) {}
}
