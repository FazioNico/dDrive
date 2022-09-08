import { Injectable } from '@angular/core';
import { map, tap } from 'rxjs';
import { UserProfilService } from './user-profil.service';
import { XMTPConversationMessage, XMTPService } from './xmtp.service';

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
    // update the user profil `latestNotifedISODatetime` field
    // each time a new message is received from XMTP
    tap((messages) =>
      messages.length > 0
        ? this._userService
            .updateProfil({
              latestNotifedISODatetime: new Date().toISOString(),
            })
            .then(() => console.log('[INFO] {NOTIFService} User profil `latestNotifedISODatetime` updated'))
        : null
    )
  );

  constructor(
    private readonly _xmtp: XMTPService,
    private readonly _userService: UserProfilService
  ) {}

  private _parseMessage(message: XMTPConversationMessage) {
    return message;
  }
}
