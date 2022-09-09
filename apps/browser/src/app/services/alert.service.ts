import { Injectable } from "@angular/core";
import { AlertController, LoadingController, ToastController, ToastOptions } from "@ionic/angular";

@Injectable()
export class AlertService {
  constructor(
    private readonly _loadingCtrl: LoadingController,
    private readonly _alertCtrl: AlertController,
    private readonly _toastCtrl: ToastController
  ) {}

  async presentAlert(title: string, message: string, type: 'ERROR' | 'SUCCESS' = 'ERROR') {
    await this.closeExistingCtrl();
    // build alert options
    const alert = await this._alertCtrl.create({
      header: title,
      message,
      buttons: ["OK"],
      cssClass: this._getAlertStyle(type),
    });
    // present alert
    await alert.present();
    return alert;
  }

  async presentToast(message: string, options: ToastOptions = {}) {
    const toast = await this._toastCtrl.create({
      message,
      ...options
    });
    await toast.present();
    return toast;
  }

  async closeExistingCtrl() {
    // check if there is an existing alert
    const alert = await this._alertCtrl.getTop();
    // if there is an existing alert, dismiss it
    if (alert) {
      await alert.dismiss();
    }
    // check if there is an existing loading
    const loading = await this._loadingCtrl.getTop();
    // if there is an existing loading, dismiss it
    if (loading) {
      await loading.dismiss();
    }
  }

  private _getAlertStyle(type: 'ERROR' | 'SUCCESS'| 'WARNING'| 'INFO') {
    switch (type) {
      case "ERROR":
        return "danger";
      case "SUCCESS":
        return "success";
      case "WARNING":
        return "warning";
      case "INFO":
        return "info";
      default:
        return "danger";
    }
  }
}
