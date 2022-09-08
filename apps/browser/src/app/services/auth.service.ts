import { Injectable } from '@angular/core';
import { CeramicService } from './ceramic.service';
import { DIDService } from './did.service';
import { UserProfilService } from './user-profil.service';
import { XMTPService } from './xmtp.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly _did: DIDService,
    private readonly _ceramic: CeramicService,
    private readonly _xmtp: XMTPService,
    private readonly _userProfilService: UserProfilService
  ) {}

  async connectServices() {
    // Authenticate with DID
    await this._connectDID();
    // Connect ceramic
    await this._connectCeramic();
    // Connect xmtp
    this._connectXMTP();
    return true;
  }

  private async _connectDID() {
    const ethereum = (window as any)?.ethereum;
    const did = await this._did.init(ethereum);
    if (!did) {
      throw 'DID not initialized';
    }
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
