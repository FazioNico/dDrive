import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, LoadingController } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';
import { AlertService } from '../../services/alert.service';
import { AuthService } from '../../services/auth.service';

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
    private readonly _auth: AuthService,
    private readonly _alertService: AlertService,
  ) {}

  async ionViewDidEnter() {
    await this._auth.disconnectServices();
    window?.localStorage?.clear();
  }

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
    // use services to authenticate
    const isAuth = await this._auth.connectServices()
      .catch(async (err) => {
        // display error message
        console.error(err);
        await this._alertService.presentAlert('Error', err.message);
        return false;
      });
    // check result
    if (isAuth) {
      await this._router.navigate(['/drive'])
      .catch(() => {
        this.ionViewDidLeave();
      });
    }
    this._loadingCtrl.dismiss();
  }

}
