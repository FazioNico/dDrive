import { Injectable } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { debounceTime, map, tap } from 'rxjs';
import { IMediaFile } from '../interfaces/mediafile.interface';
import { ISharedMediaFile } from '../interfaces/shared-mediafile.interface';
import { UserProfilService } from './user-profil.service';
import { XMTPService } from './xmtp.service';


@Injectable()
export class NotificationService {
  public readonly notifications$ = this._xmtp.messages$.pipe(
    // formating messages to be displayed
    map((messages) =>
      messages
        .map((message) => message.messagesInConversation)
        .flat()
        // filter only dDrive messages
        .filter((m) => m.content.startsWith('dDrive:'))
        // parse message
        .map((m) => this._parseMessage(m.content))

    ),
    debounceTime(1000),
    // update the user profil `latestNotifedISODatetime` field
    // each time a new notification is received from XMTP
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
    private readonly _toastCtrl: ToastController,
    private readonly _alertController: AlertController
  ) {}

  async displayNotification(message: string) {
    const toast = await this._toastCtrl.create({
      message,
      duration: 5000,
      cssClass: 'notification-toast',
      icon: 'information-circle',
      position: 'top',
      buttons: [
        {
          text: 'ok',
          role: 'cancel',
        },
      ],
    });
    await toast.present();
  }

  async sendNotification(
    fileMetaData: IMediaFile,
    senderAddress: string,
    destinationAddress: string
  ) {
    console.log(
      '[INFO] {NotificationService} notify shared users: ',
      destinationAddress
    );
    const { conversations = [] } = await this._xmtp.getConversations();
    let conversation = conversations.find(
      (c) => c.peerAddress === destinationAddress
    );
    if (!conversation) {
      console.log('[INFO] {NotificationService} conversation not found');
      conversation = await this._xmtp
        .startNewConversation(destinationAddress)
        .then(({ conversation }) => conversation)
        .catch(async (e) => {
          // TODO: display error with dedicated service
          console.log(
            '[ERROR] {NotificationService} startNewConversation: ',
            e
          );
          const ionAlert = await this._alertController.create({
            header: 'Caution',
            message:
              e?.message || 'An error occured while sending notification',
            buttons: ['OK'],
          });
          await ionAlert.present();
          return undefined;
        });
    }
    if (!conversation) {
      throw 'Error while creating conversation';
    }
    // convert JSON to base64 string
    const messageData: ISharedMediaFile = {
      metadata: fileMetaData,
      senderAddress,
      status: 'added',
      createdISODateTime: new Date().toISOString(),
    };
    const base64Data = `dDrive:${btoa(
      JSON.stringify(messageData)
    )}`;
    // notify shared user
    await this._xmtp.sendMessage(conversation, base64Data);
    console.log('[INFO] {NotificationService} message sent: ', base64Data);
  }

  private _parseMessage(value: string) {
    const base64Message = value.replace('dDrive:', '')
    const jsonMessage = atob(base64Message);
    let message = 'You have a new notification';
    try {
      const sharedMediaFile: ISharedMediaFile = JSON.parse(jsonMessage);
      message = `${sharedMediaFile.senderAddress} shared with you a new file: ${sharedMediaFile.metadata.name}`;
    } catch (error) {
      console.log('[ERROR] {NotificationService} _parseMessage: ', error);
    }
    return message;
  }
}
