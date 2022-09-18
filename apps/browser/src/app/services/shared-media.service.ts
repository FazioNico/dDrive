import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { IMediaFile } from "../interfaces/mediafile.interface";
import { ISharedMediaFile } from "../interfaces/shared-mediafile.interface";
import { NetwokNamePipe } from "../pipes/network-name.pipe";
import { DIDService } from "./did.service";
import { IPFSService } from "./ipfs.service";
import { LitService } from "./lit.service";
import { XMTPService } from "./xmtp.service";

@Injectable()
export class SharedMediaService {
  public readonly media$ = new BehaviorSubject<ISharedMediaFile[]>(null as any);

  constructor(
    private readonly _xmtpService: XMTPService,
    private readonly _ipfsService: IPFSService,
    private readonly _litService: LitService,
    private readonly _didService: DIDService
  ) {}

  async getMedias() {
    const conversations = await this._xmtpService.getPreviousMessagesFromExistingConverstion({
      startTime: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 31),
    });
    const medias = conversations        
      .map((message) => message.messagesInConversation)
      .flat()
      // filter only dDrive messages
      .filter((m) => m.content.startsWith('dDrive:'))
      // parse message
      .map((m) => this._parseMessage(m.content))
      .filter(Boolean);
    this.media$.next(medias as ISharedMediaFile[]);
    console.log('[INFO] {SharedMediaService} getMedias: ', medias);
  }

  private _parseMessage(value: string): ISharedMediaFile|undefined {
    const base64Message = value.replace('dDrive:', '')
    const jsonMessage = atob(base64Message);
    let file ;
    try {
      const sharedMediaFile: ISharedMediaFile = JSON.parse(jsonMessage);
      return file = sharedMediaFile;
    } catch (error) {
      console.log('[ERROR] {NotificationService} _parseMessage: ', error);
    }
    return file;
  }

  async downloadFile(file: IMediaFile) {
    console.log('[INFO] {SharedMediaService} downloadFile: ', file);
    const { cid } = file;
    if (cid) {
      const fileFromCID = await this._ipfsService.getFromCID(cid);
      const result: { file: File } = { file: fileFromCID };
      // decrypt file if needed
      if (file.encryptedSymmetricKey && file.accessControlConditions) {
        const chainName = new NetwokNamePipe().transform(this._didService.chainId$.value);
        const { decryptedArrayBuffer } = await this._litService.decrypt(
          fileFromCID,
          file.encryptedSymmetricKey,
          file.accessControlConditions,
          chainName
        );
        // convert array buffer to file and overwrite result object
        result.file = new File([decryptedArrayBuffer], file.name, { type: file.type });
      }
      // download file from browser
      const link = document.createElement('a');
      link.href = URL.createObjectURL(result.file);
      link.download = result.file.name || cid;
      link.click();
    } else {
      throw 'File CID not found';
    }
  }
}