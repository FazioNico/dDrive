import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, LoadingController } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';

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
    private readonly _loadingCtrl: LoadingController
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
    await this._router.navigate(['/drive'])
    .catch((err) => {
      this.ionViewDidLeave();
    });
    this._loadingCtrl.dismiss();
  }
}
