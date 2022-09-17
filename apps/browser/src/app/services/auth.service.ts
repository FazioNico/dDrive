import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { environment } from '../../environments/environment';
import { AlertService } from './alert.service';
import { CeramicService } from './ceramic.service';
import { DIDService } from './did.service';
import { LitService } from './lit.service';
import { UserProfilService } from './user-profil.service';
import { XMTPService } from './xmtp.service';

@Injectable()
export class AuthService {
  public readonly availableChainsId = environment.availableChainsId;
  constructor(
    private readonly _did: DIDService,
    private readonly _ceramic: CeramicService,
    private readonly _xmtp: XMTPService,
    private readonly _lit: LitService,
    private readonly _userProfilService: UserProfilService,
    private readonly _alertService: AlertService,
    private readonly _loadingCtrl: LoadingController,
  ) {}

  async checkNetwork() {
    const provider = this._did.web3Provider;
    const chainId = this._did.chainId$.value;
    if (!provider.send||!chainId) {
      throw 'No provider found';
    }
    console.log('checkNetwork', chainId, (this.availableChainsId as any)[chainId]);    
    // check if the user is connected to available network
    if (!(this.availableChainsId as any)[chainId]) {
      await this.switchNetwork();
    }
  }

  async switchNetwork() {
    // ask for switching network
    const alert = await this._alertService.presentAlert(
      'Switch network',
      'Please select network to connect to',
      'SUCCESS',
      {
        buttons: [
          { text: 'Cancel', role: 'cancel' },
          { text: 'OK', role: 'ok' },
        ],
        inputs: Object.entries(this.availableChainsId).map(
          ([key, value]) => ({
            name: value,
            label: value,
            value: key,
            type: 'radio',
          })
        )
      }
    );
    const { data: {values: chainId}, role } = await alert.onWillDismiss();  
    // if user clicked on ok
    if (role !== 'ok') {
      throw new Error('User canceled switch network request. Unable to authenticate.');
    }
    // display loader for a better UX
    const switchnetworkLoading = await this._loadingCtrl.create({
      message: 'Switching network...',
      spinner: 'lines',
      translucent: true,
    });
    await switchnetworkLoading.present();
    // request switch network
    await this._did.web3Provider.send('wallet_switchEthereumChain', [
      { chainId: `0x${chainId}` },
    ]);
    // close loader and open other loader with new message
    await switchnetworkLoading.dismiss();
    // redisplay loader for a better UX
    const loading = await this._loadingCtrl.create({
      message: 'Authenticating...',
      spinner: 'lines',
      translucent: true,
    });
    await loading.present();
  }

  async connectServices() {
    // Authenticate with DID
    await this._connectDID();
    // Connect ceramic
    await this._connectCeramic();
    // Connect xmtp
    this._connectXMTP();
    return true;
  }

  async disconnectServices() {
    await this._did.disconnect();
    await this._lit.disconnect();
    await this._xmtp.disconnect();
  }

  private async _connectDID() {
    const ethereum = (window as any)?.ethereum;
    const did = await this._did.init(ethereum);
    if (!did) {
      throw 'DID not initialized';
    }
    await this.checkNetwork();
    await this._did.connect();
  }

  private async _connectCeramic() {
    const { did } = this._did;
    const { dDrive } = (await this._ceramic.authWithDID(did)) || {};
    if (!dDrive) {
      throw 'No dDrive found';
    }
    this._userProfilService.userProfil$.next(dDrive);
  }

  private async _connectXMTP() {
    const {
      latestNotifedISODatetime,
      latestConnectionISODatetime,
      creationISODatetime,
    } = this._userProfilService.userProfil$.value;
    // check how is the most recent date
    const mostRecentDate = latestNotifedISODatetime
      ? latestNotifedISODatetime
      : [latestConnectionISODatetime, creationISODatetime]
          .filter(Boolean)
          .sort(
            (a, b) =>
              (b ? new Date(b).getTime() : new Date().getTime()) -
              (a ? new Date(a).getTime() : new Date().getTime())
          )
          .shift();
    console.log('mostRecentDate', mostRecentDate, [
      latestNotifedISODatetime,
      latestConnectionISODatetime,
      creationISODatetime,
    ]);
    // build options for xmtp messages fetching
    // this will only return messages that are newer than the `mostRecentDate` constante
    const opts = mostRecentDate
      ? {
          startTime: new Date(mostRecentDate),
          endTime: new Date(),
        }
      : undefined;
    // init xmtp service with options
    await this._xmtp.init(this._did.web3Provider, opts);
  }
}
