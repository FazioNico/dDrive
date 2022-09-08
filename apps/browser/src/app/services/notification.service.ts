import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { debounceTime, map, tap } from 'rxjs';
import { UserProfilService } from './user-profil.service';
import { XMTPConversation, XMTPConversationMessage, XMTPService } from './xmtp.service';

@Injectable()
export class NotificationService {
  public readonly notifications$ = this._xmtp.messages$.pipe(
    // formating messages to be displayed
    map((messages) =>
      messages
        .map((message) => {
          return message.messagesInConversation.map(this._parseMessage);
        })
        .flat()
    ),
    debounceTime(1000),
    // update the user profil `latestNotifedISODatetime` field
    // each time a new message is received from XMTP
    tap((messages) =>
      messages.length > 0
        ? this._userService
            .updateProfil({
              latestNotifedISODatetime: new Date().toISOString(),
            })
            .then(() =>
              console.log(
                '[INFO] {NOTIFService} User profil `latestNotifedISODatetime` updated'
              )
            )
        : null
    ),
    // update user `sharedDocument` list data
    tap((messages) => {
      // TODO: update user `sharedDocument` list data using `CeramicService`
    }),
    // clear `messages` BehaviorSubject after XXXXms
    // to avoid displaying the same messages twice
    tap((messages) => {
      if (messages.length > 0) {
        // clear messages
        const t = setTimeout(() => {
          this._xmtp.messages$.next([]);
          clearTimeout(t);
        }, 2500);
      }
    })
  );

  constructor(
    private readonly _xmtp: XMTPService,
    private readonly _userService: UserProfilService,
    private readonly _toastCtrl: ToastController
  ) {}

  async displayNotification(message: string) {
    const toast = await this._toastCtrl.create({
      message,
      duration: 5000,
      cssClass: 'notification-toast',
      icon: 'share-social',
      buttons: [
        {
          text: 'ok',
          role: 'cancel'
        }
      ],
    });
    await toast.present();
  }

  async sendNotification(conversation: XMTPConversation, message: string) {
    // TODO: implement this method
    throw 'Not implemented yet';
  }


  private _parseMessage(message: XMTPConversationMessage) {
    return message;
  }
}
