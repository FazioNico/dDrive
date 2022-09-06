import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, LoadingController } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';
import { CeramicService } from '../../services/ceramic.service';
import { DIDService } from '../../services/did.service';

@Component({
  selector: 'd-drive-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
})
export class LoginPageComponent  {

  @ViewChild('loginButton', {read: ElementRef, static: true}) loginForm!: ElementRef<IonButton>;
  public readonly isAuthentcating$ = new BehaviorSubject(false as boolean);

  constructor(
    private readonly _router: Router,
    private readonly _loadingCtrl: LoadingController,
    private _did: DIDService,
    private _ceramic: CeramicService
  ) {}

  ionViewDidLeave() {
    this.isAuthentcating$.next(false);
    this.loginForm.nativeElement.disabled = false;
  }

  async login() {
    const loading = await this._loadingCtrl.create({
      message: 'Authenticating...',
      spinner: 'lines',
      translucent: true,
    });
    await loading.present();
    this.isAuthentcating$.next(true);
    this.loginForm.nativeElement.disabled = true;

    const isAuth = await this._connectServices();
    if (isAuth) {
      await this._router.navigate(['/drive'])
      .catch(() => {
        this.ionViewDidLeave();
      });
    }
    this._loadingCtrl.dismiss();
  }

  private async _connectServices() {
    // Authenticate with DID    
    const ethereum = (window as any)?.ethereum;
    const did = await this._did.init(ethereum);
    if (!did) {
      return false;
    }
    // Connect ceramic
    const profile = await this._ceramic.authWithDID(did);
    if (!profile) {
      return false;
    }
    return true;
  }
}
